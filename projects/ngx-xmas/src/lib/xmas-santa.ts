import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Santa's sled, pulled by reindeer, occasionally flying across the host element.
 * Only visible in December. Place it in a positioned container such as a nav bar;
 * it fills and clips to it.
 *
 * ```html
 * <nav style="position: relative">
 *   <xmas-santa [minInterval]="120000" [maxInterval]="600000" />
 * </nav>
 * ```
 */
@Component({
  selector: 'xmas-santa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (flight(); as f) {
      <div
        class="flight"
        [class.rtl]="f.rtl"
        [style.animation-duration]="duration() + 'ms'"
        data-xmas-santa-flight
      >
        <svg viewBox="-130 0 490 90" focusable="false" aria-hidden="true">
          <!-- sparkle trail -->
          <path
            class="sparkle"
            style="--i: 0"
            d="M-12 44 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 l4 -1.6 z"
          />
          <path
            class="sparkle"
            style="--i: 1"
            d="M-30 58 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 z"
          />
          <path
            class="sparkle"
            style="--i: 2"
            d="M-46 40 l1.4 3.4 l3.4 1.4 l-3.4 1.4 l-1.4 3.4 l-1.4 -3.4 l-3.4 -1.4 l3.4 -1.4 z"
          />
          <path
            class="sparkle"
            style="--i: 3"
            d="M-64 54 l1 2.6 l2.6 1 l-2.6 1 l-1 2.6 l-1 -2.6 l-2.6 -1 l2.6 -1 z"
          />
          <path
            class="sparkle"
            style="--i: 4"
            d="M-80 44 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 z"
          />
          <path
            class="sparkle"
            style="--i: 5"
            d="M-98 60 l0.8 2 l2 0.8 l-2 0.8 l-0.8 2 l-0.8 -2 l-2 -0.8 l2 -0.8 z"
          />
          <path
            class="sparkle"
            style="--i: 6"
            d="M-112 48 l0.9 2.2 l2.2 0.9 l-2.2 0.9 l-0.9 2.2 l-0.9 -2.2 l-2.2 -0.9 l2.2 -0.9 z"
          />
          <circle class="sparkle dot" style="--i: 7" cx="-22" cy="52" r="1.2" />
          <circle class="sparkle dot" style="--i: 8" cx="-56" cy="48" r="1" />
          <circle class="sparkle dot" style="--i: 9" cx="-88" cy="54" r="0.9" />

          <!-- harness and reins -->
          <path class="harness" d="M116 58 L196 50 L264 48 L332 46" />
          <path
            class="reins"
            d="M84 44 Q140 44 196 49 M196 49 Q230 46 264 47 M264 47 Q300 44 332 45"
          />

          <g class="sleigh" transform="translate(0 10)">
            <!-- sack -->
            <path class="sack" d="M10 42 C5 30 10 16 22 13 C24 7 32 7 33 13 C44 17 48 30 43 42 Z" />
            <path class="sack-tie" d="M22 13 C25 15 30 15 33 13" />
            <rect class="box" x="20" y="4" width="10" height="8" rx="1" />

            <!-- Santa -->
            <path class="coat" d="M46 42 C44 28 50 18 62 17 C74 17 80 28 78 42 Z" />
            <path class="coat" d="M70 26 C76 28 80 32 84 34 L82 38 C77 36 72 34 68 32 Z" />
            <circle class="mitten" cx="84" cy="36" r="3" />
            <path class="beard" d="M54 14 C54 25 58 31 63 31 C68 31 72 25 72 14 Z" />
            <circle class="skin" cx="63" cy="11.5" r="6.5" />
            <circle class="cheek" cx="66.5" cy="13" r="1.8" />
            <circle class="eye" cx="65" cy="9.6" r="0.9" />
            <path class="beard" d="M59 15 C61 12.5 66 12.5 69 15 C66 17.5 62 17.5 59 15 Z" />
            <path class="coat" d="M56 8 C55 0 61 -4 68 -3 C73 -2 75 3 72 7 C67 4.5 61 4.5 56 8 Z" />
            <path class="coat" d="M58 2 C55 -3 50 -2 46 3 L49 5 C52 2 55 1 58 4 Z" />
            <circle class="fur" cx="46" cy="4.5" r="3" />
            <rect class="fur" x="54" y="5.5" width="19" height="4.5" rx="2.2" />

            <!-- sled -->
            <path
              class="sled"
              d="M4 30 C2 22 8 16 14 19 C19 22 17 30 14 36 L20 40 H92 C108 40 116 50 110 62 C106 68 98 68 90 68 H18 C8 68 4 60 4 50 Z"
            />
            <path class="trim" d="M16 46 H96 C104 46 108 52 104 58" />
            <path class="trim" d="M9 26 C10 22 13 22 13 25" />
            <path class="runner" d="M6 76 H104 C118 76 124 70 122 62 C121 57 115 56 113 60" />
            <path class="runner" d="M24 67 V76 M60 67 V76 M92 67 V76" />
          </g>

          <!-- reindeer -->
          @for (r of reindeer; track r.x) {
            <g [attr.transform]="'translate(' + r.x + ' ' + r.y + ')'">
              <g class="reindeer" [style.--phase]="r.phase">
                <path class="leg far back" d="M18 30 L15 39 L18 48" />
                <path class="leg far front" d="M44 30 L46 39 L44 48" />
                <path class="tail" d="M11 22 C6 19 4 23 6 26 C8 28 11 27 12 25 Z" />
                <ellipse class="body" cx="30" cy="27" rx="20" ry="9.5" />
                <ellipse class="belly" cx="31" cy="31.5" rx="14" ry="4.5" />
                <path class="leg near back" d="M22 31 L19 40 L22 48" />
                <path class="leg near front" d="M48 30 L50 39 L48 48" />
                <path class="body" d="M42 22 C46 16 49 11 52 7 L59 11 C56 17 52 24 49 30 Z" />
                <path class="antler" d="M54 5 C52 0 50 -4 46 -7 M51 -1 L46.5 0 M49 -4 L50.5 -9" />
                <path class="antler" d="M57 5 C58 0 60 -3 63 -6 M59 -1 L63.5 0.5" />
                <path class="body-dark" d="M52 6 L46 4 L50 9 Z" />
                <ellipse class="body" cx="57" cy="10" rx="7" ry="5" transform="rotate(15 57 10)" />
                <ellipse class="body" cx="62" cy="12.5" rx="4.2" ry="3" />
                <circle class="eye" cx="57.5" cy="8.6" r="1.1" />
                <path class="strap" d="M44 19 L49 30" />
                <circle class="bell" cx="47" cy="27" r="1.6" />
                @if (r.rudolph) {
                  <circle class="glow" cx="66" cy="12.5" r="6" />
                  <circle class="nose rudolph" cx="66" cy="12.5" r="2.5" />
                } @else {
                  <circle class="nose" cx="65.6" cy="12.5" r="1.7" />
                }
              </g>
            </g>
          }
        </svg>
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
      container-type: size;
    }

    .flight {
      position: absolute;
      left: 0;
      top: 5%;
      height: 90%;
      aspect-ratio: 490 / 90;
      will-change: transform;
      animation: xmas-fly-ltr 9s linear forwards;
    }
    .flight.rtl {
      animation-name: xmas-fly-rtl;
    }
    .flight svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .flight.rtl svg {
      transform: scaleX(-1);
    }
    @keyframes xmas-fly-ltr {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(100cqw);
      }
    }
    @keyframes xmas-fly-rtl {
      from {
        transform: translateX(100cqw);
      }
      to {
        transform: translateX(-100%);
      }
    }

    .sleigh {
      transform-box: fill-box;
      transform-origin: 60% 80%;
      animation: xmas-sleigh-bob 1.6s ease-in-out infinite;
    }
    @keyframes xmas-sleigh-bob {
      0%,
      100% {
        translate: 0 0;
        rotate: 0deg;
      }
      50% {
        translate: 0 -3px;
        rotate: -1.5deg;
      }
    }

    /* Santa and sled */
    .coat {
      fill: #d62828;
    }
    .fur,
    .beard {
      fill: #ffffff;
    }
    .skin {
      fill: #f6c9a8;
    }
    .cheek {
      fill: #ec8f80;
    }
    .eye {
      fill: #1d1d1d;
    }
    .mitten {
      fill: #1f5f3a;
    }
    .sled {
      fill: #b3121f;
    }
    .trim,
    .runner {
      fill: none;
      stroke: #f4c542;
      stroke-linecap: round;
    }
    .trim {
      stroke-width: 2;
    }
    .runner {
      stroke-width: 3.2;
    }
    .harness {
      fill: none;
      stroke: #b3121f;
      stroke-width: 2;
    }
    .reins {
      fill: none;
      stroke: #6b4220;
      stroke-width: 1;
    }
    .sack {
      fill: #9c6b3c;
    }
    .sack-tie {
      fill: none;
      stroke: #f4c542;
      stroke-width: 2;
    }
    .box {
      fill: #8338ec;
      stroke: rgb(0 0 0 / 0.15);
      stroke-width: 0.6;
    }

    /* Sparkle trail: glitter that twinkles and drifts down behind the sled. */
    .sparkle {
      fill: #ffe8a3;
      transform-box: fill-box;
      transform-origin: center;
      opacity: 0;
      animation: xmas-sparkle 1.1s ease-out infinite;
      animation-delay: calc(var(--i) * -0.13s);
      filter: drop-shadow(0 0 1.5px #ffe8a3);
    }
    .sparkle.dot {
      animation-duration: 0.9s;
    }
    @keyframes xmas-sparkle {
      0% {
        opacity: 0;
        transform: translateY(-4px) scale(0.3) rotate(0deg);
      }
      25% {
        opacity: 1;
        transform: translateY(0) scale(1.1) rotate(25deg);
      }
      100% {
        opacity: 0;
        transform: translateY(10px) scale(0.4) rotate(70deg);
      }
    }

    /* Reindeer */
    .reindeer {
      animation: xmas-reindeer-bob 0.5s ease-in-out infinite;
      animation-delay: var(--phase);
    }
    .reindeer .body {
      fill: #8b5a2b;
    }
    .reindeer .body-dark {
      fill: #5e3b1c;
    }
    .reindeer .tail {
      fill: #e9d6bc;
    }
    .reindeer .belly {
      fill: #e9d6bc;
      opacity: 0.7;
    }
    .reindeer .leg {
      fill: none;
      stroke: #8b5a2b;
      stroke-width: 3.2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transform-box: fill-box;
      transform-origin: 50% 0;
      animation: xmas-gallop 0.5s ease-in-out infinite;
    }
    .reindeer .leg.far {
      stroke: #5e3b1c;
    }
    .reindeer .leg.front.near {
      animation-delay: calc(var(--phase) - 0.04s);
    }
    .reindeer .leg.front.far {
      animation-delay: calc(var(--phase) - 0.1s);
    }
    .reindeer .leg.back.near {
      animation-delay: calc(var(--phase) - 0.25s);
    }
    .reindeer .leg.back.far {
      animation-delay: calc(var(--phase) - 0.31s);
    }
    .reindeer .antler {
      fill: none;
      stroke: #d8c29d;
      stroke-width: 1.7;
      stroke-linecap: round;
    }
    .reindeer .nose {
      fill: #2a1a10;
    }
    .reindeer .nose.rudolph {
      fill: #ff2b2b;
      animation: xmas-nose 1.2s ease-in-out infinite;
    }
    .reindeer .glow {
      fill: #ff2b2b;
      opacity: 0.35;
      transform-box: fill-box;
      transform-origin: center;
      animation: xmas-glow 1.2s ease-in-out infinite;
    }
    .reindeer .strap {
      fill: none;
      stroke: #b3121f;
      stroke-width: 3;
      stroke-linecap: round;
    }
    .reindeer .bell {
      fill: #f4c542;
    }
    @keyframes xmas-gallop {
      0%,
      100% {
        transform: rotate(30deg);
      }
      50% {
        transform: rotate(-30deg);
      }
    }
    @keyframes xmas-reindeer-bob {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-2.5px);
      }
    }
    @keyframes xmas-glow {
      0%,
      100% {
        opacity: 0.15;
        transform: scale(0.7);
      }
      50% {
        opacity: 0.55;
        transform: scale(1.25);
      }
    }
    @keyframes xmas-nose {
      0%,
      100% {
        filter: brightness(0.9);
      }
      50% {
        filter: brightness(1.5) drop-shadow(0 0 2px #ff2b2b);
      }
    }
  `,
  host: {
    'aria-hidden': 'true',
  },
})
export class XmasSanta {
  /** Shortest pause (ms) before the first flight and between flights. */
  readonly minInterval = input(90_000);
  /** Longest pause (ms) before the first flight and between flights. */
  readonly maxInterval = input(300_000);
  /** How long (ms) one crossing takes. */
  readonly duration = input(9_000);

  protected readonly flight = signal<{ rtl: boolean } | null>(null);
  protected readonly reindeer = [
    { x: 150, y: 26, phase: '-0.15s', rudolph: false },
    { x: 218, y: 24, phase: '-0.3s', rudolph: false },
    { x: 286, y: 22, phase: '0s', rudolph: true },
  ];

  /** December only, and not with reduced motion. Set after the first render so nothing runs on the server. */
  private enabled = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => {
      this.enabled =
        new Date().getMonth() === 11 &&
        !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this.scheduleNext();
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** Starts a flight now (December only). */
  fly(): void {
    if (!this.enabled || this.flight()) {
      return;
    }
    clearTimeout(this.timer);
    this.flight.set({ rtl: Math.random() < 0.5 });
    this.timer = setTimeout(() => {
      this.flight.set(null);
      this.scheduleNext();
    }, this.duration());
  }

  private scheduleNext(): void {
    if (!this.enabled) {
      return;
    }
    const min = this.minInterval();
    const max = Math.max(min, this.maxInterval());
    this.timer = setTimeout(() => this.fly(), min + Math.random() * (max - min));
  }
}
