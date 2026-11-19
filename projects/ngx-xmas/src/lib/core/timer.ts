/** A one-shot timeout that can be paused and resumed, e.g. while the tab is hidden. */
export class PausableTimeout {
  private handle: ReturnType<typeof setTimeout> | null = null;
  private startedAt = 0;
  private remaining: number;
  private done = false;

  constructor(
    private readonly callback: () => void,
    delay: number,
    paused = false,
  ) {
    this.remaining = Math.max(0, delay);
    if (!paused) {
      this.resume();
    }
  }

  get pending(): boolean {
    return !this.done;
  }

  pause(): void {
    if (this.handle === null) {
      return;
    }
    clearTimeout(this.handle);
    this.handle = null;
    this.remaining = Math.max(0, this.remaining - (Date.now() - this.startedAt));
  }

  resume(): void {
    if (this.handle !== null || this.done) {
      return;
    }
    this.startedAt = Date.now();
    this.handle = setTimeout(() => {
      this.handle = null;
      this.done = true;
      this.callback();
    }, this.remaining);
  }

  clear(): void {
    if (this.handle !== null) {
      clearTimeout(this.handle);
      this.handle = null;
    }
    this.done = true;
  }
}
