import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One galloping reindeer, facing right, drawn in a ~68×58 box (antlers reach to y≈-9,
 * hooves to y≈48). Internal to `<xmas-santa>`; not exported from the public API.
 */
@Component({
  selector: 'g[xmas-reindeer]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg:g class="bob">
      <svg:path class="leg far back" d="M18 30 L15 39 L18 48" />
      <svg:path class="leg far front" d="M44 30 L46 39 L44 48" />
      <svg:path class="tail" d="M11 22 C6 19 4 23 6 26 C8 28 11 27 12 25 Z" />
      <svg:ellipse class="fur" cx="30" cy="27" rx="20" ry="9.5" />
      <svg:ellipse class="belly" cx="31" cy="31.5" rx="14" ry="4.5" />
      <svg:path class="leg near back" d="M22 31 L19 40 L22 48" />
      <svg:path class="leg near front" d="M48 30 L50 39 L48 48" />
      <svg:path class="fur" d="M42 22 C46 16 49 11 52 7 L59 11 C56 17 52 24 49 30 Z" />
      <svg:path class="antler" d="M54 5 C52 0 50 -4 46 -7 M51 -1 L46.5 0 M49 -4 L50.5 -9" />
      <svg:path class="antler" d="M57 5 C58 0 60 -3 63 -6 M59 -1 L63.5 0.5" />
      <svg:path class="fur-dark" d="M52 6 L46 4 L50 9 Z" />
      <svg:ellipse class="fur" cx="57" cy="10" rx="7" ry="5" transform="rotate(15 57 10)" />
      <svg:ellipse class="fur" cx="62" cy="12.5" rx="4.2" ry="3" />
      <svg:circle class="eye" cx="57.5" cy="8.6" r="1.1" />
      <svg:path class="harness" d="M44 19 L49 30" />
      <svg:circle class="bell" cx="47" cy="27" r="1.6" />
      @if (rudolph()) {
        <svg:circle class="glow" cx="66" cy="12.5" r="6" />
        <svg:circle class="nose rudolph" cx="66" cy="12.5" r="2.5" />
      } @else {
        <svg:circle class="nose" cx="65.6" cy="12.5" r="1.7" />
      }
    </svg:g>
  `,
  styles: `
    :host {
      --xmas-phase: 0s;
    }
    .bob,
    .leg,
    .glow,
    .nose.rudolph {
      animation-play-state: var(--xmas-play, running);
    }
    .bob {
      animation: xmas-reindeer-bob 0.5s ease-in-out infinite;
      animation-delay: var(--xmas-phase);
    }
    .fur {
      fill: var(--xmas-reindeer, #8b5a2b);
    }
    .fur-dark {
      fill: var(--xmas-reindeer-dark, #5e3b1c);
    }
    .tail {
      fill: var(--xmas-reindeer-belly, #e9d6bc);
    }
    .belly {
      fill: var(--xmas-reindeer-belly, #e9d6bc);
      opacity: 0.7;
    }
    .leg {
      fill: none;
      stroke: var(--xmas-reindeer, #8b5a2b);
      stroke-width: 3.2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transform-box: fill-box;
      transform-origin: 50% 0;
      animation: xmas-gallop 0.5s ease-in-out infinite;
    }
    .leg.far {
      stroke: var(--xmas-reindeer-dark, #5e3b1c);
    }
    .leg.front.near {
      animation-delay: calc(var(--xmas-phase) - 0.04s);
    }
    .leg.front.far {
      animation-delay: calc(var(--xmas-phase) - 0.1s);
    }
    .leg.back.near {
      animation-delay: calc(var(--xmas-phase) - 0.25s);
    }
    .leg.back.far {
      animation-delay: calc(var(--xmas-phase) - 0.31s);
    }
    .antler {
      fill: none;
      stroke: var(--xmas-antler, #d8c29d);
      stroke-width: 1.7;
      stroke-linecap: round;
    }
    .eye {
      fill: #1d1d1d;
    }
    .nose {
      fill: #2a1a10;
    }
    .nose.rudolph {
      fill: var(--xmas-rudolph-nose, #ff2b2b);
      animation: xmas-nose 1.2s ease-in-out infinite;
    }
    .glow {
      fill: var(--xmas-rudolph-nose, #ff2b2b);
      opacity: 0.35;
      transform-box: fill-box;
      transform-origin: center;
      animation: xmas-glow 1.2s ease-in-out infinite;
    }
    .harness {
      fill: none;
      stroke: var(--xmas-santa-sled, #b3121f);
      stroke-width: 3;
      stroke-linecap: round;
    }
    .bell {
      fill: var(--xmas-santa-trim, #f4c542);
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
        filter: brightness(1.5) drop-shadow(0 0 2px var(--xmas-rudolph-nose, #ff2b2b));
      }
    }
  `,
  host: {
    '[style.--xmas-phase]': 'phase()',
  },
})
export class XmasReindeer {
  readonly rudolph = input(false);
  /** Animation delay (CSS time) so the team doesn't gallop in lockstep. */
  readonly phase = input('0s');
}
