import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, take } from 'rxjs/operators';

export const authGuard = () => {
  const auth0 = inject(AuthService);
  const router = inject(Router);

  return auth0.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
};

// Role-based guard
export const roleGuard = (allowedRoles: string[]) => {
  const auth0 = inject(AuthService);
  const router = inject(Router);

  return auth0.user$.pipe(
    take(1),
    map(user => {
      const userRoles = user?.['https://inventorymanagement.com/roles'] || [];
      const hasRole = allowedRoles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        router.navigate(['/unauthorized']);
        return false;
      }
      return true;
    })
  );
};