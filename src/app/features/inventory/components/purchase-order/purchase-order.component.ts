import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UploadPurchaseOrdersModalComponent } from '../upload-purchase-orders-modal/upload-purchase-orders-modal.component';
import { AddPurchaseOrderModalComponent } from '../add-purchase-order-modal/add-purchase-order-modal.component';
import { InventoryService } from '../../services/inventory.service';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface PurchaseOrder {
  id: string;
  tenantId: string;
  productId: string;
  qtyRemaining: number;
  unitCost: number;
  purchaseDate: string;
  poNumber: string;
  supplierName: string;
  expiryDate: string;
}

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './purchase-order.component.html',
  styleUrl: './purchase-order.component.scss'
})
export class PurchaseOrderComponent {
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  
  purchaseOrders = signal<PurchaseOrder[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = '';

  downloadTemplate() {
    this.inventoryService.downloadPurchaseOrderTemplate().subscribe({
      next: (blob) => {
        this.inventoryService.triggerFileDownload(blob, 'purchase-order-template.xlsx');
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
        // Purchase orders were uploaded, refresh the list
        // TODO: Implement refresh logic
        console.log('Upload result:', result);
      }
    });
  }

  onSearch() {
    // Implement search logic
    console.log('Searching for:', this.searchTerm);
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
        // Purchase order was created, refresh the list or add to local array
        console.log('Created purchase order:', result);
        // TODO: Refresh purchase orders list or update local data
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
    // TODO: Implement delete order
    console.log('Delete order:', id);
  }
}
