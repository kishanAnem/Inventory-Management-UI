import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, take } from 'rxjs/operators';

export const rootRedirectGuard = () => {
  const auth0 = inject(AuthService);
  const router = inject(Router);

  return auth0.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        router.navigate(['/dashboard']);
      } else {
        router.navigate(['/login']);
      }
      return false; // Prevent navigation to the guarded route
    })
  );
};