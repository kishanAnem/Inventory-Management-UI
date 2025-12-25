import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  barcode: string;
  price: number;
  mrp: number;
  quantity: number;
  minimumQuantity: number;
  isActive: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  barcode: string;
  price: number;
  mrp: number;
  quantity: number;
  minimumQuantity: number;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly apiUrl = `${environment.apiUrl}/api/products`;

  constructor(private http: HttpClient) {}

  // Security: Always send credentials and use secure headers
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      // Add Authorization header if using JWT or similar
      // 'Authorization': `Bearer ${token}`
    });
  }

  // Signal for reactive state (Angular 17+)
  readonly items = signal<InventoryItem[]>([]);

  getAll(): Observable<InventoryItem[]> {
    return this.http.get<ApiResponse<InventoryItem[]>>(this.apiUrl, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getById(id: string): Observable<InventoryItem> {
    return this.http.get<ApiResponse<InventoryItem>>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  create(item: InventoryItem): Observable<InventoryItem> {
    return this.http.post<ApiResponse<InventoryItem>>(this.apiUrl, item, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  createProduct(product: CreateProductRequest): Observable<InventoryItem> {
    return this.http.post<ApiResponse<InventoryItem>>(this.apiUrl, product, { 
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  bulkCreateProducts(products: CreateProductRequest[]): Observable<InventoryItem[]> {
    return this.http.post<ApiResponse<InventoryItem[]>>(`${this.apiUrl}/addproducts`, products, { 
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  update(id: string, item: InventoryItem): Observable<InventoryItem> {
    return this.http.put<ApiResponse<InventoryItem>>(`${this.apiUrl}/${id}`, item, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  exportProducts(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      responseType: 'blob',
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('InventoryService Error:', errorMessage);
    return throwError(() => errorMessage);
  };
}
