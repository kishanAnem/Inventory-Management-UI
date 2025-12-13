import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="shopify-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">{{ data.title }}</h2>
        <button class="close-button" (click)="onCancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">
        <p>{{ data.message }}</p>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          class="btn btn-danger" 
          [ngClass]="{'btn-danger': data.type === 'danger', 'btn-primary': data.type !== 'danger'}"
          (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .shopify-dialog {
      background: white;
      border-radius: 8px;
      max-width: 500px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 16px;
      border-bottom: 1px solid #e5e5e5;
    }

    .dialog-title {
      font-size: 18px;
      font-weight: 600;
      color: #202223;
      margin: 0;
      line-height: 24px;
    }

    .close-button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: #6d7175;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .close-button:hover {
      background-color: #f6f6f7;
    }

    .close-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .dialog-content {
      padding: 20px;
      color: #6d7175;
      font-size: 14px;
      line-height: 20px;
    }

    .dialog-content p {
      margin: 0;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px 20px;
      border-top: 1px solid #e5e5e5;
    }

    .btn {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      line-height: 20px;
      min-width: 80px;
    }

    .btn-secondary {
      background: white;
      color: #202223;
      border: 1px solid #c9cccf;
    }

    .btn-secondary:hover {
      background: #f6f6f7;
      border-color: #8c9196;
    }

    .btn-primary {
      background: #2c6ecb;
      color: white;
    }

    .btn-primary:hover {
      background: #1f5199;
    }

    .btn-danger {
      background: #d82c0d;
      color: white;
    }

    .btn-danger:hover {
      background: #bf2600;
    }

    .btn:focus {
      outline: 2px solid #005bd3;
      outline-offset: 2px;
    }
  `]
})
export class ConfirmDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'warning': return 'warning';
      case 'danger': return 'error';
      default: return 'info';
    }
  }

  getIconClass(): string {
    switch (this.data.type) {
      case 'warning': return 'text-warning';
      case 'danger': return 'text-danger';
      default: return 'text-info';
    }
  }

  getButtonColor(): string {
    return this.data.type === 'danger' ? 'warn' : 'primary';
  }

  getButtonClass(): string {
    return this.data.type === 'danger' ? 'retail-pro-btn-danger' : 'retail-pro-btn-primary';
  }
}