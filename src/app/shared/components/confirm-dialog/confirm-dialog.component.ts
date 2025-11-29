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
    <div class="retail-pro-modal-header">
      <h2 mat-dialog-title class="retail-pro-modal-title">
        <mat-icon class="me-2" [ngClass]="getIconClass()">{{ getIcon() }}</mat-icon>
        {{ data.title }}
      </h2>
    </div>

    <div mat-dialog-content class="retail-pro-modal-content">
      <p class="mb-0">{{ data.message }}</p>
    </div>

    <div mat-dialog-actions class="retail-pro-modal-actions">
      <div class="d-flex justify-content-end w-100 gap-2">
        <button 
          mat-stroked-button 
          class="retail-pro-btn"
          (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          mat-raised-button 
          [color]="getButtonColor()"
          class="retail-pro-btn"
          [ngClass]="getButtonClass()"
          (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .retail-pro-modal-header {
      padding: 1.5rem 1.5rem 0 1.5rem;
      border-bottom: 1px solid var(--retail-border-color);

      .retail-pro-modal-title {
        display: flex;
        align-items: center;
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;

        mat-icon {
          &.text-info { color: #17a2b8; }
          &.text-warning { color: #ffc107; }
          &.text-danger { color: #dc3545; }
        }
      }
    }

    .retail-pro-modal-content {
      padding: 1.5rem;
    }

    .retail-pro-modal-actions {
      padding: 1rem 1.5rem 1.5rem 1.5rem;
      border-top: 1px solid var(--retail-border-color);

      .gap-2 {
        gap: 12px !important;
      }
    }

    .retail-pro-btn-danger {
      background-color: #dc3545;
      border-color: #dc3545;
      color: white;

      &:hover {
        background-color: #c82333;
        border-color: #bd2130;
      }
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