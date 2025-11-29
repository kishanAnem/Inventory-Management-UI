import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap, take } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth0 = inject(AuthService);

  // Check if request needs authentication
  if (req.url.includes('/api/') && !req.url.includes('/api/public/')) {
    return auth0.getAccessTokenSilently().pipe(
      take(1),
      switchMap(token => {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      })
    );
  }

  return next(req);
};