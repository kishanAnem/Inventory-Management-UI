import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap, take, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth0 = inject(AuthService);
  const router = inject(Router);

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
      }),
      catchError(error => {
        // Check if error is related to missing refresh token
        if (error?.message?.includes('Missing Refresh Token') || 
            error?.error === 'login_required' ||
            error?.error === 'consent_required') {
          console.warn('Auth error detected, redirecting to login:', error.message);
          // Logout and redirect to login
          auth0.logout({
            logoutParams: {
              returnTo: `${window.location.origin}/login`
            }
          });
          return throwError(() => error);
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};