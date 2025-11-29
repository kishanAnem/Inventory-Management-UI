import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantResponse {
  id: string;
  name: string;
  email: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  mobile: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  isActive: boolean;
  daysUntilExpiry: number;
  isTrialPeriod: boolean;
}

export interface UpdateTenantRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  mobile?: string;
  logoUrl?: string;
}

export interface TenantSetupStatus {
  isSetupComplete: boolean;
  requiresSetup: boolean;
  missingFields: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly apiUrl = `${environment.apiUrl}/api/tenant`;
  private currentTenantSubject = new BehaviorSubject<TenantResponse | null>(null);
  
  public currentTenant$ = this.currentTenantSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get current user's tenant information
   */
  getCurrentTenant(): Observable<TenantResponse> {
    return this.http.get<TenantResponse>(`${this.apiUrl}/current`);
  }

  /**
   * Initialize tenant for current user (get or create)
   */
  initializeTenant(): Observable<TenantResponse> {
    return this.http.post<TenantResponse>(`${this.apiUrl}/initialize`, {});
  }

  /**
   * Update tenant information
   */
  updateTenant(request: UpdateTenantRequest): Observable<TenantResponse> {
    return this.http.put<TenantResponse>(`${this.apiUrl}/update`, request);
  }

  /**
   * Check tenant setup status
   */
  getSetupStatus(): Observable<TenantSetupStatus> {
    return this.http.get<TenantSetupStatus>(`${this.apiUrl}/setup-status`);
  }

  /**
   * Load and cache current tenant
   */
  loadCurrentTenant(): Observable<TenantResponse> {
    const request = this.getCurrentTenant();
    request.subscribe({
      next: (tenant) => this.currentTenantSubject.next(tenant),
      error: () => {
        // If tenant doesn't exist, try to initialize it
        this.initializeTenant().subscribe({
          next: (tenant) => this.currentTenantSubject.next(tenant),
          error: (error) => console.error('Failed to initialize tenant:', error)
        });
      }
    });
    return request;
  }

  /**
   * Get cached current tenant
   */
  getCurrentTenantValue(): TenantResponse | null {
    return this.currentTenantSubject.value;
  }

  /**
   * Clear cached tenant data
   */
  clearTenant(): void {
    this.currentTenantSubject.next(null);
  }
}