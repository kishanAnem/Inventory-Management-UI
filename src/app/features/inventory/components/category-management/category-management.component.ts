import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { CategoryService, Category, SubCategory } from '../../services/category.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CategoryFormComponent } from './category-form/category-form.component';
import { SubCategoryFormComponent } from './sub-category-form/sub-category-form.component';

@Component({
    selector: 'app-category-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatTabsModule
    ],
    templateUrl: './category-management.component.html',
    styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
    categories = signal<Category[]>([]);
    subCategories = signal<SubCategory[]>([]);
    categoryLoading = signal(true);
    subCategoryLoading = signal(true);
    error = signal<any>(null);

    categorySearchTerm = '';
    subCategorySearchTerm = '';

    categoryPaginationConfig = {
        totalItems: 0,
        currentPage: 1,
        pageSize: 10,
        pageSizeOptions: [5, 10, 20, 50]
    };

    subCategoryPaginationConfig = {
        totalItems: 0,
        currentPage: 1,
        pageSize: 10,
        pageSizeOptions: [5, 10, 20, 50]
    };

    constructor(
        private categoryService: CategoryService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loadCategories();
        this.loadSubCategories();
    }

    loadCategories(): void {
        this.categoryLoading.set(true);
        this.categoryService.getCategories().subscribe({
            next: (categories) => {
                this.categories.set(categories);
                this.categoryPaginationConfig.totalItems = categories.length;
                this.categoryLoading.set(false);
            },
            error: (error) => {
                this.error.set(error);
                this.categoryLoading.set(false);
            }
        });
    }

    loadSubCategories(): void {
        this.subCategoryLoading.set(true);
        this.categoryService.getSubCategories().subscribe({
            next: (subCategories) => {
                this.subCategories.set(subCategories);
                this.subCategoryPaginationConfig.totalItems = subCategories.length;
                this.subCategoryLoading.set(false);
            },
            error: (error) => {
                this.error.set(error);
                this.subCategoryLoading.set(false);
            }
        });
    }

    // Category Methods
    get filteredCategories(): Category[] {
        let filtered = this.categories();
        if (this.categorySearchTerm) {
            filtered = filtered.filter(cat =>
                cat.name.toLowerCase().includes(this.categorySearchTerm.toLowerCase())
            );
        }
        this.categoryPaginationConfig.totalItems = filtered.length;
        const start = (this.categoryPaginationConfig.currentPage - 1) * this.categoryPaginationConfig.pageSize;
        const end = start + this.categoryPaginationConfig.pageSize;
        return filtered.slice(start, end);
    }

    onCategorySearch(): void {
        this.categoryPaginationConfig.currentPage = 1;
    }

    onCategoryPageChange(event: any): void {
        this.categoryPaginationConfig.currentPage = event.currentPage;
        this.categoryPaginationConfig.pageSize = event.pageSize;
    }

    addCategory(): void {
        const dialogRef = this.dialog.open(CategoryFormComponent, {
            width: '500px',
            data: null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadCategories();
            }
        });
    }

    editCategory(category: Category): void {
        const dialogRef = this.dialog.open(CategoryFormComponent, {
            width: '500px',
            data: category
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadCategories();
            }
        });
    }

    deleteCategory(id: string): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Delete Category',
                message: 'Are you sure you want to delete this category? This will also delete all associated sub-categories.'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.categoryService.deleteCategory(id).subscribe({
                    next: () => this.loadCategories(),
                    error: (error) => this.error.set(error)
                });
            }
        });
    }

    // Sub-Category Methods
    get filteredSubCategories(): SubCategory[] {
        let filtered = this.subCategories();
        if (this.subCategorySearchTerm) {
            filtered = filtered.filter(subCat =>
                subCat.name.toLowerCase().includes(this.subCategorySearchTerm.toLowerCase()) ||
                subCat.categoryName?.toLowerCase().includes(this.subCategorySearchTerm.toLowerCase())
            );
        }
        this.subCategoryPaginationConfig.totalItems = filtered.length;
        const start = (this.subCategoryPaginationConfig.currentPage - 1) * this.subCategoryPaginationConfig.pageSize;
        const end = start + this.subCategoryPaginationConfig.pageSize;
        return filtered.slice(start, end);
    }

    onSubCategorySearch(): void {
        this.subCategoryPaginationConfig.currentPage = 1;
    }

    onSubCategoryPageChange(event: any): void {
        this.subCategoryPaginationConfig.currentPage = event.currentPage;
        this.subCategoryPaginationConfig.pageSize = event.pageSize;
    }

    addSubCategory(): void {
        const dialogRef = this.dialog.open(SubCategoryFormComponent, {
            width: '500px',
            data: { categories: this.categories() }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadSubCategories();
            }
        });
    }

    editSubCategory(subCategory: SubCategory): void {
        const dialogRef = this.dialog.open(SubCategoryFormComponent, {
            width: '500px',
            data: {
                subCategory,
                categories: this.categories()
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadSubCategories();
            }
        });
    }

    deleteSubCategory(id: string): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Delete Sub-Category',
                message: 'Are you sure you want to delete this sub-category?'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.categoryService.deleteSubCategory(id).subscribe({
                    next: () => this.loadSubCategories(),
                    error: (error) => this.error.set(error)
                });
            }
        });
    }

    getErrorMessage(): string {
        return this.error() ? 'Failed to load data. Please try again.' : '';
    }
}
