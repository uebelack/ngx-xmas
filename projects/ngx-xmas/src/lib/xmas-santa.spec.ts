import { TestBed } from '@angular/core/testing';

import { XmasSanta } from './xmas-santa';

async function setup(date: Date) {
  vi.useFakeTimers();
  vi.setSystemTime(date);
  const fixture = TestBed.createComponent(XmasSanta);
  fixture.componentRef.setInput('minInterval', 10_000);
  fixture.componentRef.setInput('maxInterval', 10_000);
  fixture.componentRef.setInput('duration', 5_000);
  await vi.advanceTimersByTimeAsync(0);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return {
    santa: fixture.componentInstance,
    flight: () => el.querySelector('[data-xmas-santa-flight]'),
    advance: async (ms: number) => {
      await vi.advanceTimersByTimeAsync(ms);
      fixture.detectChanges();
    },
  };
}

describe('XmasSanta', () => {
  afterEach(() => vi.useRealTimers());

  it('flies after the interval and lands after the duration in December', async () => {
    const { flight, advance } = await setup(new Date(2026, 11, 10));
    expect(flight()).toBeNull();
    await advance(10_000);
    expect(flight()).not.toBeNull();
    expect(flight()!.querySelectorAll('.reindeer')).toHaveLength(3);
    await advance(5_000);
    expect(flight()).toBeNull();
    await advance(10_000);
    expect(flight()).not.toBeNull();
  });

  it('fly() starts a flight immediately', async () => {
    const { santa, flight, advance } = await setup(new Date(2026, 11, 10));
    santa.fly();
    await advance(0);
    expect(flight()).not.toBeNull();
  });

  it('never flies outside December', async () => {
    const { santa, flight, advance } = await setup(new Date(2026, 10, 30));
    await advance(60_000);
    santa.fly();
    await advance(0);
    expect(flight()).toBeNull();
  });
});
