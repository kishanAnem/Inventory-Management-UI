import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { inventoryReducer } from './features/inventory/store/inventory.reducer';
import { InventoryEffects } from './features/inventory/store/inventory.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore({ inventory: inventoryReducer }),
    provideEffects([InventoryEffects]),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        audience: environment.auth0.audience,
        redirect_uri: environment.auth0.redirectUri,
        scope: 'openid profile email'
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: `${environment.apiUrl}/*`,
            tokenOptions: {
              authorizationParams: {
                audience: environment.auth0.audience,
                scope: 'read:inventory write:inventory'
              }
            }
          }
        ]
      }
    })
  ]
};
