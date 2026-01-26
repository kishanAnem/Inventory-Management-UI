import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../services/inventory.service';
import { ExcelUploadComponent, UploadConfig, UploadResult } from '../../../../shared/components/excel-upload/excel-upload.component';

@Component({
  selector: 'app-upload-products-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ExcelUploadComponent
  ],
  templateUrl: './upload-products-modal.component.html',
  styleUrl: './upload-products-modal.component.scss'
})
export class UploadProductsModalComponent {
  private dialogRef = inject(MatDialogRef<UploadProductsModalComponent>);
  private inventoryService = inject(InventoryService);

  @ViewChild(ExcelUploadComponent) excelUpload!: ExcelUploadComponent;

  uploadConfig: UploadConfig = {
    title: 'Import Products',
    acceptedFormats: '.xlsx, .xls',
    maxFileSizeMB: 10
  };

  onFileUpload(file: File) {
    this.inventoryService.uploadProducts(file).subscribe({
      next: (response: any) => {
        // Map the response to UploadResult format
        const result: UploadResult = {
          successCount: response.length || 0,
          failureCount: 0,
          data: response
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
