import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UploadPurchaseOrdersModalComponent } from '../upload-purchase-orders-modal/upload-purchase-orders-modal.component';
import { AddPurchaseOrderModalComponent } from '../add-purchase-order-modal/add-purchase-order-modal.component';
import { PurchaseOrderService, PurchaseOrder } from '../../services/purchase-order.service';
import { PaginationComponent, PaginationConfig, PaginationChange } from '../../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PaginationComponent
  ],
  templateUrl: './purchase-order.component.html',
  styleUrl: './purchase-order.component.scss'
})
export class PurchaseOrderComponent implements OnInit {
  private purchaseOrderService = inject(PurchaseOrderService);
  private dialog = inject(MatDialog);

  purchaseOrders = signal<PurchaseOrder[]>([]);
  filteredOrders = signal<PurchaseOrder[]>([]);
  paginatedOrders = signal<PurchaseOrder[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = '';

  paginationConfig = signal<PaginationConfig>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    pageSizeOptions: [5, 10, 20, 50, 100]
  });

  ngOnInit(): void {
    this.loadPurchaseOrders();
  }

  loadPurchaseOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.purchaseOrderService.getAllPurchaseOrders().subscribe({
      next: (response) => {
        this.purchaseOrders.set(response.items);
        this.filteredOrders.set(response.items);
        this.paginationConfig.update(config => ({
          ...config,
          totalItems: response.totalCount
        }));
        this.updatePaginatedOrders();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading purchase orders:', error);
        this.error.set('Failed to load purchase orders');
        this.loading.set(false);
      }
    });
  }

  downloadTemplate() {
    this.purchaseOrderService.downloadPurchaseOrderTemplate().subscribe({
      next: (blob) => {
        this.purchaseOrderService.triggerFileDownload(blob, 'purchase-order-template.xlsx');
      },
      error: (error) => {
        console.error('Error downloading template:', error);
        this.error.set('Failed to download template');
      }
    });
  }

  openUploadModal() {
    const dialogRef = this.dialog.open(UploadPurchaseOrdersModalComponent, {
      width: '550px',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPurchaseOrders();
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    const orders = this.purchaseOrders();

    if (!term) {
      this.filteredOrders.set(orders);
    } else {
      const filtered = orders.filter(order =>
        order.poNumber.toLowerCase().includes(term) ||
        order.supplierName.toLowerCase().includes(term) ||
        order.productId.toLowerCase().includes(term)
      );
      this.filteredOrders.set(filtered);
    }

    // Reset to first page and update pagination
    this.paginationConfig.update(config => ({
      ...config,
      currentPage: 1,
      totalItems: this.filteredOrders().length
    }));

    this.updatePaginatedOrders();
  }

  onPageChange(change: PaginationChange): void {
    this.paginationConfig.update(config => ({
      ...config,
      currentPage: change.pageNumber,
      pageSize: change.pageSize
    }));
    this.updatePaginatedOrders();
  }

  private updatePaginatedOrders(): void {
    const config = this.paginationConfig();
    const startIndex = (config.currentPage - 1) * config.pageSize;
    const endIndex = startIndex + config.pageSize;
    const paginated = this.filteredOrders().slice(startIndex, endIndex);
    this.paginatedOrders.set(paginated);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'ordered': 'status-ordered',
      'received': 'status-received',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status.toLowerCase()] || 'status-default';
  }

  createPurchaseOrder() {
    const dialogRef = this.dialog.open(AddPurchaseOrderModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPurchaseOrders();
      }
    });
  }

  viewOrder(order: PurchaseOrder) {
    // TODO: Implement view order
    console.log('View order:', order);
  }

  editOrder(order: PurchaseOrder) {
    // TODO: Implement edit order
    console.log('Edit order:', order);
  }

  deleteOrder(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Purchase Order',
        message: 'Are you sure you want to delete this purchase order? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.purchaseOrderService.deletePurchaseOrder(id).subscribe({
          next: () => {
            this.loadPurchaseOrders();
          },
          error: (error) => {
            console.error('Error deleting purchase order:', error);
            this.error.set('Failed to delete purchase order');
          }
        });
      }
    });
  }
}
