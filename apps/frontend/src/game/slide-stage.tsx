import type { SlideShowPayload } from '@quiz-dock/contracts';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { SlideView, TYPE_BASE } from './live-components';

const STAGE_W = 1280;
const STAGE_H = 720;

/**
 * A faithful miniature of the projected slide: the slide is laid out on a
 * 1280×720 canvas exactly as on the big screen, then scaled to the box width.
 */
export function SlideStage({ slide, className }: { slide: SlideShowPayload; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / STAGE_W);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('bg-background relative aspect-video w-full overflow-hidden', className)}
    >
      <div
        className={cn('absolute top-0 left-0 flex origin-top-left', TYPE_BASE.stage)}
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
      >
        <SlideView slide={slide} />
      </div>
    </div>
  );
}
