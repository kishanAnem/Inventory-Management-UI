import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, effect } from '@angular/core';
import { Store } from '@ngrx/store';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AddProductModalComponent, CreateProduct } from '../add-product-modal/add-product-modal.component';
import type { InventoryItem } from '../../services/inventory.service';
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
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule
  ]
})
export class InventoryListComponent {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  items = signal<InventoryItem[]>([]);
  loading = signal(false);
  error = signal<any>(null);
  displayedColumns: string[] = ['name', 'quantity', 'price', 'totalValue', 'actions'];

  constructor() {
    // Dispatch load action on init
    this.store.dispatch(InventoryActions.loadInventory());

    // Connect signals to store selectors
    effect(() => {
      this.store.select(selectAllInventoryItems).subscribe(items => this.items.set(items));
      this.store.select(selectInventoryLoading).subscribe(loading => this.loading.set(loading));
      this.store.select(selectInventoryError).subscribe(error => this.error.set(error));
    });
  }

  deleteItem(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.store.dispatch(InventoryActions.deleteItem({ id }));
    }
  }

  openAddProductModal() {
    const dialogRef = this.dialog.open(AddProductModalComponent);
    // , {
    //   width: '600px',
    //   maxWidth: '90vw',
    //   disableClose: true,
    //   autoFocus: true
    // });

    dialogRef.afterClosed().subscribe((result: InventoryItem | undefined) => {
      if (result) {
        // Product was successfully created by the modal
        // Refresh the inventory list
        this.store.dispatch(InventoryActions.loadInventory());
      }
    });
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

  getQuantityClass(quantity: number): string {
    if (quantity <= 5) return 'low-stock';
    if (quantity <= 15) return 'medium-stock';
    return 'high-stock';
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
}
