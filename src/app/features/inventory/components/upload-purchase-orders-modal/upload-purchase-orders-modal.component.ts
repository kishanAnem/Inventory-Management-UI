import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { ExcelUploadComponent, UploadConfig, UploadResult } from '../../../../shared/components/excel-upload/excel-upload.component';

export interface PurchaseOrderResult {
  productId: string;
  productName: string;
  quantityAdded: number;
  success: boolean;
  error?: string;
}

@Component({
  selector: 'app-upload-purchase-orders-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ExcelUploadComponent
  ],
  templateUrl: './upload-purchase-orders-modal.component.html',
  styleUrl: './upload-purchase-orders-modal.component.scss'
})
export class UploadPurchaseOrdersModalComponent {
  private dialogRef = inject(MatDialogRef<UploadPurchaseOrdersModalComponent>);
  private purchaseOrderService = inject(PurchaseOrderService);

  @ViewChild(ExcelUploadComponent) excelUpload!: ExcelUploadComponent;

  uploadConfig: UploadConfig = {
    title: 'Import Purchase Orders',
    acceptedFormats: '.xlsx, .xls',
    maxFileSizeMB: 10
  };

  onFileUpload(file: File) {
    this.purchaseOrderService.uploadPurchaseOrders(file).subscribe({
      next: (response) => {
        console.log('Upload response:', response);
        // Map the API response to our UploadResult format
        const result: UploadResult<PurchaseOrderResult> = {
          successCount: response.data.successCount,
          failureCount: response.data.failureCount,
          results: response.data.results
        };
        this.excelUpload.setUploadResult(result);
      },
      error: (error) => {
        const errorMsg = error?.error?.message || error?.message || 'Upload failed. Please try again.';
        this.excelUpload.setUploadError(errorMsg);
        console.error('Upload error:', error);
      }
    });
  }

  onUploadComplete(result: UploadResult) {
    // Handle upload completion if needed
    console.log('Upload completed:', result);
  }

  onClose() {
    this.dialogRef.close(this.excelUpload?.uploadResult());
  }
}
