import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@auth0/auth0-angular';
import { AuthService as LocalAuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../core/services/snackbar.service';

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
    private router: Router,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    // Check if user is already authenticated
    this.auth0.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        console.log('User is authenticated, redirecting to dashboard');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loginWithGoogle() {
    this.isLoading = true;
    console.log('Attempting login with Google...');

    // Try direct login without specifying connection first
    this.auth0.loginWithRedirect();
  }

  // Alternative: Try popup login for testing
  loginWithPopup() {
    this.isLoading = true;
    console.log('Attempting popup login...');

    this.auth0.loginWithPopup().subscribe({
      next: () => {
        console.log('Login successful!');
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.snackbar.error('Login failed: ' + error.message);
      }
    });
  }

  goToDebug() {
    this.router.navigate(['/debug']);
  }
}