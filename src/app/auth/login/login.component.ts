import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@auth0/auth0-angular';
import { AuthService as LocalAuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  isLoading = false;

  constructor(
    public auth0: AuthService,
    private authService: LocalAuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user is already authenticated
    this.auth0.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loginWithGoogle() {
    this.isLoading = true;
    // Auth0 with Google connection
    this.auth0.loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2'
      }
    });
  }

  goToDebug() {
    this.router.navigate(['/debug']);
  }
}