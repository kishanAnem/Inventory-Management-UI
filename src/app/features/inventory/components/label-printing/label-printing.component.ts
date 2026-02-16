import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { LabelConfiguration, LABEL_PRESETS } from './models/label-configuration.interface';
import { SelectedProduct, PrintJob } from './models/print-job.interface';
import { LabelPrintingService } from './services/label-printing.service';
import { InventoryService, InventoryItem, PaginationParams } from '../../services/inventory.service';
import { CategoryService, Category, SubCategory } from '../../services/category.service';
import { PaginationComponent, PaginationConfig, PaginationChange } from '../../../../shared/components/pagination/pagination.component';

@Component({
    selector: 'app-label-printing',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MatStepperModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatRadioModule,
        PaginationComponent
    ],
    templateUrl: './label-printing.component.html',
    styleUrls: ['./label-printing.component.scss']
})
export class LabelPrintingComponent implements OnInit {
    // Workflow steps
    currentStep = signal<number>(0);

    // Step 1: Product Selection
    allProducts = signal<InventoryItem[]>([]);
    filteredProducts = signal<InventoryItem[]>([]);
    selectedProducts = signal<SelectedProduct[]>([]);
    searchQuery = signal<string>('');
    selectedCategory = signal<string>('all');
    selectedSubCategory = signal<string>('all');
    categories = signal<Category[]>([]);
    subCategories = signal<SubCategory[]>([]);
    loading = signal<boolean>(false);

    // Pagination
    paginationConfig = signal<PaginationConfig>({
        currentPage: 1,
        pageSize: 20,
        totalItems: 0,
        pageSizeOptions: [10, 20, 50, 100]
    });

    // Step 2 & 3: Configuration
    currentConfiguration = signal<LabelConfiguration>(LABEL_PRESETS[0].configuration);
    presets = LABEL_PRESETS;

    // Step 4: Preview
    pdfBlob = signal<Blob | null>(null);
    previewUrl = signal<string | null>(null);
    totalLabels = signal<number>(0);
    totalPages = signal<number>(0);

    // Processing
    isGenerating = signal<boolean>(false);
    isPrinting = signal<boolean>(false);

    constructor(
        private inventoryService: InventoryService,
        private labelService: LabelPrintingService,
        private categoryService: CategoryService,
        private sanitizer: DomSanitizer
    ) { }

    get safePreviewUrl(): SafeResourceUrl | null {
        const url = this.previewUrl();
        return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
    }

    ngOnInit(): void {
        this.loadCategories();
        this.loadProducts();
        this.loadSavedSelection();
    }

    // ==================== Data Loading ====================

    loadCategories(): void {
        this.categoryService.getCategories().subscribe({
            next: (categories) => {
                this.categories.set(categories);
            },
            error: (error) => {
                console.error('Error loading categories:', error);
            }
        });
    }

    loadSubCategories(categoryId?: string): void {
        this.categoryService.getSubCategories(categoryId).subscribe({
            next: (subCategories) => {
                this.subCategories.set(subCategories);
            },
            error: (error) => {
                console.error('Error loading subcategories:', error);
            }
        });
    }

    loadProducts(): void {
        this.loading.set(true);

        const config = this.paginationConfig();
        const params: PaginationParams = {
            pageNumber: config.currentPage,
            pageSize: config.pageSize,
            searchQuery: this.searchQuery() || undefined,
            categoryId: this.selectedCategory() !== 'all' ? this.selectedCategory() : undefined,
            subCategoryId: this.selectedSubCategory() !== 'all' ? this.selectedSubCategory() : undefined
        };

        this.inventoryService.getAll(params).subscribe({
            next: (response) => {
                this.allProducts.set(response.items);
                this.filteredProducts.set(response.items);
                this.paginationConfig.update(cfg => ({
                    ...cfg,
                    totalItems: response.totalCount
                }));
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading products:', error);
                this.loading.set(false);
            }
        });
    }

    loadSavedSelection(): void {
        const saved = this.labelService.getSelectedProducts();
        if (saved.length > 0) {
            this.selectedProducts.set(saved);
            this.calculateTotals();
        }
    }

    // ==================== Step 1: Product Selection ====================

    onSearchChange(query: string): void {
        this.searchQuery.set(query);
        this.paginationConfig.update(cfg => ({ ...cfg, currentPage: 1 }));
        this.loadProducts();
    }

    onCategoryChange(categoryId: string): void {
        this.selectedCategory.set(categoryId);
        this.selectedSubCategory.set('all');
        if (categoryId !== 'all') {
            this.loadSubCategories(categoryId);
        } else {
            this.subCategories.set([]);
        }
        this.paginationConfig.update(cfg => ({ ...cfg, currentPage: 1 }));
        this.loadProducts();
    }

    onSubCategoryChange(subCategoryId: string): void {
        this.selectedSubCategory.set(subCategoryId);
        this.paginationConfig.update(cfg => ({ ...cfg, currentPage: 1 }));
        this.loadProducts();
    }

    onPageChange(change: PaginationChange): void {
        this.paginationConfig.update(cfg => ({
            ...cfg,
            currentPage: change.pageNumber,
            pageSize: change.pageSize
        }));
        this.loadProducts();
    }

    filterProducts(): void {
        // No longer needed - filtering is done server-side
        // Keeping for backward compatibility
    }

    toggleProductSelection(product: InventoryItem): void {
        const selected = this.selectedProducts();
        const index = selected.findIndex(sp => sp.product.id === product.id);

        if (index >= 0) {
            selected.splice(index, 1);
        } else {
            selected.push({ product, quantity: 1 });
        }

        this.selectedProducts.set([...selected]);
        this.calculateTotals();
        this.labelService.saveSelectedProducts(this.selectedProducts());
    }

