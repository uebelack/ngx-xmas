import { DOCUMENT, Injectable, NgZone, inject } from '@angular/core';

const ACTIVITY_EVENTS = ['mousemove', 'pointerdown', 'keydown', 'touchstart', 'wheel'] as const;

interface IdleWatcher {
  timeout: number;
  onChange: (idle: boolean) => void;
  idle: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * Shared user-idle detection. Uses passive listeners, attached only while something
 * is watching, and runs outside Angular's change detection. Timers stop while the tab
 * is hidden; returning to the tab counts as activity.
 */
@Injectable({ providedIn: 'root' })
export class XmasIdle {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly watchers = new Set<IdleWatcher>();
  private lastActivity = 0;
  private detach: (() => void) | null = null;

  /**
   * Calls `onChange(true)` once the user has been idle for `timeout` ms and
   * `onChange(false)` on the next activity. Returns a function that stops watching.
   */
  watch(timeout: number, onChange: (idle: boolean) => void): () => void {
    const watcher: IdleWatcher = { timeout, onChange, idle: false, timer: null };
    this.zone.runOutsideAngular(() => {
      if (this.watchers.size === 0) {
        this.lastActivity = Date.now();
        this.detach = this.attach();
      }
      this.watchers.add(watcher);
      if (!this.hidden()) {
        this.schedule(watcher, timeout);
      }
    });
    return () => {
      if (!this.watchers.delete(watcher)) {
        return;
      }
      this.clearTimer(watcher);
      if (this.watchers.size === 0) {
        this.detach?.();
        this.detach = null;
      }
    };
  }

  private attach(): () => void {
    const doc = this.document;
    const onActivity = () => this.activity();
    const onVisibility = () => (this.hidden() ? this.suspend() : this.activity());
    const options: AddEventListenerOptions = { passive: true, capture: true };
    for (const type of ACTIVITY_EVENTS) {
      doc.addEventListener(type, onActivity, options);
    }
    doc.addEventListener('visibilitychange', onVisibility, options);
    return () => {
      for (const type of ACTIVITY_EVENTS) {
        doc.removeEventListener(type, onActivity, options);
      }
      doc.removeEventListener('visibilitychange', onVisibility, options);
    };
  }

  private activity(): void {
    this.lastActivity = Date.now();
    for (const watcher of this.watchers) {
      if (watcher.idle) {
        watcher.idle = false;
        watcher.onChange(false);
      }
      // Busy watchers keep their timer; it re-checks lastActivity when it fires.
      if (watcher.timer === null) {
        this.schedule(watcher, watcher.timeout);
      }
    }
  }

  private schedule(watcher: IdleWatcher, delay: number): void {
    this.clearTimer(watcher);
    watcher.timer = setTimeout(() => {
      watcher.timer = null;
      const remaining = watcher.timeout - (Date.now() - this.lastActivity);
      if (remaining > 0) {
        this.schedule(watcher, remaining);
      } else if (!watcher.idle) {
        watcher.idle = true;
        watcher.onChange(true);
      }
    }, delay);
  }

  private suspend(): void {
    for (const watcher of this.watchers) {
      this.clearTimer(watcher);
    }
  }

  private clearTimer(watcher: IdleWatcher): void {
    if (watcher.timer !== null) {
      clearTimeout(watcher.timer);
      watcher.timer = null;
    }
  }

  private hidden(): boolean {
    return this.document.visibilityState === 'hidden';
  }
}
