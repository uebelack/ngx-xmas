/*
 * Public API Surface of ngx-xmas
 */

export { provideXmas, XMAS_CONFIG } from './lib/core/config';
export type { XmasConfig, XmasMonthDay, XmasResolvedConfig } from './lib/core/config';
export { XmasSeason, isWithinSeason } from './lib/core/season';
export { XMAS_CLOCK, XMAS_RANDOM } from './lib/core/tokens';
export type { XmasClock, XmasRandom } from './lib/core/tokens';
export { XmasOverlay } from './lib/overlay/overlay';
export type { XmasLength, XmasOverlayAnchor } from './lib/overlay/overlay';
export { XmasSantaHat } from './lib/overlay/santa-hat';
export { XmasFrost } from './lib/frost/frost';
export type { XmasFrostCorner, XmasFrostMode } from './lib/frost/frost';
export { XmasSanta, xmasSantaCargo } from './lib/santa/santa';
export type { XmasSantaCargo, XmasSantaDirection, XmasSantaVariant } from './lib/santa/santa';
