import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface UploadResponse {
  successCount: number;
  failureCount: number;
  createdProducts: any[];
  errors: string[];
}

@Component({
  selector: 'app-upload-products-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './upload-products-modal.component.html',
  styleUrl: './upload-products-modal.component.scss'
})
export class UploadProductsModalComponent {
  private dialogRef = inject(MatDialogRef<UploadProductsModalComponent>);
  private http = inject(HttpClient);

  isDragOver = signal(false);
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadProgress = signal(0);
  uploadResult = signal<UploadResponse | null>(null);
  uploadError = signal<string | null>(null);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ];
    
    const isValidType = validTypes.some(type => 
      file.type === type || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );

    if (!isValidType) {
      this.uploadError.set('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    this.selectedFile.set(file);
    this.uploadError.set(null);
    this.uploadResult.set(null);
  }

  removeFile() {
    this.selectedFile.set(null);
    this.uploadError.set(null);
    this.uploadResult.set(null);
  }

  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.uploadError.set(null);
    this.uploadResult.set(null);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<{ success: boolean; message: string; data: UploadResponse }>(
      `${environment.apiUrl}/api/Products/upload`,
      formData
    ).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.uploadResult.set(response.data);
      },
      error: (error) => {
        this.isUploading.set(false);
        this.uploadError.set(error.error?.message || 'Upload failed. Please try again.');
        console.error('Upload error:', error);
      }
    });
  }

  onClose() {
    const result = this.uploadResult();
    this.dialogRef.close(result?.successCount ? result : null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
