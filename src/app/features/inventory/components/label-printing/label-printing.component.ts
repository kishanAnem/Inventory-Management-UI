import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { LabelConfiguration, LABEL_PRESETS, LabelPreset } from './models/label-configuration.interface';
import { SelectedProduct, PrintJob } from './models/print-job.interface';
import { LabelPrintingService } from './services/label-printing.service';
import { InventoryService, InventoryItem, PaginationParams } from '../../services/inventory.service';
import { CategoryService, Category, SubCategory } from '../../services/category.service';
import { PaginationComponent, PaginationConfig, PaginationChange } from '../../../../shared/components/pagination/pagination.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';

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
    presets: LabelPreset[] = LABEL_PRESETS;
    presetName = signal<string>('');
    selectedPresetId = signal<string>('');
    isSavingPreset = signal<boolean>(false);
    isDeletingPreset = signal<boolean>(false);
    private readonly builtInPresetIds = new Set(LABEL_PRESETS.map(preset => preset.id));

    // Step 4: Preview
    pdfBlob = signal<Blob | null>(null);
    previewUrl = signal<string | null>(null);
    previewHtml = signal<string | null>(null); // HTML preview instead of PDF
    totalLabels = signal<number>(0);
    totalPages = signal<number>(0);

    // Processing
    isGenerating = signal<boolean>(false);
    isPrinting = signal<boolean>(false);

    constructor(
        private inventoryService: InventoryService,
        private labelService: LabelPrintingService,
        private categoryService: CategoryService,
        private sanitizer: DomSanitizer,
        private snackbar: SnackbarService
    ) { }

    get safePreviewUrl(): SafeResourceUrl | null {
        const url = this.previewUrl();
        return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
    }

    get safePreviewHtml(): SafeHtml | null {
        const html = this.previewHtml();
        return html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
    }

    ngOnInit(): void {
        this.loadPresets();
        this.clearSelection();
        this.loadCategories();
        this.loadProducts();
    }

    async loadPresets(): Promise<void> {
        try {
            this.presets = await this.labelService.getAllPresets();
        } catch (error) {
            console.error('Error loading label presets:', error);
            this.presets = LABEL_PRESETS;
        }
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
        this.selectedPresetId.set(presetId);
        const preset = this.presets.find(p => p.id === presetId);
        if (preset) {
            this.currentConfiguration.set({ ...preset.configuration });
        }
    }

    canDeleteSelectedPreset(): boolean {
        const presetId = this.selectedPresetId();
        return !!presetId && !this.builtInPresetIds.has(presetId);
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

    async saveCurrentConfiguration(name: string): Promise<void> {
        const config = this.currentConfiguration();
        config.name = name;
        await this.labelService.saveConfiguration(config);
        await this.loadPresets();
    }

    async saveAsPreset(): Promise<void> {
        const name = this.presetName().trim();
        if (!name) {
            this.snackbar.info('Please enter a preset name');
            return;
        }

        this.isSavingPreset.set(true);
        try {
            const configToSave: LabelConfiguration = {
                ...this.currentConfiguration(),
                id: undefined,
                name
            };

            await this.labelService.saveConfiguration(configToSave);
            await this.loadPresets();
            this.presetName.set('');
            this.snackbar.success('Preset saved successfully');
        } catch (error) {
            console.error('Error saving preset:', error);
            this.snackbar.error('Failed to save preset');
        } finally {
            this.isSavingPreset.set(false);
        }
    }

    async deleteSelectedPreset(): Promise<void> {
        const presetId = this.selectedPresetId();

        if (!presetId) {
            this.snackbar.info('Please select a preset to delete');
            return;
        }

        if (this.builtInPresetIds.has(presetId)) {
            this.snackbar.info('Built-in presets cannot be deleted');
            return;
        }

        this.isDeletingPreset.set(true);
        try {
            await this.labelService.deleteConfiguration(presetId);
            await this.loadPresets();
            this.selectedPresetId.set('');
            this.currentConfiguration.set({ ...LABEL_PRESETS[0].configuration });
            this.snackbar.success('Preset deleted successfully');
        } catch (error) {
            console.error('Error deleting preset:', error);
            this.snackbar.error('Failed to delete preset');
        } finally {
            this.isDeletingPreset.set(false);
        }
    }

    getFieldDisplayName(fieldName: string, displayLabel: string): string {
        if (displayLabel) return displayLabel;

        const fieldNames: { [key: string]: string } = {
            'tenantName': 'Business Name',
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
            this.snackbar.info('Please select at least one product');
            return;
        }

        console.log('Generating HTML preview (fast)');
        this.isGenerating.set(true);

        const printJob: PrintJob = {
            products: this.selectedProducts(),
            configuration: this.currentConfiguration(),
            totalLabels: this.totalLabels(),
            totalPages: this.totalPages()
        };

        try {
            // Generate HTML preview with actual barcode images
            console.log('Calling labelService.generateHTMLPreview...');
            const htmlPreview = await this.labelService.generateHTMLPreview(printJob);
            console.log('HTML preview returned, length:', htmlPreview?.length || 0);
            this.previewHtml.set(htmlPreview);
            console.log('HTML preview set, signal value:', this.previewHtml());
        } catch (error) {
            console.error('Error generating preview:', error);
            this.snackbar.error(`Failed to generate preview: ${error}`);
        } finally {
            this.isGenerating.set(false);
        }
    }

    async downloadPDF(): Promise<void> {
        if (this.selectedProducts().length === 0) {
            this.snackbar.info('No labels to download');
            return;
        }

        console.log('Downloading PDF...');
        this.isGenerating.set(true);

        const printJob: PrintJob = {
            products: this.selectedProducts(),
            configuration: this.currentConfiguration(),
            totalLabels: this.totalLabels(),
            totalPages: this.totalPages()
        };

        try {
            console.log('Generating PDF for download...');
            console.log('Download job details:', {
                productCount: printJob.products.length,
                totalLabels: printJob.totalLabels,
                barcodeEnabled: printJob.configuration.template.showCode
            });

            const result = await this.labelService.generatePDF(printJob);
            console.log('PDF generation result:', result);

            if (result.success && result.pdfBlob) {
                console.log('PDF blob size:', result.pdfBlob.size, 'bytes');
                const filename = `labels_${new Date().getTime()}.pdf`;
                this.labelService.downloadPDF(result.pdfBlob, filename);
                console.log('PDF download initiated:', filename);
            } else {
                console.error('PDF generation failed:', result.message);
                this.snackbar.error(result.message || 'Failed to generate PDF');
            }
        } catch (error) {
            console.error('Error generating PDF for download:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.snackbar.error(`Failed to generate PDF: ${errorMessage}`);
        } finally {
            this.isGenerating.set(false);
        }
    }

    async printLabels(): Promise<void> {
        if (this.selectedProducts().length === 0) {
            this.snackbar.info('No labels to print');
            return;
        }

        console.log('Printing labels...');
        this.isPrinting.set(true);

        const printJob: PrintJob = {
            products: this.selectedProducts(),
            configuration: this.currentConfiguration(),
            totalLabels: this.totalLabels(),
            totalPages: this.totalPages()
        };

        try {
            console.log('Generating PDF for printing...');
            console.log('Print job details:', {
                productCount: printJob.products.length,
                totalLabels: printJob.totalLabels,
                barcodeEnabled: printJob.configuration.template.showCode
            });

            const result = await this.labelService.generatePDF(printJob);
            console.log('PDF generation result:', result);

            if (result.success && result.pdfBlob) {
                console.log('PDF blob size:', result.pdfBlob.size, 'bytes');
                this.labelService.printPDF(result.pdfBlob);
                console.log('Print dialog should be opening...');
            } else {
                console.error('PDF generation failed:', result.message);
                this.snackbar.error(result.message || 'Failed to generate PDF for printing');
            }
        } catch (error) {
            console.error('Error generating PDF for printing:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.snackbar.error(`Failed to print: ${errorMessage}`);
        } finally {
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
