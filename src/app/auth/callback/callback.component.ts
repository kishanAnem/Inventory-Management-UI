import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if there are query params (callback from Auth0)
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.has('code') || urlParams.has('error');
    
    if (!hasAuthParams) {
      // No auth params, redirect to login
      this.router.navigate(['/login']);
      return;
    }

    //Handle the authentication callback
    this.auth.handleRedirectCallback().subscribe({
      next: () => {
        // Successful authentication - redirect to dashboard
        this.redirectToDashboard();
      },
      error: (err) => {
        // Authentication error - log for debugging
        console.error('Authentication callback error:', err);
        console.error('Error details:', {
          error: err.error,
          error_description: err.error_description,
          message: err.message
        });
        
        // Clear any stale auth state from localStorage
        this.clearAuthCache();
        
        // Redirect to login page
        this.router.navigate(['/login']);
      }
    });
  }

  private redirectToDashboard() {
    // Simply redirect to dashboard - let dashboard component handle setup checking
    this.router.navigate(['/dashboard']);
  }

  private clearAuthCache() {
    // Clear Auth0 cache from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('@@auth0spajs@@') || key.startsWith('a0.spajs')) {
        localStorage.removeItem(key);
      }
    });
  }
}