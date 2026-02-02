import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CategoryService } from '../../../services/category.service';

@Component({
    selector: 'app-sub-category-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSelectModule
    ],
    templateUrl: './sub-category-form.component.html',
    styleUrls: ['./sub-category-form.component.scss']
})
export class SubCategoryFormComponent implements OnInit {
    subCategoryForm!: FormGroup;
    isEditMode = false;
    isLoading = false;
    errorMessage = '';
    categories: any[] = [];

    constructor(
        private fb: FormBuilder,
        private categoryService: CategoryService,
        public dialogRef: MatDialogRef<SubCategoryFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.isEditMode = !!data?.subCategory;
        this.categories = data?.categories || [];
    }

    ngOnInit(): void {
        this.subCategoryForm = this.fb.group({
            categoryId: [this.data?.subCategory?.categoryId || '', [Validators.required]],
            name: [this.data?.subCategory?.name || '', [Validators.required, Validators.minLength(2)]],
            description: [this.data?.subCategory?.description || ''],
            isActive: [this.data?.subCategory?.isActive ?? true]
        });
    }

    onSubmit(): void {
        if (this.subCategoryForm.invalid) {
            this.subCategoryForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const formData = this.subCategoryForm.value;

        const request = this.isEditMode
            ? this.categoryService.updateSubCategory(this.data.subCategory.id, formData)
            : this.categoryService.createSubCategory(formData.categoryId, formData);

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
        const field = this.subCategoryForm.get(fieldName);
        if (field?.hasError('required')) {
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        }
        if (field?.hasError('minlength')) {
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 2 characters`;
        }
        return '';
    }

    hasFieldError(fieldName: string): boolean {
        const field = this.subCategoryForm.get(fieldName);
        return !!(field?.invalid && (field?.dirty || field?.touched));
    }
}
