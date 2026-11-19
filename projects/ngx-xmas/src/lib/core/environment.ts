import { DOCUMENT, Injectable, NgZone, inject, signal } from '@angular/core';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Browser state shared by all effects: reduced-motion preference and tab visibility.
 * Listeners are attached only while at least one consumer is connected.
 */
@Injectable({ providedIn: 'root' })
export class XmasEnvironment {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly reducedMotionState = signal(false);
  private readonly pageVisibleState = signal(true);
  private consumers = 0;
  private detach: (() => void) | null = null;

  /** `prefers-reduced-motion: reduce` is set. Only up to date while connected. */
  readonly reducedMotion = this.reducedMotionState.asReadonly();
  /** The tab is visible. Only up to date while connected. */
  readonly pageVisible = this.pageVisibleState.asReadonly();

  /** Starts listening (browser only). Returns a function that releases this consumer. */
  connect(): () => void {
    if (this.consumers++ === 0) {
      this.detach = this.zone.runOutsideAngular(() => this.attach());
    }
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      if (--this.consumers === 0) {
        this.detach?.();
        this.detach = null;
      }
    };
  }

  private attach(): () => void {
    const doc = this.document;
    const win = doc.defaultView;
    const cleanups: (() => void)[] = [];

    if (win && typeof win.matchMedia === 'function') {
      const query = win.matchMedia(REDUCED_MOTION_QUERY);
      const onChange = () => this.reducedMotionState.set(query.matches);
      onChange();
      query.addEventListener?.('change', onChange);
      cleanups.push(() => query.removeEventListener?.('change', onChange));
    }

    const onVisibility = () => this.pageVisibleState.set(doc.visibilityState !== 'hidden');
    onVisibility();
    doc.addEventListener('visibilitychange', onVisibility, { passive: true });
    cleanups.push(() => doc.removeEventListener('visibilitychange', onVisibility));

    return () => cleanups.forEach((fn) => fn());
  }
}
