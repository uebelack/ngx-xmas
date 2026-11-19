import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { fakeClock, localDate } from '../../testing/helpers';
import { XmasFrost, XmasFrostCorner, XmasFrostMode } from './frost';

@Component({
  imports: [XmasFrost],
  template: `<xmas-frost
    [mode]="mode()"
    [corners]="corners()"
    [idleTimeout]="timeout()"
    maxSize="200px"
  />`,
})
class Host {
  readonly mode = signal<XmasFrostMode>('idle');
  readonly corners = signal<XmasFrostCorner[]>([
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]);
  readonly timeout = signal(60_000);
}

/** Runs pending microtasks/zero-delay timers and change detection under fake timers. */
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  fixture.detectChanges();
}

async function setup(date = localDate(2026, 12, 10)) {
  vi.useFakeTimers();
  TestBed.configureTestingModule({ providers: [fakeClock(date).provider] });
  const fixture = TestBed.createComponent(Host);
  await settle(fixture);
  const el = fixture.nativeElement as HTMLElement;
  const frost = el.querySelector<HTMLElement>('xmas-frost')!;
  const corners = () => [...frost.querySelectorAll<HTMLElement>('[data-xmas-frost-corner]')];
  const frosted = () =>
    corners().length > 0 && corners().every((c) => c.classList.contains('frosted'));
  const advance = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  };
  return { fixture, host: fixture.componentInstance, frost, corners, frosted, advance };
}

describe('XmasFrost', () => {
  afterEach(() => vi.useRealTimers());

  it('renders nothing out of season, and sets up no idle listeners', async () => {
    const add = vi.spyOn(document, 'addEventListener');
    const { frost, advance } = await setup(localDate(2026, 11, 30));
    await advance(120_000);
    expect(frost.childElementCount).toBe(0);
    expect(frost.classList.contains('xmas-on')).toBe(false);
    expect(add.mock.calls.map(([type]) => type)).not.toContain('mousemove');
  });

  it('renders the selected corners', async () => {
    const { fixture, host, corners } = await setup();
    expect(corners()).toHaveLength(4);
    host.corners.set(['top-right', 'bottom-left']);
    await settle(fixture);
    expect(corners().map((c) => c.className)).toEqual([
      expect.stringContaining('corner--top-right'),
      expect.stringContaining('corner--bottom-left'),
    ]);
  });

  it('applies maxSize as a CSS variable and is aria-hidden', async () => {
    const { frost } = await setup();
    expect(frost.style.getPropertyValue('--xmas-frost-size')).toBe('200px');
    expect(frost.getAttribute('aria-hidden')).toBe('true');
  });

  it('static mode is always frosted', async () => {
    const { fixture, host, frosted } = await setup();
    host.mode.set('static');
    await settle(fixture);
    expect(frosted()).toBe(true);
  });

  it('idle mode: frost appears after the idle timeout', async () => {
    const { frosted, advance } = await setup();
    expect(frosted()).toBe(false);
    await advance(59_000);
    expect(frosted()).toBe(false);
    await advance(1_000);
    expect(frosted()).toBe(true);
  });

  it('idle mode: activity melts the frost and restarts the countdown', async () => {
    const { frosted, advance } = await setup();
    await advance(60_000);
    expect(frosted()).toBe(true);

    document.dispatchEvent(new MouseEvent('mousemove'));
    await advance(0);
    expect(frosted()).toBe(false);

    await advance(59_000);
    expect(frosted()).toBe(false);
    await advance(1_000);
    expect(frosted()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    await advance(0);
    expect(frosted()).toBe(false);
  });

  it('idle mode: activity before the timeout postpones the frost', async () => {
    const { frosted, advance } = await setup();
    await advance(40_000);
    document.dispatchEvent(new Event('touchstart'));
    await advance(40_000);
    expect(frosted()).toBe(false);
    await advance(20_000);
    expect(frosted()).toBe(true);
  });

  it('honours a custom idleTimeout', async () => {
    const { fixture, host, frosted, advance } = await setup();
    host.timeout.set(5_000);
    await settle(fixture);
    await advance(5_000);
    expect(frosted()).toBe(true);
  });

  it('removes listeners and timers on destroy', async () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const { fixture } = await setup();
    fixture.destroy();
    expect(remove.mock.calls.map(([type]) => type)).toContain('mousemove');
    expect(vi.getTimerCount()).toBe(0);
  });
});
