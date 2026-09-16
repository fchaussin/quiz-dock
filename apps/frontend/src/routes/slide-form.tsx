import { useForm, useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutPanelLeft, LayoutPanelTop, Maximize2, PanelRight } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUnsavedGuard } from '@/lib/use-unsaved-guard';
import { MarkdownEditor } from '@/components/markdown-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { apiErrorText } from '../api/http';
import type { SlideLayout, SlideTextTone } from '@quiz-dock/contracts';
import type { QuizDetailDtoSlidesItem } from '../api/generated/model';
import { SlideStage } from '../game/slide-stage';
import { MediaUpload } from './media-upload';
import { useSlidesControllerAdd, useSlidesControllerUpdate } from '../api/generated/slides/slides';
import { getQuizzesControllerGetQueryKey } from '../api/generated/quizzes/quizzes';

/** Layout choices, in the order they are offered. */
const LAYOUTS: { value: SlideLayout; Icon: typeof LayoutPanelTop }[] = [
  { value: 'auto', Icon: LayoutPanelTop },
  { value: 'media_left', Icon: LayoutPanelLeft },
  { value: 'media_right', Icon: PanelRight },
  { value: 'media_full', Icon: Maximize2 },
];

interface FormValues {
  title: string;
  body: string;
  mediaId: string | null;
  displayDelayS: number | null;
  layout: SlideLayout;
  textTone: SlideTextTone;
  textOutline: boolean;
}

function initialValues(s?: QuizDetailDtoSlidesItem): FormValues {
  return {
    title: s?.title ?? '',
    body: s?.body ?? '',
    mediaId: s?.mediaId ?? null,
    displayDelayS: s?.displayDelayS ?? null,
    layout: (s?.layout as SlideLayout | undefined) ?? 'auto',
    textTone: (s?.textTone as SlideTextTone | undefined) ?? 'light',
    textOutline: s?.textOutline ?? false,
  };
}

/**
 * Content slide form (#7): title, Markdown body, media, optional display delay.
 * A new slide is appended at the end of the quiz; it is then moved like any item.
 */
