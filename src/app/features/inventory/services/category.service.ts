import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  categoryName: string;  // Populated from parent category
  name: string;
  description?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CreateSubCategoryRequest {
  name: string;
  description?: string;
  isActive: boolean;
  // Note: categoryId is taken from the URL, not the body
}

export interface UpdateSubCategoryRequest {
  categoryId: string;  // Can change parent category
  name: string;
  description?: string;
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
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/api`;
  private http = inject(HttpClient);

  // Cache categories and sub-categories for performance
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private subCategoriesSubject = new BehaviorSubject<SubCategory[]>([]);

  public categories$ = this.categoriesSubject.asObservable();
  public subCategories$ = this.subCategoriesSubject.asObservable();

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  // Category Methods
  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories`, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      tap(categories => this.categoriesSubject.next(categories)),
      catchError(this.handleError)
    );
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  createCategory(category: CreateCategoryRequest): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(`${this.apiUrl}/categories`, category, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      tap(() => this.refreshCategories()),
      catchError(this.handleError)
    );
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`, category, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      tap(() => this.refreshCategories()),
      catchError(this.handleError)
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      tap(() => this.refreshCategories()),
      catchError(this.handleError)
    );
  }

  // Sub-Category Methods
  getSubCategories(categoryId?: string): Observable<SubCategory[]> {
    const url = categoryId 
      ? `${this.apiUrl}/categories/${categoryId}/subcategories`
      : `${this.apiUrl}/categories/subcategories`;
      
    return this.http.get<ApiResponse<SubCategory[]>>(url, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      tap(subCategories => this.subCategoriesSubject.next(subCategories)),
      catchError(this.handleError)
    );
  }

  getSubCategoryById(id: string): Observable<SubCategory> {
    return this.http.get<ApiResponse<SubCategory>>(`${this.apiUrl}/categories/subcategories/${id}`, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  createSubCategory(categoryId: string, subCategory: CreateSubCategoryRequest): Observable<SubCategory> {
    return this.http.post<ApiResponse<SubCategory>>(`${this.apiUrl}/categories/${categoryId}/subcategories`, subCategory, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      tap(() => this.refreshSubCategories()),
      catchError(this.handleError)
    );
  }

  updateSubCategory(id: string, subCategory: UpdateSubCategoryRequest): Observable<SubCategory> {
    return this.http.put<ApiResponse<SubCategory>>(`${this.apiUrl}/categories/subcategories/${id}`, subCategory, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      map(response => response.data),
      tap(() => this.refreshSubCategories()),
      catchError(this.handleError)
    );
  }

  deleteSubCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/subcategories/${id}`, { 
      headers: this.getHeaders(), 
      withCredentials: true 
    }).pipe(
      tap(() => this.refreshSubCategories()),
      catchError(this.handleError)
    );
  }

  // Helper methods to refresh cached data
  private refreshCategories(): void {
    this.getCategories().subscribe();
  }

  private refreshSubCategories(): void {
    this.getSubCategories().subscribe();
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('CategoryService Error:', errorMessage);
    return throwError(() => error);
  };
}
