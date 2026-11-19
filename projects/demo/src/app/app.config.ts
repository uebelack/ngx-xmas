import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { XMAS_CLOCK, provideXmas } from 'ngx-xmas';

import { demoState } from './demo-state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideXmas({ forceActive: demoState.forceActive, enabled: demoState.enabled }),
    { provide: XMAS_CLOCK, useValue: () => demoState.date() ?? new Date() },
  ],
};
