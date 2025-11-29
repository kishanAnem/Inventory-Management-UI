import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardResponse {
  tenant: TenantDashboard;
  metrics: DashboardMetrics;
  alerts: DashboardAlert[];
  recentActivity: RecentActivity[];
}

export interface TenantDashboard {
  id: string;
  name: string;
  email: string;
  logoUrl: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  isSetupComplete: boolean;
  requiresSetup: boolean;
  missingFields: string[];
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  daysUntilExpiry: number;
  isTrialPeriod: boolean;
  isActive: boolean;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalSales: number;
  totalCustomers: number;
  lowStockItems: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  todaysOrders: number;
}

export interface DashboardAlert {
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  message: string;
  action: string;
  actionText: string;
  createdAt: string;
}

export interface RecentActivity {
  type: string;
  description: string;
  icon: string;
  timestamp: string;
  relativeTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/api/dashboard`;
  private dashboardDataSubject = new BehaviorSubject<DashboardResponse | null>(null);
  
  public dashboardData$ = this.dashboardDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get complete dashboard data including tenant setup status
   */
  getDashboardData(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
  }

  /**
   * Load and cache dashboard data
   */
  loadDashboardData(): Observable<DashboardResponse> {
    // Check if we already have cached data
    const cachedData = this.getCurrentDashboardData();
    if (cachedData) {
      // Return cached data as observable
      return of(cachedData);
    }

    // If no cached data, make API call and cache the result
    return this.getDashboardData().pipe(
      tap((data: DashboardResponse) => this.dashboardDataSubject.next(data))
    );
  }

  /**
   * Get cached dashboard data
   */
  getCurrentDashboardData(): DashboardResponse | null {
    return this.dashboardDataSubject.value;
  }

  /**
   * Check if tenant setup is complete from cached data
   */
  isTenantSetupComplete(): boolean {
    const data = this.getCurrentDashboardData();
    return data?.tenant?.isSetupComplete ?? false;
  }

  /**
   * Get tenant info from cached data
   */
  getTenantInfo(): TenantDashboard | null {
    const data = this.getCurrentDashboardData();
    return data?.tenant ?? null;
  }

  /**
   * Clear cached dashboard data
   */
  clearDashboardData(): void {
    this.dashboardDataSubject.next(null);
  }
}