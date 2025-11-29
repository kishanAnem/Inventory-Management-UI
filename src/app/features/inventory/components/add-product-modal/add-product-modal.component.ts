import { Component, inject } from '@angular/core';
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
  
  productForm: FormGroup;
  isSubmitting = false;

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      barcode: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      mrp: [0, [Validators.required, Validators.min(0.01)]],
      isActive: [true]
    });
  }

  onSubmit() {
    if (this.productForm.valid && !this.isSubmitting) {
      debugger;
      this.isSubmitting = true;
      const productData: CreateProductRequest = this.productForm.value;
      
      this.inventoryService.createProduct(productData).subscribe({
        next: (createdProduct) => {
          this.snackBar.open('Product created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.dialogRef.close(createdProduct);
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.snackBar.open('Error creating product. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
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