import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <div class="unauthorized-icon">
          <mat-icon>lock</mat-icon>
        </div>
        
        <h1 class="unauthorized-title">Access Denied</h1>
        <p class="unauthorized-message">
          You don't have permission to access this resource. 
          Please contact your administrator if you believe this is an error.
        </p>
        
        <div class="unauthorized-actions">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="goHome()"
            class="action-button">
            <mat-icon>home</mat-icon>
            Go to Dashboard
          </button>
          
          <button 
            mat-stroked-button 
            (click)="logout()"
            class="action-button">
            <mat-icon>logout</mat-icon>
            Switch Account
          </button>
        </div>
        
        <div class="unauthorized-help">
          <p>Need help? Contact support:</p>
          <a href="mailto:support@retailpro.com" class="support-link">
            <mat-icon>email</mat-icon>
            support&#64;retailpro.com
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f6f9fc 0%, #edf2f7 100%);
      padding: 20px;
    }

    .unauthorized-content {
      background: white;
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      max-width: 500px;
      width: 100%;
    }

    .unauthorized-icon {
      width: 80px;
      height: 80px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #dc2626;
      }
    }

    .unauthorized-title {
      font-size: 28px;
      font-weight: 600;
      color: #202223;
      margin: 0 0 16px 0;
    }

    .unauthorized-message {
      color: #6d7175;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 32px 0;
    }

    .unauthorized-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
    }

    .unauthorized-help {
      border-top: 1px solid #e1e1e1;
      padding-top: 24px;
      
      p {
        color: #6d7175;
        font-size: 14px;
        margin: 0 0 12px 0;
      }
    }

    .support-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #008060;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    @media (max-width: 480px) {
      .unauthorized-content {
        padding: 32px 24px;
      }
      
      .unauthorized-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class UnauthorizedComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goHome() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
  }
}