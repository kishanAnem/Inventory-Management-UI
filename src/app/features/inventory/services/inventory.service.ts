import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  barcode: string;
  price: number;
  mrp: number;
  quantity: number;
  isActive: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  barcode: string;
  price: number;
  mrp: number;
  isActive: boolean;
}

// Mock data for development
const MOCK_INVENTORY: InventoryItem[] = [
  { 
    id: '1', 
    name: 'Laptop', 
    description: 'High-performance laptop for professionals',
    barcode: '1234567890123',
    quantity: 10, 
    price: 999.99,
    mrp: 1199.99,
    isActive: true
  },
  { 
    id: '2', 
    name: 'Mouse', 
    description: 'Wireless optical mouse',
    barcode: '1234567890124',
    quantity: 25, 
    price: 29.99,
    mrp: 39.99,
    isActive: true
  },
  { 
    id: '3', 
    name: 'Keyboard', 
    description: 'Mechanical gaming keyboard',
    barcode: '1234567890125',
    quantity: 15, 
    price: 79.99,
    mrp: 99.99,
    isActive: true
  },
  { 
    id: '4', 
    name: 'Monitor', 
    description: '24-inch LED monitor',
    barcode: '1234567890126',
    quantity: 8, 
    price: 299.99,
    mrp: 349.99,
    isActive: true
  },
  { 
    id: '5', 
    name: 'Headphones', 
    description: 'Noise-cancelling wireless headphones',
    barcode: '1234567890127',
    quantity: 20, 
    price: 149.99,
    mrp: 199.99,
    isActive: true
  }
];

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly apiUrl = `${environment.apiUrl}/api/products`;
  private readonly useMockData = false; // Set to false to use real API

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
    if (this.useMockData) {
      return of([...MOCK_INVENTORY]);
    }
    return this.http.get<InventoryItem[]>(this.apiUrl, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  getById(id: string): Observable<InventoryItem> {
    if (this.useMockData) {
      const item = MOCK_INVENTORY.find(i => i.id === id);
      return item ? of({ ...item }) : throwError(() => new Error('Item not found'));
    }
    return this.http.get<InventoryItem>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  create(item: InventoryItem): Observable<InventoryItem> {
    if (this.useMockData) {
      const newItem = { ...item, id: Date.now().toString() };
      MOCK_INVENTORY.push(newItem);
      return of({ ...newItem });
    }
    return this.http.post<InventoryItem>(this.apiUrl, item, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  createProduct(product: CreateProductRequest): Observable<InventoryItem> {
    if (this.useMockData) {
      const newItem: InventoryItem = { 
        ...product, 
        id: Date.now().toString(),
        quantity: 0 // Default quantity for new products
      };
      MOCK_INVENTORY.push(newItem);
      return of({ ...newItem });
    }
    return this.http.post<InventoryItem>(this.apiUrl, product, { 
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  update(id: string, item: InventoryItem): Observable<InventoryItem> {
    if (this.useMockData) {
      const index = MOCK_INVENTORY.findIndex(i => i.id === id);
      if (index >= 0) {
        MOCK_INVENTORY[index] = { ...item, id };
        return of({ ...MOCK_INVENTORY[index] });
      }
      return throwError(() => new Error('Item not found'));
    }
    return this.http.put<InventoryItem>(`${this.apiUrl}/${id}`, item, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  delete(id: string): Observable<void> {
    if (this.useMockData) {
      const index = MOCK_INVENTORY.findIndex(i => i.id === id);
      if (index >= 0) {
        MOCK_INVENTORY.splice(index, 1);
        return of(void 0);
      }
      return throwError(() => new Error('Item not found'));
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders(), 
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
