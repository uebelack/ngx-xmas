import { Component, Provider, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  fakeClock,
  fakeRandom,
  localDate,
  resetPageVisible,
  setPageVisible,
  stubReducedMotion,
} from '../../testing/helpers';
import { XmasSanta, XmasSantaDirection, xmasSantaCargo } from './santa';

@Component({
  imports: [XmasSanta],
  template: `
    <xmas-santa
      [minInterval]="10000"
      [maxInterval]="20000"
      [duration]="5000"
      [direction]="direction"
      [oncePerSession]="oncePerSession"
      [variantProbability]="variantProbability"
      (flightEnd)="flightEnds = flightEnds + 1"
      (presentDropped)="presentsDropped = presentsDropped + 1"
    />
  `,
})
class Host {
  readonly santa = viewChild.required(XmasSanta);
  direction: XmasSantaDirection = 'ltr';
  oncePerSession = false;
  variantProbability = 1 / 50;
  flightEnds = 0;
  presentsDropped = 0;
}

interface SetupOptions {
  date?: Date;
  init?: (host: Host) => void;
  providers?: Provider[];
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  fixture.detectChanges();
}

async function setup({ date = localDate(2026, 12, 10), init, providers = [] }: SetupOptions = {}) {
  vi.useFakeTimers();
  const random = fakeRandom();
  TestBed.configureTestingModule({
    providers: [fakeClock(date).provider, random.provider, ...providers],
  });
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  await settle(fixture);
  const el = fixture.nativeElement as HTMLElement;
  const santaEl = el.querySelector<HTMLElement>('xmas-santa')!;
  const flight = () => santaEl.querySelector<HTMLElement>('[data-xmas-santa-flight]');
  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  };
  return { fixture, host: fixture.componentInstance, santaEl, flight, advance, random };
}

async function flyOn(date: Date) {
  const ctx = await setup({ date });
  ctx.host.santa().fly();
  await settle(ctx.fixture);
  return ctx.flight()!;
}

async function flyWith(probability: number, draw: number) {
  const ctx = await setup({ init: (h) => (h.variantProbability = probability) });
  ctx.random.queue.push(draw, 0.2); // variant check, then variant pick
  ctx.host.santa().fly();
  await settle(ctx.fixture);
  return ctx.flight()!;
}

