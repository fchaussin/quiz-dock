import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm, useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  GripVertical,
  History,
  LayoutTemplate,
  MonitorPlay,
  Pencil,
  Play,
  Plus,
  Radio,
  Save,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MarkdownEditor } from '@/components/markdown-editor';
import { Markdown } from '@/components/markdown';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createSession } from '../game/game-client';
import type { QuizDetailDto } from '../api/generated/model';
import { quizItems, moveItem, type QuizItem } from '@/lib/quiz-items';
import { useMediaQuery } from '@/lib/use-media-query';
import { useUnsavedGuard } from '@/lib/use-unsaved-guard';
import { Drawer } from '@/components/ui/drawer';
import { QuestionForm } from './question-form';
import { SlideForm } from './slide-form';
import {
  useSlidesControllerRemove,
  useSlidesControllerReorderItems,
} from '../api/generated/slides/slides';
import {
  getQuizzesControllerGetQueryKey,
  getQuizzesControllerListQueryKey,
  useQuizzesControllerFeedback,
  useQuizzesControllerGet,
  useQuizzesControllerRemove,
  useQuizzesControllerTransition,
  useQuizzesControllerUpdate,
} from '../api/generated/quizzes/quizzes';
import { useQuestionsControllerRemove } from '../api/generated/questions/questions';
import { editorRoute } from '../router';

export function EditorPage() {
  const { t } = useTranslation(['editor', 'common']);
  const { quizId } = editorRoute.useParams();
  const { data, isLoading, error } = useQuizzesControllerGet(quizId);

  if (isLoading) return <p className="text-muted-foreground">{t('common:loading')}</p>;
  if (error || !data) return <p className="text-destructive">{t('notFound')}</p>;
  return <QuizEditor quiz={data.data} />;
}

