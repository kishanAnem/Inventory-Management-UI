import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, map, switchMap, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  auth0Id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  tenantId: string;
  roles: string[];
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  constructor(
    private auth0: Auth0Service,
    private http: HttpClient
  ) {}

  // Check if user is authenticated
  get isAuthenticated$(): Observable<boolean> {
    return this.auth0.isAuthenticated$;
  }

  // Get user profile from Auth0
  get user$(): Observable<any> {
    return this.auth0.user$;
  }

  // Get user profile from local API
  get userProfile$(): Observable<UserProfile | null> {
    return this.isAuthenticated$.pipe(
      switchMap(isAuth => {
        if (!isAuth) return of(null);
        return this.http.get<UserProfile>(`${environment.apiUrl}/api/auth/profile`);
      })
    );
  }

  // Login with redirect
  login(): void {
    this.auth0.loginWithRedirect();
  }

  // Login with popup
  loginWithPopup(): Observable<void> {
    return this.auth0.loginWithPopup();
  }

  // Logout
  logout(): void {
    this.auth0.logout({
      logoutParams: {
        returnTo: `${window.location.origin}/login`
      }
    });
  }

  // Get access token
  getAccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently();
  }

  // Check if user has specific role
  hasRole(role: string): Observable<boolean> {
    return this.userProfile$.pipe(
      map(profile => profile?.roles?.includes(role) ?? false)
    );
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): Observable<boolean> {
    return this.userProfile$.pipe(
      map(profile => 
        profile?.roles?.some(userRole => roles.includes(userRole)) ?? false
      )
    );
  }
}