import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService } from '../../../services/category.service';

@Component({
    selector: 'app-category-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './category-form.component.html',
    styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
    categoryForm!: FormGroup;
    isEditMode = false;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private categoryService: CategoryService,
        public dialogRef: MatDialogRef<CategoryFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.isEditMode = !!data;
    }

    ngOnInit(): void {
        this.categoryForm = this.fb.group({
            name: [this.data?.name || '', [Validators.required, Validators.minLength(2)]],
            description: [this.data?.description || ''],
            isActive: [this.data?.isActive ?? true]
        });
    }

    onSubmit(): void {
        if (this.categoryForm.invalid) {
            this.categoryForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const formData = this.categoryForm.value;

        const request = this.isEditMode
            ? this.categoryService.updateCategory(this.data.id, formData)
            : this.categoryService.createCategory(formData);

        request.subscribe({
            next: () => {
                this.isLoading = false;
                this.dialogRef.close(true);
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.message || 'An error occurred. Please try again.';
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    getFieldError(fieldName: string): string {
        const field = this.categoryForm.get(fieldName);
        if (field?.hasError('required')) {
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        }
        if (field?.hasError('minlength')) {
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 2 characters`;
        }
        return '';
    }

    hasFieldError(fieldName: string): boolean {
        const field = this.categoryForm.get(fieldName);
        return !!(field?.invalid && (field?.dirty || field?.touched));
    }
}
