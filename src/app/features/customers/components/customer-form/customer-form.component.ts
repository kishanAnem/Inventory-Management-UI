import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerService } from '../../services/customer.service';
import { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '../../models/customer.interface';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.scss']
})
export class CustomerFormComponent implements OnInit {
  customerForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  customer?: Customer;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CustomerFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Customer
  ) {
    this.customer = data;
    this.isEditMode = !!data;
    
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s\(\)]+$/), Validators.maxLength(20)]],
      address: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.customer) {
      this.customerForm.patchValue({
        name: this.customer.name,
        email: this.customer.email,
        phone: this.customer.phone,
        address: this.customer.address
      });
    }
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.isLoading = true;
      const formValue = this.customerForm.value;

      if (this.isEditMode && this.customer) {
        const updateData: UpdateCustomerDTO = {
          id: this.customer.id,
          ...formValue
        };

        this.customerService.updateCustomer(this.customer.id, updateData).subscribe({
          next: (customer) => {
            this.snackBar.open('Customer updated successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(customer);
          },
          error: (error) => {
            console.error('Error updating customer:', error);
            this.snackBar.open('Error updating customer', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
      } else {
        const createData: CreateCustomerDTO = formValue;

        this.customerService.createCustomer(createData).subscribe({
          next: (customer) => {
            this.snackBar.open('Customer created successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(customer);
          },
          error: (error) => {
            console.error('Error creating customer:', error);
            this.snackBar.open('Error creating customer', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.customerForm.controls).forEach(key => {
      const control = this.customerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.customerForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot exceed ${maxLength} characters`;
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.customerForm.get(fieldName);
    return !!(control?.invalid && (control?.dirty || control?.touched));
  }
}