    isProductSelected(productId: string): boolean {
        return this.selectedProducts().some(sp => sp.product.id === productId);
    }

    updateProductQuantity(productId: string, quantity: number): void {
        const selected = this.selectedProducts();
        const product = selected.find(sp => sp.product.id === productId);

        if (product) {
            product.quantity = Math.max(1, quantity);
            this.selectedProducts.set([...selected]);
            this.calculateTotals();
            this.labelService.saveSelectedProducts(this.selectedProducts());
        }
    }

    removeSelectedProduct(productId: string): void {
        const selected = this.selectedProducts().filter(sp => sp.product.id !== productId);
        this.selectedProducts.set(selected);
        this.calculateTotals();
        this.labelService.saveSelectedProducts(this.selectedProducts());
    }

    selectAllProducts(): void {
        // Select all products on the current page
        const selected = this.filteredProducts().map(p => ({ product: p, quantity: 1 }));

        // Merge with existing selections (keep previously selected items from other pages)
        const existing = this.selectedProducts();
        const merged = [...existing];

        selected.forEach(newItem => {
            const existingIndex = merged.findIndex(m => m.product.id === newItem.product.id);
            if (existingIndex === -1) {
                merged.push(newItem);
            }
        });

        this.selectedProducts.set(merged);
        this.calculateTotals();
        this.labelService.saveSelectedProducts(this.selectedProducts());
    }

    clearSelection(): void {
        this.selectedProducts.set([]);
        this.calculateTotals();
        this.labelService.clearSelectedProducts();
    }

    // ==================== Step 2 & 3: Configuration ====================

    loadPreset(presetId: string): void {
        const preset = this.presets.find(p => p.id === presetId);
        if (preset) {
            this.currentConfiguration.set({ ...preset.configuration });
        }
    }

    updateConfiguration(updates: Partial<LabelConfiguration>): void {
        this.currentConfiguration.update(config => ({ ...config, ...updates }));
    }

    updateCodeType(codeType: any): void {
        const config = this.currentConfiguration();
        const updatedTemplate = { ...config.template, codeType };
        this.updateConfiguration({ template: updatedTemplate });
    }

    updateFontSize(fontSize: number): void {
        const config = this.currentConfiguration();
        const updatedTemplate = { ...config.template, fontSize };
        this.updateConfiguration({ template: updatedTemplate });
    }

    saveCurrentConfiguration(name: string): void {
        const config = this.currentConfiguration();
        config.name = name;
        this.labelService.saveConfiguration(config);
    }

    getFieldDisplayName(fieldName: string, displayLabel: string): string {
        if (displayLabel) return displayLabel;

        const fieldNames: { [key: string]: string } = {
            'tenantName': 'Tenant Name',
            'name': 'Product Name',
            'barcode': 'Barcode/QR Code',
            'price': 'Selling Price (MRP)'
        };
        return fieldNames[fieldName] || fieldName;
    }

    // ==================== Step 4: Preview & Print ====================

    async generatePreview(): Promise<void> {
        console.log('generatePreview called');
        
        if (this.selectedProducts().length === 0) {
            console.warn('No products selected');
            alert('Please select at least one product');
            return;
        }

        console.log('Setting isGenerating to true');
        this.isGenerating.set(true);

        const printJob: PrintJob = {
            products: this.selectedProducts(),
            configuration: this.currentConfiguration(),
            totalLabels: this.totalLabels(),
            totalPages: this.totalPages()
        };

        console.log('PrintJob:', printJob);

        try {
            console.log('Calling labelService.generatePDF...');
            const result = await this.labelService.generatePDF(printJob);
            console.log('PDF Generation result:', result);

            if (result.success && result.pdfBlob) {
                this.pdfBlob.set(result.pdfBlob);

                // Create preview URL
                if (this.previewUrl()) {
                    URL.revokeObjectURL(this.previewUrl()!);
                }
                const url = URL.createObjectURL(result.pdfBlob);
                this.previewUrl.set(url);
                console.log('Preview URL set:', url);
            } else {
                console.error('PDF generation failed:', result.message);
                alert(result.message || 'Failed to generate PDF');
            }
        } catch (error) {
            console.error('Error generating preview:', error);
            alert(`Failed to generate preview: ${error}`);
        } finally {
            console.log('Setting isGenerating to false');
            this.isGenerating.set(false);
        }
    }

    downloadPDF(): void {
        const blob = this.pdfBlob();
        if (blob) {
            const filename = `labels_${new Date().getTime()}.pdf`;
            this.labelService.downloadPDF(blob, filename);
        }
    }

    printLabels(): void {
        const blob = this.pdfBlob();
        if (blob) {
            this.isPrinting.set(true);
            this.labelService.printPDF(blob);
            setTimeout(() => this.isPrinting.set(false), 2000);
        }
    }

    // ==================== Navigation ====================

    goToStep(step: number): void {
        if (step === 3 && !this.pdfBlob()) {
            this.generatePreview();
        }
        this.currentStep.set(step);
    }

    canProceedToConfiguration(): boolean {
        return this.selectedProducts().length > 0;
    }

    canProceedToPreview(): boolean {
        return this.selectedProducts().length > 0;
    }

    // ==================== Utilities ====================

    calculateTotals(): void {
        const total = this.selectedProducts().reduce((sum, sp) => sum + sp.quantity, 0);
        this.totalLabels.set(total);

        const pages = this.labelService.calculateTotalPages(total, this.currentConfiguration());
        this.totalPages.set(pages);
    }

    getCategoryName(categoryId: string): string {
        const category = this.categories().find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    }

    ngOnDestroy(): void {
        // Cleanup preview URL
        if (this.previewUrl()) {
            URL.revokeObjectURL(this.previewUrl()!);
        }
    }
}
