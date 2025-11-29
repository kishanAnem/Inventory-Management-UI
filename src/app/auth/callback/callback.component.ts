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
  error = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    //Handle the authentication callback
    this.auth.handleRedirectCallback().subscribe({
      next: () => {
        // Successful authentication - redirect to dashboard
        this.redirectToDashboard();
      },
      error: () => {
        // Authentication error
        this.error = true;
      }
    });
  }

  private redirectToDashboard() {
    // Simply redirect to dashboard - let dashboard component handle setup checking
    this.router.navigate(['/dashboard']);
  }

  retry() {
    this.error = false;
    // Redirect to login
    this.auth.loginWithRedirect();
  }
}