function QuizEditor({ quiz }: { quiz: QuizDetailDto }) {
  const { t } = useTranslation(['editor', 'common']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const update = useQuizzesControllerUpdate();
  const transition = useQuizzesControllerTransition();
  const removeQuiz = useQuizzesControllerRemove();
  const removeQuestion = useQuestionsControllerRemove();
  const removeSlide = useSlidesControllerRemove();
  const reorder = useSlidesControllerReorderItems();
  type Editing = string | 'new' | 'new-slide' | null;
  const [editing, setEditing] = useState<Editing>(null);
  // Unsaved edits in the open item form: switching item or closing asks first.
  const [formDirty, setFormDirty] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<Editing | undefined>(undefined);
  const onFormDirty = useCallback((d: boolean) => setFormDirty(d), []);
  const closeForm = useCallback(() => {
    setFormDirty(false);
    setEditing(null);
  }, []);
  // Below `lg` the open form lives in a bottom sheet instead of inline in the list.
  const wide = useMediaQuery('(min-width: 1024px)');
  const requestEditing = (next: Editing) => {
    if (editing !== null && formDirty && next !== editing) setPendingEdit(next);
    else {
      setFormDirty(false);
      setEditing(next);
    }
  };
  const [livePin, setLivePin] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [presentError, setPresentError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Capture intégrale (§2.10) : conserve le détail des réponses par participant.
  // Décidée avant le lancement de la partie (fige le snapshot côté serveur).
  const [fullCapture, setFullCapture] = useState(false);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getQuizzesControllerGetQueryKey(quiz.id) }),
      queryClient.invalidateQueries({ queryKey: getQuizzesControllerListQueryKey() }),
    ]);

  const form = useForm({
    defaultValues: {
      title: quiz.title,
      description: quiz.description ?? '',
      language: quiz.language,
    },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({
        id: quiz.id,
        data: {
          title: value.title,
          description: value.description || null,
          language: value.language,
        },
      });
      await invalidate();
      form.reset(value); // valeurs enregistrées = nouvelle base « propre » → bouton inactif
    },
  });

  // Le bouton « Enregistrer » n'est actif que si une modification est en cours.
  const isDirty = useStore(form.store, (s) => s.isDirty);
  useUnsavedGuard(isDirty);

  const changeStatus = async (status: 'draft' | 'ready' | 'archived') => {
    await transition.mutateAsync({ id: quiz.id, data: { status } });
    await invalidate();
  };

  const onPresent = async () => {
    setPresentError(null);
    setPresenting(true);
    try {
      const { pin } = await createSession(quiz.id, fullCapture);
      setLivePin(pin);
    } catch (e) {
      setPresentError(e instanceof Error ? e.message : t('broadcast.presentError'));
    } finally {
      setPresenting(false);
    }
  };

  const onDeleteQuiz = async () => {
    await removeQuiz.mutateAsync({ id: quiz.id });
    await queryClient.invalidateQueries({ queryKey: getQuizzesControllerListQueryKey() });
    void navigate({ to: '/dashboard' });
  };

  const onDeleteQuestion = async (qid: string) => {
    await removeQuestion.mutateAsync({ qid });
    await invalidate();
  };

  const onDeleteSlide = async (sid: string) => {
    await removeSlide.mutateAsync({ sid });
    await invalidate();
  };

  // Questions and slides share one sequence (#7): the server re-anchors slides from it.
  const items = quizItems(quiz);
  const persistOrder = async (next: QuizItem[]) => {
    await reorder.mutateAsync({
      id: quiz.id,
      data: { items: next.map((it) => ({ kind: it.kind, id: it.id })) },
    });
    await invalidate();
  };
  const move = (index: number, direction: -1 | 1) => {
    const next = moveItem(items, index, direction);
    if (next !== items) void persistOrder(next);
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((it) => it.id === active.id);
    const to = items.findIndex((it) => it.id === over.id);
    if (from >= 0 && to >= 0) void persistOrder(arrayMove(items, from, to));
  };

  const editingItem = items.find((it) => it.id === editing);
  const openForm =
    editing === 'new' ? (
      <QuestionForm quizId={quiz.id} onClose={closeForm} onDirtyChange={onFormDirty} />
    ) : editing === 'new-slide' ? (
      <SlideForm quizId={quiz.id} onClose={closeForm} onDirtyChange={onFormDirty} />
    ) : editingItem?.kind === 'question' ? (
      <QuestionForm
        quizId={quiz.id}
        question={editingItem.question}
        onClose={closeForm}
        onDirtyChange={onFormDirty}
      />
    ) : editingItem?.kind === 'slide' ? (
      <SlideForm
        quizId={quiz.id}
        slide={editingItem.slide}
        onClose={closeForm}
        onDirtyChange={onFormDirty}
      />
    ) : null;
  const formTitle =
    editing === 'new' || editingItem?.kind === 'question'
      ? t('questions.formTitle')
      : t('slides.formTitle');

  const statusVariant =
    quiz.status === 'ready' ? 'success' : quiz.status === 'archived' ? 'muted' : 'default';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {/* Header: the quiz itself is the page title; the editor label is secondary. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('header.title')}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="truncate text-3xl font-bold tracking-tight">{quiz.title}</h1>
            <Badge variant={statusVariant}>
              {t(`common:quizStatus.${quiz.status}`, { defaultValue: quiz.status })}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <a
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            href={`/quizzes/${quiz.id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4" />
            {t('header.preview')}
          </a>
          <Link
            to="/quizzes/$quizId/sessions"
            params={{ quizId: quiz.id }}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            <History className="size-4" />
            {t('header.history')}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
            {t('header.deleteQuiz')}
          </Button>
        </div>
      </header>

      {/* Working area first (the sequence), settings in a sticky sidebar on wide screens.
          DOM order = mobile order, no `order-*` juggling. */}
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {t('questions.title', { count: quiz.questionCount })}
            </h2>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => requestEditing('new-slide')}
                disabled={editing === 'new-slide'}
              >
                <LayoutTemplate className="size-4" />
                {t('slides.add')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => requestEditing('new')}
                disabled={editing === 'new'}
              >
                <Plus className="size-4" />
                {t('questions.add')}
              </Button>
            </div>
          </div>

          {wide && (editing === 'new' || editing === 'new-slide') ? openForm : null}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={items.map((it) => it.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-border flex flex-col divide-y">
                {items.map((item, i) =>
                  wide && editing === item.id ? (
                    <li key={item.id} className="py-3">
                      {openForm}
                    </li>
                  ) : (
                    <SortableRow key={item.id} id={item.id}>
                      {(handle) => (
                        <ItemRow
                          item={item}
                          number={questionNumber(items, i)}
                          handle={handle}
                          canMoveUp={i > 0 && !reorder.isPending}
                          canMoveDown={i < items.length - 1 && !reorder.isPending}
                          onMove={(d) => move(i, d)}
                          onEdit={() => requestEditing(item.id)}
                          onDelete={() =>
                            void (item.kind === 'question'
                              ? onDeleteQuestion(item.id)
                              : onDeleteSlide(item.id))
                          }
                        />
                      )}
                    </SortableRow>
                  ),
                )}
                {items.length === 0 && editing === null && (
                  <li className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
                    {t('questions.empty')}
                  </li>
                )}
              </ul>
            </SortableContext>
          </DndContext>
          {!wide ? (
            <Drawer open={editing !== null} title={formTitle} onClose={() => requestEditing(null)}>
              {openForm}
            </Drawer>
          ) : null}
        </main>

        <aside className="divide-border bg-muted/50 flex flex-col divide-y rounded-2xl p-6 lg:sticky lg:top-6">
          <Section title={t('settings.title')} className="pb-6">
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
              }}
            >
              <form.Field name="title">
                {(field) => (
                  <Label>
                    {t('settings.titleLabel')}
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Label>
                )}
              </form.Field>
              <form.Field name="description">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium leading-none">
                      {t('settings.descriptionLabel')}
                    </span>
                    <MarkdownEditor
                      aria-label={t('settings.descriptionLabel')}
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>
              <Button
                type="submit"
                size="sm"
                variant={isDirty ? 'default' : 'outline'}
                disabled={!isDirty || update.isPending}
                className="self-start"
              >
                <Save className="size-4" />
                {t('settings.save')}
              </Button>
            </form>
          </Section>

          <Section title={t('broadcast.title')} className="py-6">
            {quiz.status === 'ready' && !livePin ? (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={fullCapture}
                  onChange={(e) => setFullCapture(e.target.checked)}
                />
                <span>
                  <span className="font-medium">{t('broadcast.fullCaptureLabel')}</span>
                  <span className="text-muted-foreground block">
                    {t('broadcast.fullCaptureHelp')}
                  </span>
                </span>
              </label>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {quiz.status === 'draft' && (
                <Button
                  type="button"
                  disabled={quiz.questionCount === 0 || transition.isPending}
                  onClick={() => void changeStatus('ready')}
                >
                  {t('broadcast.publish')}
                </Button>
              )}
              {quiz.status === 'ready' && (
                <>
                  {!livePin && (
                    <Button
                      type="button"
                      variant="main-action"
                      disabled={presenting}
                      onClick={() => void onPresent()}
                    >
                      <Play className="size-4" />
                      {presenting ? t('broadcast.presenting') : t('broadcast.present')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void changeStatus('draft')}
                  >
                    {t('broadcast.backToDraft')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void changeStatus('archived')}
                  >
                    {t('broadcast.archive')}
                  </Button>
                </>
              )}
              {quiz.status === 'archived' && (
                <Button type="button" variant="outline" onClick={() => void changeStatus('draft')}>
                  {t('broadcast.restore')}
                </Button>
              )}
            </div>
            {presentError ? <p className="text-destructive text-sm">{presentError}</p> : null}
            {livePin ? <GameAccessPanel pin={livePin} /> : null}
          </Section>

          <FeedbackSection quizId={quiz.id} className="pt-6" />
        </aside>
      </div>

      <ConfirmDialog
        open={pendingEdit !== undefined}
        destructive
        title={t('discardConfirm.title')}
        description={t('discardConfirm.description')}
        confirmLabel={t('discardConfirm.confirmLabel')}
        onCancel={() => setPendingEdit(undefined)}
        onConfirm={() => {
          const next = pendingEdit ?? null;
          setPendingEdit(undefined);
          setFormDirty(false);
          setEditing(next);
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        destructive
        title={t('deleteConfirm.title')}
        description={t('deleteConfirm.description', { title: quiz.title })}
        confirmLabel={t('deleteConfirm.confirmLabel')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void onDeleteQuiz();
        }}
      />
    </div>
  );
}

/** Sidebar block: a small caps label, then content — no card chrome. */
function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Étoiles pleines/vides pour une note `value` sur 5. */
function StarRow({ value, size = 'size-4' }: { value: number; size?: string }) {
  const { t } = useTranslation('editor');
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={t('feedback.starsAriaLabel', { value })}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={cn(
            size,
            i < value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
          )}
        />
      ))}
    </span>
  );
}

