import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

export interface UploadConfig {
  title: string;
  acceptedFormats?: string;
  maxFileSizeMB?: number;
}

export interface UploadResult<T = any> {
  successCount: number;
  failureCount: number;
  results?: T[];
  errors?: string[];
  data?: any;
}

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './excel-upload.component.html',
  styleUrl: './excel-upload.component.scss'
})
export class ExcelUploadComponent {
  @Input() config: UploadConfig = {
    title: 'Upload Excel File',
    acceptedFormats: '.xlsx, .xls',
    maxFileSizeMB: 10
  };

  @Output() fileUpload = new EventEmitter<File>();
  @Output() uploadComplete = new EventEmitter<UploadResult>();
  @Output() uploadError = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<UploadResult | null>();

  isDragOver = signal(false);
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadResult = signal<UploadResult | null>(null);
  errorMessage = signal<string | null>(null);

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
    const validExtensions = ['.xlsx', '.xls'];
    const isValidType = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      this.errorMessage.set(`Please select a valid Excel file (${this.config.acceptedFormats})`);
      return;
    }

    // Validate file size
    const maxSizeBytes = (this.config.maxFileSizeMB || 10) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.errorMessage.set(`File size exceeds ${this.config.maxFileSizeMB}MB limit`);
      return;
    }

    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.uploadResult.set(null);
  }

  removeFile() {
    this.selectedFile.set(null);
    this.errorMessage.set(null);
    this.uploadResult.set(null);
  }

  triggerUpload() {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.uploadResult.set(null);
    
    this.fileUpload.emit(file);
  }

  // Called by parent component to update upload state
  setUploadResult(result: UploadResult) {
    this.isUploading.set(false);
    this.uploadResult.set(result);
    this.uploadComplete.emit(result);
  }

  // Called by parent component to handle upload errors
  setUploadError(error: string) {
    this.isUploading.set(false);
    this.errorMessage.set(error);
    this.uploadError.emit(error);
  }

  resetUpload() {
    this.selectedFile.set(null);
    this.uploadResult.set(null);
    this.errorMessage.set(null);
    this.isUploading.set(false);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFailedResults(): any[] {
    const result = this.uploadResult();
    return result?.results?.filter((r: any) => !r.success) || [];
  }

  hasErrors(): boolean {
    const result = this.uploadResult();
    return (result?.errors && result.errors.length > 0) || this.getFailedResults().length > 0;
  }
}
