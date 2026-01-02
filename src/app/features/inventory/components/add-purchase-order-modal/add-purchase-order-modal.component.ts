import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService } from '../../services/inventory.service';

export interface CreatePurchaseOrderRequest {
  productId: string;
  qtyOrdered: number;
  unitCost: number;
  purchaseDate: string;
  poNumber: string;
  supplierName: string;
  expiryDate?: string;
}

@Component({
  selector: 'app-add-purchase-order-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './add-purchase-order-modal.component.html',
  styleUrl: './add-purchase-order-modal.component.scss'
})
export class AddPurchaseOrderModalComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddPurchaseOrderModalComponent>);
  private inventoryService = inject(InventoryService);
  private snackBar = inject(MatSnackBar);
  
  purchaseOrderForm: FormGroup;
  isSubmitting = false;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  minDate = new Date();

  constructor() {
    this.purchaseOrderForm = this.fb.group({
      productId: ['', [Validators.required]],
      qtyOrdered: [0, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0.01)]],
      purchaseDate: [new Date(), [Validators.required]],
      poNumber: [''],
      supplierName: [''],
      expiryDate: ['']
    });
  }

  onSubmit() {
    if (this.purchaseOrderForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage.set(null);
      this.successMessage.set(null);
      
      const formValue = this.purchaseOrderForm.value;
      const purchaseOrderData: CreatePurchaseOrderRequest = {
        productId: formValue.productId,
        qtyOrdered: formValue.qtyOrdered,
        unitCost: formValue.unitCost,
        purchaseDate: this.formatDate(formValue.purchaseDate),
        poNumber: formValue.poNumber,
        supplierName: formValue.supplierName,
        expiryDate: formValue.expiryDate ? this.formatDate(formValue.expiryDate) : undefined
      };
      
      this.inventoryService.createPurchaseOrder(purchaseOrderData).subscribe({
        next: (createdPO) => {
          this.successMessage.set('Purchase order created successfully!');
          this.snackBar.open('Purchase order created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(createdPO);
        },
        error: (error) => {
          console.error('Error creating purchase order:', error);
          const errorMsg = error?.error?.message || error?.message || 'Error creating purchase order. Please try again.';
          this.errorMessage.set(errorMsg);
          this.snackBar.open(errorMsg, 'Close', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  generatePONumber() {
    const prefix = 'PO';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    this.purchaseOrderForm.patchValue({
      poNumber: `${prefix}-${timestamp.slice(-6)}${random}`
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.purchaseOrderForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('min')) {
      const minValue = control.errors?.['min']?.min;
      return `${this.getFieldLabel(fieldName)} must be at least ${minValue}`;
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }
    
    return 'Invalid field';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      productId: 'Product ID',
      qtyOrdered: 'Quantity',
      unitCost: 'Unit Cost',
      purchaseDate: 'Purchase Date',
      poNumber: 'PO Number',
      supplierName: 'Supplier Name',
      expiryDate: 'Expiry Date'
    };
    return labels[fieldName] || fieldName;
  }

  private formatDate(date: Date): string {
    return date.toISOString();
  }

  private markFormGroupTouched() {
    Object.keys(this.purchaseOrderForm.controls).forEach(key => {
      const control = this.purchaseOrderForm.get(key);
      control?.markAsTouched();
    });
  }
}
