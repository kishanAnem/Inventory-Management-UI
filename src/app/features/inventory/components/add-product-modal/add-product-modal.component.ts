import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService, CreateProductRequest } from '../../services/inventory.service';

export interface CreateProduct {
  name: string;
  description?: string;
  barcode: string;
  price: number;
  mrp: number;
  isActive: boolean;
}

@Component({
  selector: 'app-add-product-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatOptionModule,
    MatSnackBarModule
  ],
  templateUrl: './add-product-modal.component.html',
  styleUrl: './add-product-modal.component.scss'
})
export class AddProductModalComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddProductModalComponent>);
  private inventoryService = inject(InventoryService);
  private snackBar = inject(MatSnackBar);
  private data = inject(MAT_DIALOG_DATA, { optional: true });
  
  productForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  productId?: string;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor() {
    this.isEditMode = !!this.data;
    this.productId = this.data?.id;

    this.productForm = this.fb.group({
      name: [this.data?.name || '', [Validators.required, Validators.minLength(2)]],
      description: [this.data?.description || ''],
      barcode: [this.data?.barcode || '', [Validators.required]],
      price: [this.data?.price || 0, [Validators.required, Validators.min(0.01)]],
      mrp: [this.data?.mrp || 0, [Validators.required, Validators.min(0.01)]],
      quantity: [this.data?.quantity || 0, [Validators.required, Validators.min(0)]],
      minimumQuantity: [this.data?.minimumQuantity || 0, [Validators.required, Validators.min(0)]],
      isActive: [this.data?.isActive !== undefined ? this.data.isActive : true]
    });
  }

  onSubmit() {
    if (this.productForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage.set(null);
      this.successMessage.set(null);
      
      if (this.isEditMode && this.productId) {
        // Update existing product
        const productData = {
          id: this.productId,
          ...this.productForm.value
        };
        
        this.inventoryService.update(this.productId, productData).subscribe({
          next: (updatedProduct) => {
            this.successMessage.set('Product updated successfully!');
            this.snackBar.open('Product updated successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            });
            this.dialogRef.close(updatedProduct);
          },
          error: (error) => {
            console.error('Error updating product:', error);
            const errorMsg = error?.error?.message || error?.message || 'Error updating product. Please try again.';
            this.errorMessage.set(errorMsg);
            this.isSubmitting = false;
          }
        });
      } else {
        // Create new product
        const productData: CreateProductRequest = this.productForm.value;
        
        this.inventoryService.createProduct(productData).subscribe({
          next: (createdProduct) => {
            this.successMessage.set('Product created successfully!');
            this.snackBar.open('Product created successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            });
            this.dialogRef.close(createdProduct);
          },
          error: (error) => {
            console.error('Error creating product:', error);
            const errorMsg = error?.error?.message || error?.message || 'Error creating product. Please try again.';
            this.errorMessage.set(errorMsg);
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  generateBarcode() {
    // Generate a simple random barcode
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.productForm.patchValue({
      barcode: `${timestamp}${random}`
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.productForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('min')) {
      return `${this.getFieldDisplayName(fieldName)} must be greater than 0`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      name: 'Product name',
      barcode: 'Barcode',
      price: 'Price',
      mrp: 'MRP'
    };
    return displayNames[fieldName] || fieldName;
  }
}