/**
 * Avis des joueurs sur le quiz (§2.11) — réservé au propriétaire (l'endpoint refuse
 * les autres). Moyenne, nombre et liste des commentaires (récents d'abord).
 */
function FeedbackSection({ quizId, className }: { quizId: string; className?: string }) {
  const { t } = useTranslation(['editor', 'common']);
  const { data, isLoading } = useQuizzesControllerFeedback(quizId);
  const summary = data?.data;
  return (
    <Section title={t('feedback.title')} className={className}>
      {isLoading ? <p className="text-muted-foreground text-sm">{t('common:loading')}</p> : null}
      {summary && summary.count === 0 ? (
        <p className="text-muted-foreground text-sm">{t('feedback.empty')}</p>
      ) : null}
      {summary && summary.count > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums">{summary.average.toFixed(1)}</span>
            <StarRow value={Math.round(summary.average)} size="size-5" />
            <span className="text-muted-foreground text-sm">
              {t('feedback.count', { count: summary.count })}
            </span>
          </div>
          <ul className="flex max-h-60 flex-col gap-2 overflow-auto">
            {summary.items.map((f) => (
              <li key={f.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{f.nickname}</span>
                  <StarRow value={f.rating} size="size-3.5" />
                </div>
                {f.comment ? <p className="text-muted-foreground mt-1">{f.comment}</p> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Section>
  );
}

/**
 * Panneau de partie en cours (§4.1) : trois accès indépendants, ouvrables sur des
 * postes différents. Contrôle = même onglet (pilotage) ; projection & invitation =
 * nouvelles fenêtres (grand écran / lien participants).
 */
function GameAccessPanel({ pin }: { pin: string }) {
  const { t } = useTranslation('editor');
  const open = (path: string) => window.open(path, '_blank', 'noopener,noreferrer');
  return (
    <div className="border-primary/30 bg-primary/5 flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Radio className="text-primary size-4" />
        <span>
          {t('gameAccess.label')} <strong className="font-mono tracking-widest">{pin}</strong>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/present/$pin/control"
          params={{ pin }}
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          <MonitorPlay className="size-4" />
          {t('gameAccess.controlScreen')}
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => open(`/present/${pin}/screen`)}
        >
          <Eye className="size-4" />
          {t('gameAccess.projectionScreen')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => open(`/join/${pin}`)}>
          <Users className="size-4" />
          {t('gameAccess.invitationScreen')}
        </Button>
      </div>
    </div>
  );
}

/** 1-based number of a question among questions only (slides are not numbered). */
function questionNumber(items: QuizItem[], index: number): number | null {
  if (items[index].kind !== 'question') return null;
  return items.slice(0, index + 1).filter((it) => it.kind === 'question').length;
}

/** Sortable `<li>`: hands its drag handle props to the row (arrows stay for keyboard/a11y). */
function SortableRow({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { t } = useTranslation('editor');
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      aria-label={t('questions.dragHandle')}
      className="text-muted-foreground hover:text-foreground -ml-1 cursor-grab touch-none rounded p-1 active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'bg-background relative z-10 shadow-md')}
    >
      {children(handle)}
    </li>
  );
}

/** One row of the quiz sequence: a question (numbered) or a content slide (#7). */
function ItemRow({
  item,
  number,
  handle,
  canMoveUp,
  canMoveDown,
  onMove,
  onEdit,
  onDelete,
}: {
  item: QuizItem;
  number: number | null;
  handle?: ReactNode;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation('editor');
  const isSlide = item.kind === 'slide';
  const label = isSlide ? item.slide.title || item.slide.body || '' : item.question.prompt;
  return (
    <div className="group flex items-center gap-1 py-3 sm:gap-3">
      {handle}
      <span
        className={cn(
          'text-muted-foreground w-7 shrink-0 text-center text-sm tabular-nums',
          isSlide && 'flex justify-center',
        )}
        aria-label={isSlide ? t('slides.kind') : undefined}
      >
        {isSlide ? <LayoutTemplate className="size-4" /> : number}
      </span>
      <div className="min-w-0 flex-1">
        <Markdown profile="inline" className="block truncate font-medium">
          {label}
        </Markdown>
        <p className="text-muted-foreground truncate text-xs">
          {isSlide
            ? t('slides.kind')
            : t(`questionType.${item.question.type}`, { defaultValue: item.question.type })}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('questions.moveUp')}
        disabled={!canMoveUp}
        onClick={() => onMove(-1)}
      >
        <ArrowUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('questions.moveDown')}
        disabled={!canMoveDown}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t('questions.edit')}
        onClick={onEdit}
      >
        <Pencil className="size-4" />
        <span className="hidden sm:inline">{t('questions.edit')}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={isSlide ? t('slides.deleteSlide') : t('questions.deleteQuestion')}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
