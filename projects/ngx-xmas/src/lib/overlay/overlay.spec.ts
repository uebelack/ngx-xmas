import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { fakeClock, localDate } from '../../testing/helpers';
import { XmasLength, XmasOverlay, XmasOverlayAnchor } from './overlay';
import { XmasSantaHat } from './santa-hat';

@Component({
  imports: [XmasOverlay, XmasSantaHat],
  template: `
    <xmas-overlay
      [anchor]="anchor()"
      [top]="top()"
      [left]="left()"
      [right]="right()"
      [bottom]="bottom()"
      [width]="width()"
      [rotate]="rotate()"
      [zIndex]="zIndex()"
    >
      <img class="content" alt="" />
    </xmas-overlay>
    <xmas-santa-hat />
  `,
})
class Host {
  readonly anchor = signal<XmasOverlayAnchor>('parent');
  readonly top = signal<XmasLength | null>(null);
  readonly left = signal<XmasLength | null>(null);
  readonly right = signal<XmasLength | null>(null);
  readonly bottom = signal<XmasLength | null>(null);
  readonly width = signal<XmasLength | null>(null);
  readonly rotate = signal<string | number | null>(null);
  readonly zIndex = signal<string | number | null>(null);
}

async function setup(date: Date) {
  TestBed.configureTestingModule({ providers: [fakeClock(date).provider] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const overlay = el.querySelector<HTMLElement>('xmas-overlay')!;
  const update = async (fn: (host: Host) => void) => {
    fn(fixture.componentInstance);
    await fixture.whenStable();
  };
  return { el, overlay, update };
}

describe('XmasOverlay', () => {
  it('renders nothing out of season', async () => {
    const { el, overlay } = await setup(localDate(2026, 11, 30));
    expect(overlay.childElementCount).toBe(0);
    expect(overlay.getAttribute('style')).toBeFalsy();
    expect(el.querySelector('xmas-santa-hat')!.childElementCount).toBe(0);
  });

  it('projects content in season', async () => {
    const { el, overlay } = await setup(localDate(2026, 12, 1));
    expect(overlay.querySelector('img.content')).not.toBeNull();
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('xmas-santa-hat svg')).not.toBeNull();
  });

  it('maps inputs to styles', async () => {
    const { overlay, update } = await setup(localDate(2026, 12, 1));
    expect(overlay.style.position).toBe('absolute');

    await update((h) => {
      h.anchor.set('viewport');
      h.top.set('-1.5rem');
      h.left.set(10);
      h.right.set('5%');
      h.bottom.set('calc(100% - 20px)');
      h.width.set('48px');
      h.rotate.set(-15);
      h.zIndex.set(1000);
    });

    expect(overlay.style.position).toBe('fixed');
    expect(overlay.style.top).toBe('-1.5rem');
    expect(overlay.style.left).toBe('10px');
    expect(overlay.style.right).toBe('5%');
    expect(overlay.style.bottom).toBe('calc(100% - 20px)');
    expect(overlay.style.width).toBe('48px');
    expect(overlay.style.transform).toBe('rotate(-15deg)');
    expect(overlay.style.zIndex).toBe('1000');
  });

  it('passes CSS angle strings through', async () => {
    const { overlay, update } = await setup(localDate(2026, 12, 1));
    await update((h) => h.rotate.set('0.25turn'));
    expect(overlay.style.transform).toBe('rotate(0.25turn)');
  });

  it('never blocks pointer events', async () => {
    const { overlay } = await setup(localDate(2026, 12, 1));
    expect(getComputedStyle(overlay).pointerEvents).toBe('none');
  });
});
