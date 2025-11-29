import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  Customer, 
  CreateCustomerDTO, 
  UpdateCustomerDTO, 
  CustomerSearchResult,
  CustomerPurchaseHistory,
  CustomerStats
} from '../models/customer.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly apiUrl = `${environment.apiUrl}/api/customers`;
  private customersSubject = new BehaviorSubject<Customer[]>([]);
  public customers$ = this.customersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all customers
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl).pipe(
      tap(customers => this.customersSubject.next(customers))
    );
  }

  // Get customer by ID
  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  // Create new customer
  createCustomer(customer: CreateCustomerDTO): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer).pipe(
      tap(() => this.refreshCustomers())
    );
  }

  // Update existing customer
  updateCustomer(id: string, customer: UpdateCustomerDTO): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer).pipe(
      tap(() => this.refreshCustomers())
    );
  }

  // Delete customer
  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refreshCustomers())
    );
  }

  // Search customers
  searchCustomers(searchTerm: string): Observable<Customer[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<Customer[]>(`${this.apiUrl}/search`, { params });
  }

  // Get customer purchase history
  getCustomerPurchaseHistory(customerId: string): Observable<CustomerPurchaseHistory> {
    return this.http.get<CustomerPurchaseHistory>(`${this.apiUrl}/${customerId}/purchase-history`);
  }

  // Send WhatsApp message to customer
  sendWhatsAppMessage(customerId: string, message: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${customerId}/whatsapp`, { message });
  }

  // Get customer statistics
  getCustomerStats(): Observable<CustomerStats> {
    return this.http.get<CustomerStats>(`${this.apiUrl}/stats`);
  }

  // Check if customer exists
  checkCustomerExists(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${id}/exists`);
  }

  // Refresh customers list
  private refreshCustomers(): void {
    this.getCustomers().subscribe();
  }

  // Get current customers from subject
  getCurrentCustomers(): Customer[] {
    return this.customersSubject.value;
  }

  // Export customers to CSV
  exportCustomersToCSV(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, { 
      responseType: 'blob',
      headers: { 'Accept': 'text/csv' }
    });
  }

  // Import customers from CSV
  importCustomersFromCSV(file: File): Observable<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: number; errors: string[] }>(`${this.apiUrl}/import/csv`, formData);
  }
}