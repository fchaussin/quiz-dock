import { useForm, useStore } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUnsavedGuard } from '@/lib/use-unsaved-guard';
import { MarkdownEditor } from '@/components/markdown-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorText } from '../api/http';
import type { QuizDetailDtoSlidesItem } from '../api/generated/model';
import { MediaUpload } from './media-upload';
import { useSlidesControllerAdd, useSlidesControllerUpdate } from '../api/generated/slides/slides';
import { getQuizzesControllerGetQueryKey } from '../api/generated/quizzes/quizzes';

interface FormValues {
  title: string;
  body: string;
  mediaId: string | null;
  displayDelayS: number | null;
}

function initialValues(s?: QuizDetailDtoSlidesItem): FormValues {
  return {
    title: s?.title ?? '',
    body: s?.body ?? '',
    mediaId: s?.mediaId ?? null,
    displayDelayS: s?.displayDelayS ?? null,
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

      <form.Field name="displayDelayS">
        {(field) => (
          <Label title={t('slideForm.displayDelayHint')}>
            {t('slideForm.displayDelayLabel')}
            <Input
              type="number"
              min={1}
              max={600}
              className="w-28"
              placeholder={t('slideForm.displayDelayPlaceholder')}
              value={field.state.value ?? ''}
              onChange={(e) =>
                field.handleChange(e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </Label>
        )}
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
