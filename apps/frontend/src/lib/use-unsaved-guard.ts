import { useEffect } from 'react';

/**
 * Warns before the tab is closed or reloaded while `dirty` is true. The
 * in-app navigation guard (leaving a form for another item) is handled by the
 * caller with a confirm dialog; this only covers what the browser owns.
 */
export function useUnsavedGuard(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}
