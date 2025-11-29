import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppRoutingService {
  constructor(
    private auth0: AuthService,
    private router: Router
  ) {}

  // Navigate to appropriate route based on authentication status
  navigateBasedOnAuth(): Observable<boolean> {
    return this.auth0.isAuthenticated$.pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
        return isAuthenticated;
      })
    );
  }
}