describe('XmasSanta', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetPageVisible();
  });

  it('renders nothing and schedules nothing out of season', async () => {
    const { santaEl, flight, advance, host, fixture } = await setup({
      date: localDate(2026, 11, 30),
    });
    expect(santaEl.childElementCount).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    host.santa().fly();
    await settle(fixture);
    await advance(60_000);
    expect(flight()).toBeNull();
    expect(santaEl.classList.contains('xmas-on')).toBe(false);
  });

  describe('scheduling', () => {
    it('first flight after a random delay between min and max interval', async () => {
      const { flight, advance, random } = await setup({ init: () => undefined });
      // Queue is empty, so the delay draw used 0.5 → 10s + 0.5 × 10s = 15s.
      expect(random.random).toHaveBeenCalledTimes(1);
      await advance(14_999);
      expect(flight()).toBeNull();
      await advance(1);
      expect(flight()).not.toBeNull();
    });

    it('uses the random source for the delay', async () => {
      vi.useFakeTimers();
      const random = fakeRandom();
      random.queue.push(0); // first delay → minInterval
      TestBed.configureTestingModule({
        providers: [fakeClock(localDate(2026, 12, 10)).provider, random.provider],
      });
      const fixture = TestBed.createComponent(Host);
      await settle(fixture);
      await vi.advanceTimersByTimeAsync(10_000);
      fixture.detectChanges();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[data-xmas-santa-flight]'),
      ).not.toBeNull();
    });

    it('ends after `duration`, emits flightEnd and schedules the next flight', async () => {
      const { host, flight, advance, random } = await setup();
      await advance(15_000);
      expect(flight()).not.toBeNull();

      random.queue.push(1); // next delay → maxInterval (20s)
      await advance(5_000);
      expect(flight()).toBeNull();
      expect(host.flightEnds).toBe(1);

      await advance(19_999);
      expect(flight()).toBeNull();
      await advance(1);
      expect(flight()).not.toBeNull();
    });

    it('fly() starts a flight immediately and ignores calls during a flight', async () => {
      const { host, fixture, flight, advance } = await setup();
      host.santa().fly();
      await settle(fixture);
      expect(flight()).not.toBeNull();
      host.santa().fly();
      await advance(5_000);
      expect(flight()).toBeNull();
      expect(host.flightEnds).toBe(1);
    });

    it('picks the direction from the random source when direction is random', async () => {
      const { host, fixture, flight, random, advance } = await setup({
        init: (h) => (h.direction = 'random'),
      });
      random.queue.push(0.2); // direction → ltr
      host.santa().fly();
      await settle(fixture);
      expect(flight()!.dataset['direction']).toBe('ltr');

      await advance(5_000);
      random.queue.push(0.5, 0.9); // next delay, then direction → rtl
      host.santa().fly();
      await settle(fixture);
      expect(flight()!.dataset['direction']).toBe('rtl');
      expect(flight()!.classList.contains('flipped')).toBe(true);
    });

    it('pauses while the tab is hidden', async () => {
      const { flight, advance } = await setup();
      await advance(10_000);
      setPageVisible(false);
      await advance(60_000);
      expect(flight()).toBeNull();
      setPageVisible(true);
      await advance(4_999);
      expect(flight()).toBeNull();
      await advance(1);
      expect(flight()).not.toBeNull();
    });

    it('clears all timers on destroy', async () => {
      const { fixture, host } = await setup();
      host.santa().fly();
      await settle(fixture);
      fixture.destroy();
      // Let Angular's own change-detection scheduler (≤ 1 frame) run; the 5 s flight timer
      // and the 10–20 s interval timer would still be pending if they leaked.
      await vi.advanceTimersByTimeAsync(20);
      expect(vi.getTimerCount()).toBe(0);
      expect(host.flightEnds).toBe(0);
    });
  });

  describe('oncePerSession', () => {
    it('flies automatically only once', async () => {
      const { host, flight, advance } = await setup({ init: (h) => (h.oncePerSession = true) });
      await advance(15_000);
      expect(flight()).not.toBeNull();
      expect(sessionStorage.getItem('ngx-xmas:santa-flown')).toBe('1');
      await advance(5_000);
      expect(host.flightEnds).toBe(1);
      await advance(10 * 60_000);
      expect(flight()).toBeNull();
      expect(host.flightEnds).toBe(1);
    });

    it('does not fly automatically if Santa already flew this session', async () => {
      sessionStorage.setItem('ngx-xmas:santa-flown', '1');
      const { flight, advance } = await setup({ init: (h) => (h.oncePerSession = true) });
      await advance(10 * 60_000);
      expect(flight()).toBeNull();
    });

    it('still allows fly()', async () => {
      sessionStorage.setItem('ngx-xmas:santa-flown', '1');
      const { host, fixture, flight } = await setup({ init: (h) => (h.oncePerSession = true) });
      host.santa().fly();
      await settle(fixture);
      expect(flight()).not.toBeNull();
    });

    it('falls back to memory when sessionStorage throws', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });
      const { host, flight, advance } = await setup({ init: (h) => (h.oncePerSession = true) });
      await advance(20_000);
      expect(host.flightEnds).toBe(1);
      await advance(10 * 60_000);
      expect(flight()).toBeNull();
      expect(host.flightEnds).toBe(1);
    });

    it('is off by default', async () => {
      sessionStorage.setItem('ngx-xmas:santa-flown', '1');
      const { flight, advance } = await setup();
      await advance(15_000);
      expect(flight()).not.toBeNull();
    });
  });

  describe('sled contents', () => {
    it('is piled with presents on 24 December', async () => {
      const f = await flyOn(localDate(2026, 12, 24));
      expect(f.dataset['cargo']).toBe('presents');
      expect(f.querySelectorAll('.cargo .box').length).toBeGreaterThanOrEqual(5);
    });

    it('is empty on 25 December', async () => {
      const f = await flyOn(localDate(2026, 12, 25));
      expect(f.dataset['cargo']).toBe('empty');
      expect(f.querySelector('.cargo')).toBeNull();
    });

    it('is empty on 26 December', async () => {
      expect(xmasSantaCargo(localDate(2026, 12, 26))).toBe('empty');
    });

    it('carries a sack before Christmas Eve', async () => {
      const f = await flyOn(localDate(2026, 12, 10));
      expect(f.dataset['cargo']).toBe('sack');
      expect(f.querySelector('.sack')).not.toBeNull();
    });
  });

  describe('presents', () => {
    it('clicking Santa drops a present that disappears again', async () => {
      const { host, fixture, santaEl, advance } = await setup();
      host.santa().fly();
      await settle(fixture);

      const sleigh = santaEl.querySelector('[data-xmas-santa-sleigh]')!;
      sleigh.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 10 }));
      await settle(fixture);

      const present = santaEl.querySelector<HTMLElement>('[data-xmas-present]');
      expect(present).not.toBeNull();
      expect(present!.style.left).toBe('120px');
      expect(host.presentsDropped).toBe(1);

      await advance(2_600);
      expect(santaEl.querySelector('[data-xmas-present]')).toBeNull();
    });

    it('Santa is clickable but not focusable', async () => {
      const { host, fixture, santaEl } = await setup();
      host.santa().fly();
      await settle(fixture);
      expect(santaEl.getAttribute('aria-hidden')).toBe('true');
      expect(santaEl.querySelector('[tabindex], button, a')).toBeNull();
    });
  });

  describe('rare variant', () => {
    it('triggers when the draw is below the default 1-in-50 probability', async () => {
      const ctx = await setup();
      ctx.random.queue.push(0.019, 0.2);
      ctx.host.santa().fly();
      await settle(ctx.fixture);
      expect(ctx.flight()!.dataset['variant']).toBe('backwards');
    });

    it('does not trigger at or above the probability', async () => {
      const ctx = await setup();
      ctx.random.queue.push(0.02);
      ctx.host.santa().fly();
      await settle(ctx.fixture);
      expect(ctx.flight()!.dataset['variant']).toBeUndefined();
    });

    it('honours a configured probability', async () => {
      expect((await flyWith(0.3, 0.29)).dataset['variant']).toBe('backwards');
      TestBed.resetTestingModule();
      expect((await flyWith(0.3, 0.31)).dataset['variant']).toBeUndefined();
    });

    it('backwards flips the art against the direction of travel', async () => {
      const f = await flyWith(1, 0);
      expect(f.dataset['direction']).toBe('ltr');
      expect(f.classList.contains('flipped')).toBe(true);
    });

    it('chaser adds a lone reindeer behind the sled', async () => {
      const ctx = await setup({ init: (h) => (h.variantProbability = 1) });
      ctx.random.queue.push(0, 0.7);
      ctx.host.santa().fly();
      await settle(ctx.fixture);
      expect(ctx.flight()!.dataset['variant']).toBe('chaser');
      expect(ctx.flight()!.querySelector('.chaser [xmas-reindeer]')).not.toBeNull();
    });

    it('occurs at roughly the configured rate', async () => {
      const ctx = await setup({ init: (h) => (h.variantProbability = 0.25) });
      // Deterministic, evenly spread draws for the variant check.
      let variants = 0;
      for (let i = 0; i < 40; i++) {
        const draw = (i + 0.5) / 40;
        ctx.random.queue.push(draw, ...(draw < 0.25 ? [0.2] : []));
        ctx.host.santa().fly();
        await settle(ctx.fixture);
        if (ctx.flight()!.dataset['variant']) {
          variants++;
        }
        ctx.random.queue.push(0.5); // delay draw for the next scheduled flight
        await ctx.advance(5_000);
      }
      expect(variants).toBe(10);
    });
  });

  describe('reduced motion', () => {
    it('disables automatic and manual flights', async () => {
      const restore = stubReducedMotion(true);
      try {
        const { host, fixture, santaEl, flight, advance } = await setup();
        expect(santaEl.classList.contains('xmas-on')).toBe(true);
        await advance(10 * 60_000);
        expect(flight()).toBeNull();
        host.santa().fly();
        await settle(fixture);
        expect(flight()).toBeNull();
      } finally {
        restore();
      }
    });

    it('flies when reduced motion is not requested', async () => {
      const restore = stubReducedMotion(false);
      try {
        const { flight, advance } = await setup();
        await advance(15_000);
        expect(flight()).not.toBeNull();
      } finally {
        restore();
      }
    });
  });
});
