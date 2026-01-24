import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { DashboardService, DashboardResponse } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  dashboardData: DashboardResponse | null = null;
  isLoading = true;
  
  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Auth guard ensures only authenticated users reach this component
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Service now handles caching internally
    this.dashboardService.loadDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard:', error);
        
        // Check if error is related to authentication/refresh token
        if (error?.message?.includes('Missing Refresh Token') || 
            error?.message?.includes('login_required') ||
            error?.status === 401) {
          console.warn('Authentication error detected, redirecting to login');
          this.authService.logout();
        } else {
          this.isLoading = false;
        }
      }
    });
  }

  navigateToInventory() {
    this.router.navigate(['/inventory']);
  }

  navigateToDebug() {
    this.router.navigate(['/debug']);
  }

  navigateToReports() {
    // TODO: Implement reports route
    console.log('Navigate to reports');
  }

  navigateToCustomers() {
    // TODO: Implement customers route
    console.log('Navigate to customers');
  }

  // Setup guidance methods
  isInitialSetupNeeded(): boolean {
    if (!this.dashboardData?.metrics) return false;
    
    return this.dashboardData.metrics.totalProducts === 0 && 
           this.dashboardData.metrics.totalSales === 0 && 
           this.dashboardData.metrics.totalCustomers === 0;
  }

  isBusinessEmpty(): boolean {
    if (!this.dashboardData?.metrics) return false;
    
    return this.dashboardData.metrics.totalProducts === 0;
  }

  hasProducts(): boolean {
    return this.dashboardData?.metrics ? this.dashboardData.metrics.totalProducts > 0 : false;
  }

  hasCustomers(): boolean {
    return this.dashboardData?.metrics ? this.dashboardData.metrics.totalCustomers > 0 : false;
  }

  hasSales(): boolean {
    return this.dashboardData?.metrics ? this.dashboardData.metrics.totalSales > 0 : false;
  }

  getNextStepMessage(): string {
    if (!this.dashboardData?.metrics) return '';
    
    if (this.dashboardData.metrics.totalProducts === 0) {
      return 'Start by adding your first product to get going!';
    } else if (this.dashboardData.metrics.totalCustomers === 0) {
      return 'Great! Now add some customers to track your sales better.';
    } else if (this.dashboardData.metrics.totalSales === 0) {
      return 'Excellent! You can now make your first sale.';
    } else {
      return 'Your business is up and running! 🎉';
    }
  }

  navigateToTenantSetup() {
    this.router.navigate(['/tenant-setup']);
  }

}