export function SlideForm({
  quizId,
  slide,
  onClose,
  onDirtyChange,
}: {
  quizId: string;
  slide?: QuizDetailDtoSlidesItem;
  onClose: () => void;
  /** Reports unsaved edits so the parent can guard against losing them. */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { t } = useTranslation(['editor', 'common']);
  const queryClient = useQueryClient();
  const add = useSlidesControllerAdd();
  const update = useSlidesControllerUpdate();
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [initial] = useState(() => initialValues(slide));

  const form = useForm({
    defaultValues: initial,
    onSubmit: async ({ value }) => {
      setError(null);
      const data = {
        title: value.title.trim() || null,
        body: value.body.trim() || null,
        mediaId: value.mediaId,
        displayDelayS: value.displayDelayS,
        layout: value.layout,
        textTone: value.textTone,
        textOutline: value.textOutline,
      };
      try {
        if (slide) {
          await update.mutateAsync({ sid: slide.id, data });
        } else {
          await add.mutateAsync({ id: quizId, data });
        }
        await queryClient.invalidateQueries({
          queryKey: getQuizzesControllerGetQueryKey(quizId),
        });
        onClose();
      } catch (err) {
        setError(apiErrorText(err, t('slideForm.invalidError')));
      }
    },
  });
  const mediaId = useStore(form.store, (s) => s.values.mediaId);
  const values = useStore(form.store, (s) => s.values);
  const dirty = useStore(form.store, (s) => JSON.stringify(s.values) !== JSON.stringify(initial));
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useUnsavedGuard(dirty);
  const cancel = () => (dirty ? setConfirmDiscard(true) : onClose());

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {(field) => (
          <Label>
            {t('slideForm.titleLabel')}
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t('slideForm.titlePlaceholder')}
            />
          </Label>
        )}
      </form.Field>

      <form.Field name="body">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium leading-none">{t('slideForm.bodyLabel')}</span>
            <MarkdownEditor
              aria-label={t('slideForm.bodyLabel')}
              value={field.state.value}
              onChange={field.handleChange}
              placeholder={t('slideForm.bodyPlaceholder')}
            />
          </div>
        )}
      </form.Field>

      <MediaUpload value={mediaId} onChange={(id) => form.setFieldValue('mediaId', id)} />

      {mediaId ? (
        <form.Field name="layout">
          {(field) => (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                {t('slideForm.layoutLegend')}
              </legend>
              <div className="flex flex-wrap gap-2">
                {LAYOUTS.map(({ value, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={field.state.value === value}
                    title={t(`slideForm.layout.${value}`)}
                    aria-label={t(`slideForm.layout.${value}`)}
                    onClick={() => field.handleChange(value)}
                    className={cn(
                      'border-input hover:bg-accent flex size-12 items-center justify-center rounded-md border',
                      field.state.value === value && 'border-primary bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="size-6" />
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </form.Field>
      ) : null}
      {mediaId && values.layout === 'media_full' ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
            {t('slideForm.contrastLegend')}
          </legend>
          <div className="flex flex-wrap items-center gap-4">
            <form.Field name="textTone">
              {(field) => (
                <Select
                  aria-label={t('slideForm.contrastLegend')}
                  className="w-64"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as SlideTextTone)}
                >
                  <option value="light">{t('slideForm.tone.light')}</option>
                  <option value="dark">{t('slideForm.tone.dark')}</option>
                </Select>
              )}
            </form.Field>
            <form.Field name="textOutline">
              {(field) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                  {t('slideForm.outline')}
                </label>
              )}
            </form.Field>
          </div>
        </fieldset>
      ) : null}

      {/* What the projected screen will show, at slide proportions. */}
      <SlideStage
        className="rounded-xl border"
        slide={{
          slideIndex: 0,
          questionIndex: 0,
          title: values.title || null,
          body: values.body || null,
          media: mediaId ? { url: `/api/v1/media/${mediaId}`, kind: 'image' } : null,
          displayDelayS: values.displayDelayS,
          layout: values.layout,
          textTone: values.textTone,
          textOutline: values.textOutline,
        }}
      />

      <form.Field name="displayDelayS">
        {(field) => {
          // null = engine default (auto mode), 0 = manual override, N = custom seconds.
          const v = field.state.value;
          const mode = v === null ? 'default' : v === 0 ? 'manual' : 'custom';
          return (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                {t('slideForm.displayLegend')}
              </legend>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label={t('slideForm.displayLegend')}
                  className="w-56"
                  value={mode}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === 'default' ? null : e.target.value === 'manual' ? 0 : 10,
                    )
                  }
                >
                  <option value="default">{t('slideForm.display.default')}</option>
                  <option value="manual">{t('slideForm.display.manual')}</option>
                  <option value="custom">{t('slideForm.display.custom')}</option>
                </Select>
                {mode === 'custom' ? (
                  <Input
                    type="number"
                    aria-label={t('slideForm.displayDelayLabel')}
                    min={1}
                    max={600}
                    className="w-24"
                    value={v ?? ''}
                    onChange={(e) => field.handleChange(Math.max(1, Number(e.target.value) || 1))}
                  />
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{t('slideForm.displayHint')}</p>
            </fieldset>
          );
        }}
      </form.Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={!dirty || add.isPending || update.isPending}>
          {slide ? t('slideForm.submitUpdate') : t('slideForm.submitAdd')}
        </Button>
        <Button type="button" variant="ghost" onClick={cancel}>
          {t('common:cancel')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDiscard}
        destructive
        title={t('discardConfirm.title')}
        description={t('discardConfirm.description')}
        confirmLabel={t('discardConfirm.confirmLabel')}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      />
    </form>
  );
}
