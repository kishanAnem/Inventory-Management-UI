import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface CreatePurchaseOrderRequest {
    productId: string;
    qtyOrdered: number;
    unitCost: number;
    purchaseDate: string;
    poNumber: string;
    supplierName: string;
    expiryDate?: string;
}

export interface PurchaseOrder {
    id: string;
    tenantId: string;
    productId: string;
    qtyOrdered: number;
    qtyRemaining: number;
    unitCost: number;
    purchaseDate: string;
    poNumber: string;
    supplierName: string;
    expiryDate?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string | null;
    data: T;
}

export interface PaginationParams {
    pageNumber?: number;
    pageSize?: number;
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root',
})
export class PurchaseOrderService {
    private readonly apiUrl = `${environment.apiUrl}/api/purchaseorders`;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
        });
    }

    uploadPurchaseOrders(file: File): Observable<{ success: boolean; message: string; data: any }> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<{ success: boolean; message: string; data: any }>(
            `${this.apiUrl}/upload`,
            formData,
            { withCredentials: true }
        ).pipe(
            catchError(this.handleError)
        );
    }

    getAllPurchaseOrders(params?: PaginationParams): Observable<PaginatedResponse<PurchaseOrder>> {
        let queryParams = '';

        if (params) {
            const queryParts: string[] = [];

            if (params.pageNumber !== undefined) {
                queryParts.push(`pageNumber=${params.pageNumber}`);
            }
            if (params.pageSize !== undefined) {
                queryParts.push(`pageSize=${params.pageSize}`);
            }
            if (params.searchQuery) {
                queryParts.push(`searchQuery=${encodeURIComponent(params.searchQuery)}`);
            }
            if (params.sortBy) {
                queryParts.push(`sortBy=${params.sortBy}`);
            }
            if (params.sortOrder) {
                queryParts.push(`sortOrder=${params.sortOrder}`);
            }

            if (queryParts.length > 0) {
                queryParams = '?' + queryParts.join('&');
            }
        }

        return this.http.get<ApiResponse<PaginatedResponse<PurchaseOrder>>>(
            `${this.apiUrl}${queryParams}`,
            {
                headers: this.getHeaders(),
                withCredentials: true
            }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    createPurchaseOrder(purchaseOrder: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
        return this.http.post<ApiResponse<PurchaseOrder>>(
            `${this.apiUrl}`,
            purchaseOrder,
            {
                headers: this.getHeaders(),
                withCredentials: true
            }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    getPurchaseOrderById(id: string): Observable<PurchaseOrder> {
        return this.http.get<ApiResponse<PurchaseOrder>>(
            `${this.apiUrl}/${id}`,
            {
                headers: this.getHeaders(),
                withCredentials: true
            }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    updatePurchaseOrder(id: string, purchaseOrder: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
        return this.http.put<ApiResponse<PurchaseOrder>>(
            `${this.apiUrl}/${id}`,
            purchaseOrder,
            {
                headers: this.getHeaders(),
                withCredentials: true
            }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError)
        );
    }

    deletePurchaseOrder(id: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${id}`,
            {
                headers: this.getHeaders(),
                withCredentials: true
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    downloadPurchaseOrderTemplate(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/template`, {
            responseType: 'blob',
            withCredentials: true
        }).pipe(
            catchError(this.handleError)
        );
    }

    triggerFileDownload(blob: Blob, filename: string): void {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
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
        console.error('PurchaseOrderService Error:', errorMessage);
        return throwError(() => errorMessage);
    };
}
