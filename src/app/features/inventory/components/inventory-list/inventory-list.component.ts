import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, inject, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { filter, Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UploadProductsModalComponent } from '../upload-products-modal/upload-products-modal.component';
import { PaginationComponent, PaginationConfig, PaginationChange } from '../../../../shared/components/pagination/pagination.component';
import type { InventoryItem } from '../../services/inventory.service';
import { InventoryService } from '../../services/inventory.service';
import { InventoryActions } from '../../store/inventory.actions';
import { selectAllInventoryItems, selectInventoryLoading, selectInventoryError } from '../../store/inventory.selectors';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss',
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    PaginationComponent
  ]
})
export class InventoryListComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private inventoryService = inject(InventoryService);

  items = signal<InventoryItem[]>([]);
  loading = signal(true);
  downloadLoading = signal(false);
  error = signal<any>(null);
  searchTerm = '';
  displayedColumns: string[] = ['name', 'quantity', 'price', 'totalValue', 'actions'];
  private routerSubscription?: Subscription;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  paginationConfig: PaginationConfig = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    pageSizeOptions: [5, 10, 20, 50, 100]
  };

  // Computed signal for filtered items
  filteredItems = computed(() => {
    return this.items();
  });

  constructor() {
    // Dispatch load action first
    this.loadProducts();

    // Delay store subscription to ensure dispatch completes first
    setTimeout(() => {
      effect(() => {
        this.store.select(selectAllInventoryItems).subscribe(items => this.items.set(items));
        this.store.select(selectInventoryLoading).subscribe(loading => this.loading.set(loading));
        this.store.select(selectInventoryError).subscribe(error => this.error.set(error));
      });
    }, 0);

    // Setup debounced search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchQuery => {
      this.paginationConfig.currentPage = 1; // Reset to first page on search
      this.loadProducts(searchQuery);
    });
  }

  ngOnInit() {
    // Reload inventory when navigating back to this route
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter((event: NavigationEnd) => event.url === '/inventory' || event.url === '/inventory/')
    ).subscribe(() => {
      this.loadProducts();
    });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  loadProducts(searchQuery?: string) {
    this.loading.set(true);
    this.inventoryService.getAll({
      pageNumber: this.paginationConfig.currentPage,
      pageSize: this.paginationConfig.pageSize,
      searchQuery: searchQuery
    }).subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.paginationConfig.totalItems = response.totalCount;
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error);
        this.loading.set(false);
      }
    });
  }

  onPageChange(change: PaginationChange) {
    this.paginationConfig.currentPage = change.pageNumber;
    this.paginationConfig.pageSize = change.pageSize;
    this.loadProducts(this.searchTerm.trim() || undefined);
  }

  onSearch() {
    // Emit search term to the subject, which will debounce and call API
    this.searchSubject.next(this.searchTerm.trim());
  }

  editItem(product: InventoryItem) {
    this.router.navigate(['/inventory/product/edit', product.id]);
  }

  deleteItem(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.store.dispatch(InventoryActions.deleteItem({ id }));
      }
    });
  }

  navigateAddProduct() {
    this.router.navigate(['/inventory/product/add']);
  }

  getErrorMessage(): string {
    const error = this.error();
    if (!error) return '';

    if (typeof error === 'string') return error;

    // Handle error object safely
    try {
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          return error.message;
        }
        if ('error' in error && error.error && typeof error.error === 'object' && 'message' in error.error) {
          return error.error.message;
        }
        if ('status' in error && typeof error.status === 'number') {
          const statusText = 'statusText' in error && typeof error.statusText === 'string'
            ? error.statusText
            : 'Unknown error';
          return `HTTP Error ${error.status}: ${statusText}`;
        }
      }
    } catch (e) {
      console.error('Error parsing error object:', e);
    }

    return 'An unknown error occurred';
  }

  getStockStatus(quantity: number): string {
    if (quantity <= 5) return 'Low Stock';
    if (quantity <= 15) return 'Medium';
    return 'In Stock';
  }

  getStockStatusClass(quantity: number): string {
    if (quantity <= 5) return 'low';
    if (quantity <= 15) return 'medium';
    return 'high';
  }

  getQuantityClass(quantity: number, minimumQuantity: number): string {
    if (quantity <= minimumQuantity) return 'low-stock';
    if (quantity <= minimumQuantity * 1.5) return 'medium-stock';
    return 'high-stock';
  }

  openUploadModal() {
    const dialogRef = this.dialog.open(UploadProductsModalComponent, {
      width: '550px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Products were uploaded, refresh the list
        this.loadProducts();
      }
    });
  }

  downloadTemplate() {
    this.downloadLoading.set(true);
    this.inventoryService.downloadTemplate().subscribe({
      next: (blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'product-template.xlsx';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
        this.downloadLoading.set(false);
      },
      error: (error) => {
        console.error('Error downloading template:', error);
        this.downloadLoading.set(false);
      }
    });
  }

  exportProducts() {
    this.inventoryService.exportProducts().subscribe({
      next: (blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `products-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      },
      error: (error) => {
        console.error('Error exporting products:', error);
      }
    });
  }
}
