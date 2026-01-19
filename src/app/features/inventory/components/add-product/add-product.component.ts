import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService, CreateProductRequest, InventoryItem } from '../../services/inventory.service';
import { CategoryService, Category, SubCategory } from '../../services/category.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatOptionModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private inventoryService = inject(InventoryService);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  
  productForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  isLoading = false;
  productId?: string;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Category-related properties
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  filteredSubCategories: SubCategory[] = [];
  showAddCategoryDialog = false;
  showAddSubCategoryDialog = false;
  newCategoryName = '';
  newSubCategoryName = '';
  isAddingCategory = false;
  isAddingSubCategory = false;

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      barcode: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      mrp: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      minimumQuantity: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      categoryId: [''],
      subCategoryId: ['']
    });

    // Subscribe to category changes to filter sub-categories
    this.productForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.onCategoryChange(categoryId);
    });
  }

  ngOnInit(): void {
    // Load categories and sub-categories
    this.loadCategories();
    this.loadSubCategories();

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = params['id'];
        if (this.productId) {
          this.loadProduct(this.productId);
        }
      }
    });
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    this.inventoryService.getById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          barcode: product.barcode,
          price: product.price,
          mrp: product.mrp,
          quantity: product.quantity,
          minimumQuantity: product.minimumQuantity,
          isActive: product.isActive,
          categoryId: product.categoryId,
          subCategoryId: product.subCategoryId
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.errorMessage.set('Error loading product. Please try again.');
        this.isLoading = false;
        this.snackBar.open('Error loading product', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }
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
            this.router.navigate(['/inventory']);
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
            this.router.navigate(['/inventory']);
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
    this.router.navigate(['/inventory']);
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

  // Category Management Methods
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => c.isActive);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSubCategories(): void {
    this.categoryService.getSubCategories().subscribe({
      next: (subCategories) => {
        this.subCategories = subCategories.filter(sc => sc.isActive);
        // Filter based on current category selection
        const categoryId = this.productForm.get('categoryId')?.value;
        if (categoryId) {
          this.filteredSubCategories = this.subCategories.filter(sc => sc.categoryId === categoryId);
        }
      },
      error: (error) => {
        console.error('Error loading sub-categories:', error);
      }
    });
  }

  onCategoryChange(categoryId: string): void {
    if (categoryId) {
      this.filteredSubCategories = this.subCategories.filter(sc => sc.categoryId === categoryId);
      // Reset sub-category if the selected one doesn't belong to the new category
      const currentSubCategoryId = this.productForm.get('subCategoryId')?.value;
      if (currentSubCategoryId) {
        const isValidSubCategory = this.filteredSubCategories.some(sc => sc.id === currentSubCategoryId);
        if (!isValidSubCategory) {
          this.productForm.patchValue({ subCategoryId: '' });
        }
      }
    } else {
      this.filteredSubCategories = [];
      this.productForm.patchValue({ subCategoryId: '' });
    }
  }

  openAddCategoryDialog(): void {
    this.showAddCategoryDialog = true;
    this.newCategoryName = '';
  }

  closeAddCategoryDialog(): void {
    this.showAddCategoryDialog = false;
    this.newCategoryName = '';
  }

  addNewCategory(): void {
    if (this.newCategoryName.trim() && !this.isAddingCategory) {
      this.isAddingCategory = true;
      const newCategory = {
        name: this.newCategoryName.trim(),
        isActive: true
      };

      this.categoryService.createCategory(newCategory).subscribe({
        next: (category) => {
          this.categories.push(category);
          this.productForm.patchValue({ categoryId: category.id });
          this.snackBar.open('Category added successfully!', 'Close', {
            duration: 2000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.closeAddCategoryDialog();
          this.isAddingCategory = false;
        },
        error: (error) => {
          console.error('Error adding category:', error);
          this.snackBar.open('Error adding category. Please try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.isAddingCategory = false;
        }
      });
    }
  }

  openAddSubCategoryDialog(): void {
    const categoryId = this.productForm.get('categoryId')?.value;
    if (!categoryId) {
      this.snackBar.open('Please select a category first', 'Close', {
        duration: 2000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }
    this.showAddSubCategoryDialog = true;
    this.newSubCategoryName = '';
  }

  closeAddSubCategoryDialog(): void {
    this.showAddSubCategoryDialog = false;
    this.newSubCategoryName = '';
  }

  addNewSubCategory(): void {
    const categoryId = this.productForm.get('categoryId')?.value;
    if (this.newSubCategoryName.trim() && categoryId && !this.isAddingSubCategory) {
      this.isAddingSubCategory = true;
      const newSubCategory = {
        name: this.newSubCategoryName.trim(),
        isActive: true
      };

      this.categoryService.createSubCategory(categoryId, newSubCategory).subscribe({
        next: (subCategory) => {
          this.subCategories.push(subCategory);
          this.filteredSubCategories.push(subCategory);
          this.productForm.patchValue({ subCategoryId: subCategory.id });
          this.snackBar.open('Sub-category added successfully!', 'Close', {
            duration: 2000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.closeAddSubCategoryDialog();
          this.isAddingSubCategory = false;
        },
        error: (error) => {
          console.error('Error adding sub-category:', error);
          this.snackBar.open('Error adding sub-category. Please try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.isAddingSubCategory = false;
        }
      });
    }
  }
}

  private inventoryService = inject(InventoryService);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  private data = inject(MAT_DIALOG_DATA, { optional: true });
  
  productForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  productId?: string;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Category-related properties
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  filteredSubCategories: SubCategory[] = [];
  showAddCategoryDialog = false;
  showAddSubCategoryDialog = false;
  newCategoryName = '';
  newSubCategoryName = '';
  isAddingCategory = false;
  isAddingSubCategory = false;

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
      isActive: [this.data?.isActive !== undefined ? this.data.isActive : true],
      categoryId: [this.data?.categoryId || ''],
      subCategoryId: [this.data?.subCategoryId || '']
    });

    // Load categories and sub-categories
    this.loadCategories();
    this.loadSubCategories();

    // Subscribe to category changes to filter sub-categories
    this.productForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.onCategoryChange(categoryId);
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

  // Category Management Methods
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(c => c.isActive);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSubCategories(): void {
    this.categoryService.getSubCategories().subscribe({
      next: (subCategories) => {
        this.subCategories = subCategories.filter(sc => sc.isActive);
        // Filter based on current category selection
        const categoryId = this.productForm.get('categoryId')?.value;
        if (categoryId) {
          this.filteredSubCategories = this.subCategories.filter(sc => sc.categoryId === categoryId);
        }
      },
      error: (error) => {
        console.error('Error loading sub-categories:', error);
      }
    });
  }

  onCategoryChange(categoryId: string): void {
    if (categoryId) {
      this.filteredSubCategories = this.subCategories.filter(sc => sc.categoryId === categoryId);
      // Reset sub-category if the selected one doesn't belong to the new category
      const currentSubCategoryId = this.productForm.get('subCategoryId')?.value;
      if (currentSubCategoryId) {
        const isValidSubCategory = this.filteredSubCategories.some(sc => sc.id === currentSubCategoryId);
        if (!isValidSubCategory) {
          this.productForm.patchValue({ subCategoryId: '' });
        }
      }
    } else {
      this.filteredSubCategories = [];
      this.productForm.patchValue({ subCategoryId: '' });
    }
  }

  openAddCategoryDialog(): void {
    this.showAddCategoryDialog = true;
    this.newCategoryName = '';
  }

  closeAddCategoryDialog(): void {
    this.showAddCategoryDialog = false;
    this.newCategoryName = '';
  }

  addNewCategory(): void {
    if (this.newCategoryName.trim() && !this.isAddingCategory) {
      this.isAddingCategory = true;
      const newCategory = {
        name: this.newCategoryName.trim(),
        isActive: true
      };

      this.categoryService.createCategory(newCategory).subscribe({
        next: (category) => {
          this.categories.push(category);
          this.productForm.patchValue({ categoryId: category.id });
          this.snackBar.open('Category added successfully!', 'Close', {
            duration: 2000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.closeAddCategoryDialog();
          this.isAddingCategory = false;
        },
        error: (error) => {
          console.error('Error adding category:', error);
          this.snackBar.open('Error adding category. Please try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.isAddingCategory = false;
        }
      });
    }
  }

  openAddSubCategoryDialog(): void {
    const categoryId = this.productForm.get('categoryId')?.value;
    if (!categoryId) {
      this.snackBar.open('Please select a category first', 'Close', {
        duration: 2000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
      return;
    }
    this.showAddSubCategoryDialog = true;
    this.newSubCategoryName = '';
  }

  closeAddSubCategoryDialog(): void {
    this.showAddSubCategoryDialog = false;
    this.newSubCategoryName = '';
  }

  addNewSubCategory(): void {
    const categoryId = this.productForm.get('categoryId')?.value;
    if (this.newSubCategoryName.trim() && categoryId && !this.isAddingSubCategory) {
      this.isAddingSubCategory = true;
      const newSubCategory = {
        name: this.newSubCategoryName.trim(),
        isActive: true
      };

      this.categoryService.createSubCategory(categoryId, newSubCategory).subscribe({
        next: (subCategory) => {
          this.subCategories.push(subCategory);
          this.filteredSubCategories.push(subCategory);
          this.productForm.patchValue({ subCategoryId: subCategory.id });
          this.snackBar.open('Sub-category added successfully!', 'Close', {
            duration: 2000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.closeAddSubCategoryDialog();
          this.isAddingSubCategory = false;
        },
        error: (error) => {
          console.error('Error adding sub-category:', error);
          this.snackBar.open('Error adding sub-category. Please try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
          this.isAddingSubCategory = false;
        }
      });
    }
  }
}