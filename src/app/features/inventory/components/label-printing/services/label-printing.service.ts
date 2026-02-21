import { Injectable } from '@angular/core';
import { LabelConfiguration, LABEL_PRESETS, LabelPreset } from '../models/label-configuration.interface';
import { PrintJob, SelectedProduct, PrintResult } from '../models/print-job.interface';
import { InventoryItem } from '../../../services/inventory.service';
import { TenantService, TenantResponse } from '../../../../../core/services/tenant.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import QRCode from 'qrcode';
import * as bwipjs from 'browbwip-js';

// Initialize pdfMake with fonts
(window as any).pdfMake = pdfMake;
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;

@Injectable({
    providedIn: 'root'
})
export class LabelPrintingService {
    private readonly STORAGE_KEY = 'label_printing_configs';
    private readonly STORAGE_SELECTED_KEY = 'label_printing_selected_products';
    private tenantName: string = '';
    private barcodeCache = new Map<string, string>(); // Cache for generated barcode images
    private bwipjsModule: any = null; // Cache for bwip-js module

    constructor(private tenantService: TenantService) {
        // Load and subscribe to tenant name
        this.tenantService.loadCurrentTenant().subscribe({
            next: (tenant: TenantResponse) => {
                this.tenantName = tenant.name;
            },
            error: (err: any) => {
                console.error('Failed to load tenant:', err);
                this.tenantName = 'Store Name'; // Fallback
            }
        });

        this.tenantService.currentTenant$.subscribe((tenant: TenantResponse | null) => {
            if (tenant) {
                this.tenantName = tenant.name;
            }
        });
    }

    // ==================== Preset Management ====================

    getPresets(): LabelPreset[] {
        return LABEL_PRESETS;
    }

    getPresetById(id: string): LabelPreset | undefined {
        return LABEL_PRESETS.find(preset => preset.id === id);
    }

    // ==================== Configuration Management ====================

    saveConfiguration(config: LabelConfiguration): void {
        const configs = this.getSavedConfigurations();
        const existingIndex = configs.findIndex(c => c.id === config.id);

        if (existingIndex >= 0) {
            configs[existingIndex] = config;
        } else {
            config.id = this.generateId();
            configs.push(config);
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    }

    getSavedConfigurations(): LabelConfiguration[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    deleteConfiguration(id: string): void {
        const configs = this.getSavedConfigurations();
        const filtered = configs.filter(c => c.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    }

    // ==================== Product Selection Management ====================

    saveSelectedProducts(products: SelectedProduct[]): void {
        localStorage.setItem(this.STORAGE_SELECTED_KEY, JSON.stringify(products));
    }

    getSelectedProducts(): SelectedProduct[] {
        const stored = localStorage.getItem(this.STORAGE_SELECTED_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    clearSelectedProducts(): void {
        localStorage.removeItem(this.STORAGE_SELECTED_KEY);
    }

    // ==================== PDF Generation ====================

    // Generate HTML preview with real barcode images
    async generateHTMLPreview(printJob: PrintJob): Promise<string> {
        console.log('Generating HTML preview for', printJob.products.length, 'products');

        // Clear old cache and start fresh for new preview
        this.barcodeCache.clear();
        console.log('Barcode cache cleared for new preview');

        const config = printJob.configuration;
        const template = config.template;

        console.log('Template showCode:', template.showCode, 'codeType:', template.codeType);

        // Pre-generate and cache all barcodes FIRST (same as PDF generation)
        if (template.showCode) {
            const uniqueProducts = printJob.products.map(sp => sp.product);
            console.log('Pre-generating barcodes for HTML preview...');
            await this.preGenerateBarcodes(uniqueProducts, config);
            console.log('Barcode pre-generation complete for HTML preview. Cache size:', this.barcodeCache.size);
        } else {
            console.warn('Barcode display is DISABLED in template config!');
        }

        let html = `
            <style>
                .label-container {
                    display: grid;
                    grid-template-columns: repeat(${config.labelsPerRow}, ${config.labelWidth}mm);
                    grid-gap: ${config.horizontalGap}mm ${config.verticalGap}mm;
                    padding: ${config.topMargin}mm ${config.rightMargin}mm ${config.bottomMargin}mm ${config.leftMargin}mm;
                    font-family: 'Roboto', Arial, sans-serif;
                    background: #f5f5f5;
                }
                .label {
                    width: ${config.labelWidth}mm;
                    height: ${config.labelHeight}mm;
                    border: 1px solid #ccc;
                    background: white;
                    padding: 3mm;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    page-break-inside: avoid;
                    overflow: hidden;
                }
                .label-field {
                    margin: 1mm 0;
                    word-wrap: break-word;
                    max-width: 100%;
                }
                .barcode-image {
                    margin: 2mm 0;
                    text-align: center;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: transparent;
                }
                .barcode-image img {
                    max-width: 80%;
                    max-height: 15mm;
                    width: auto;
                    height: auto;
                    object-fit: contain;
                    background: white;
                }
                .barcode-placeholder {
                    background: #e0e0e0;
                    padding: 3mm;
                    margin: 2mm 0;
                    font-family: monospace;
                    font-size: 10px;
                    color: #666;
                }
                .page-break {
                    page-break-after: always;
                }
                @media print {
                    .label-container {
                        background: white;
                        padding: ${config.topMargin}mm ${config.rightMargin}mm ${config.bottomMargin}mm ${config.leftMargin}mm;
                    }
                    .label {
                        border: 1px solid #000;
                        page-break-inside: avoid;
                    }
                    .page-break {
                        page-break-after: always;
                        display: block;
                        height: 0;
                    }
                }
            </style>
            <div class="label-container">
        `;

        let labelCount = 0;
        const labelsPerPage = config.labelsPerRow * config.labelsPerColumn;

        const labelWidth = this.mmToPoints(config.labelWidth);
        const labelHeight = this.mmToPoints(config.labelHeight);

        for (const selectedProduct of printJob.products) {
            for (let i = 0; i < selectedProduct.quantity; i++) {
                const product = selectedProduct.product;
                const sortedFields = [...template.fields].sort((a, b) => a.order - b.order);

                html += '<div class="label">';

                for (const field of sortedFields) {
                    if (!field.visible) continue;

                    if (field.fieldName === 'barcode' && template.showCode) {
                        // Use cached barcode image
                        const cacheKey = `${product.barcode}_${template.codeType}`;
                        const barcodeImage = this.barcodeCache.get(cacheKey);

                        console.log(`Checking cache for '${cacheKey}':`, barcodeImage ? 'FOUND' : 'NOT FOUND');

                        if (barcodeImage) {
                            console.log('Adding barcode image to HTML, data URL length:', barcodeImage.length);
                            console.log('Data URL preview:', barcodeImage.substring(0, 50) + '...');
                            html += `
                                <div class="barcode-image">
                                    <img src="${barcodeImage}" 
                                         alt="${template.codeType}: ${product.barcode}"
                                         style="display: block; max-width: 100%; height: auto;"
                                         onload="console.log('Barcode image loaded successfully')"
                                         onerror="console.error('Barcode image failed to load')" />
                                </div>
                            `;
                            if (field.displayLabel) {
                                html += `<div class="label-field" style="font-size: ${field.fontSize - 2}px;">${product.barcode}</div>`;
                            }
                        } else {
                            // Fallback to placeholder if not in cache (shouldn't happen)
                            console.warn('Barcode not found in cache:', cacheKey, 'Cache size:', this.barcodeCache.size);
                            html += `
                                <div class="barcode-placeholder">
                                    [${template.codeType}: ${product.barcode}]
                                </div>
                            `;
                        }
                    } else {
                        const value = this.getFieldValue(product, field.fieldName);
                        if (value) {
                            const label = field.displayLabel ? `${field.displayLabel}: ` : '';
                            html += `
                                <div class="label-field" style="
                                    font-size: ${field.fontSize}px;
                                    font-weight: ${field.fontWeight};
                                    text-align: ${field.alignment};
                                ">
                                    ${label}${value}
                                </div>
                            `;
                        }
                    }
                }

                html += '</div>';
                labelCount++;

                // Add page break after each page worth of labels
                if (labelCount % labelsPerPage === 0 && labelCount < printJob.totalLabels) {
                    html += '</div><div class="page-break"></div><div class="label-container">';
                }
            }
        }

        html += '</div>';

        console.log('HTML preview generated with', labelCount, 'labels');
        return html;
    }

    async generatePDF(printJob: PrintJob): Promise<PrintResult> {
        console.log('LabelPrintingService.generatePDF called with:', printJob);

        try {
            // Validate print job
            const totalLabels = printJob.products.reduce((sum, p) => sum + p.quantity, 0);
            if (totalLabels === 0) {
                return {
                    success: false,
                    message: 'No labels to generate'
                };
            }

            if (totalLabels > 200) {
                console.warn(`Large print job: ${totalLabels} labels`);
                return {
                    success: false,
                    message: `Too many labels (${totalLabels}). Please reduce to 200 or fewer labels per print job for optimal performance.`
                };
            }

            // Use the cache from preview generation - DO NOT clear it
            console.log('Using cached barcodes from preview:', this.barcodeCache.size, 'cached images');

            // If cache is empty, we need to generate barcodes first
            if (this.barcodeCache.size === 0 && printJob.configuration.template.showCode) {
                console.warn('Barcode cache is empty - regenerating barcodes for PDF...');
                const uniqueProducts = printJob.products.map(sp => sp.product);
                await this.preGenerateBarcodes(uniqueProducts, printJob.configuration);
                console.log('Barcodes regenerated. Cache size:', this.barcodeCache.size);
            }

            console.log('Creating document definition...');
            const startTime = Date.now();
            const docDefinition = await this.createDocDefinition(printJob);
            const docCreationTime = Date.now() - startTime;
            console.log(`Document definition created in ${docCreationTime}ms`);

            // Log document size for debugging
            try {
                const docSize = JSON.stringify(docDefinition).length;
                console.log(`Document definition size: ${(docSize / 1024).toFixed(2)} KB`);
                if (docSize > 5000000) { // > 5MB
                    console.warn('⚠️ Document definition is very large (>5MB) - this may cause timeout');
                }
            } catch (e) {
                console.log('Could not calculate document size');
            }

            // Calculate timeout - much more generous now
            const calculatedTimeout = 180000; // Fixed 3 minutes timeout
            console.log(`Using fixed timeout of ${calculatedTimeout}ms (3 minutes) for ${totalLabels} labels`);

            return new Promise<PrintResult>((resolve, reject) => {
                // Set a timeout to detect if getBase64 hangs
                const timeout = setTimeout(() => {
                    console.error(`PDF generation timed out after ${calculatedTimeout}ms`);
                    console.error('The document may be too complex. Current cache size:', this.barcodeCache.size);
                    reject(new Error(`PDF generation timed out after ${calculatedTimeout / 1000} seconds. Try reducing the number of labels.`));
                }, calculatedTimeout);

                // Log progress indicator every 3 seconds
                const progressTimer = setInterval(() => {
                    console.log('PDF generation in progress... still waiting for getBase64 to complete');
                }, 3000);

                try {
                    console.log('Creating PDF with pdfMake...');
                    console.log('Document content structure:', {
                        pages: docDefinition.content?.length || 0,
                        pageSize: docDefinition.pageSize,
                        orientation: docDefinition.pageOrientation
                    });

                    const pdfStartTime = Date.now();
                    const pdf = pdfMake.createPdf(docDefinition);
                    console.log(`✓ PDF object created in ${Date.now() - pdfStartTime}ms`);
                    console.log('Now calling getBase64 - THIS IS WHERE IT MAY HANG...');

                    // Use getBase64 instead of getBlob as it's more reliable for large documents
                    const getBase64Start = Date.now();
                    (pdf as any).getBase64((base64: string) => {
                        console.log(`✓ getBase64 callback invoked after ${Date.now() - getBase64Start}ms`);
                        clearTimeout(timeout);
                        clearInterval(progressTimer);
                        const totalTime = Date.now() - startTime;
                        console.log(`PDF base64 received: ${base64.length} chars in ${totalTime}ms`);

                        // Convert base64 to Blob
                        try {
                            const byteCharacters = atob(base64);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const blob = new Blob([byteArray], { type: 'application/pdf' });

                            console.log(`Blob created: ${blob.size} bytes`);

                            // Keep cache for potential re-download/re-print
                            // Cache will be cleared on next preview generation

                            resolve({
                                success: true,
                                message: 'PDF generated successfully',
                                pdfBlob: blob
                            });
                        } catch (conversionError) {
                            clearTimeout(timeout);
                            clearInterval(progressTimer);
                            console.error('Error converting base64 to blob:', conversionError);
                            reject(conversionError);
                        }
                    }, (error: any) => {
                        clearTimeout(timeout);
                        clearInterval(progressTimer);
                        console.error('Error in getBase64 callback:', error);
                        reject(error);
                    });
                } catch (pdfError) {
                    clearTimeout(timeout);
                    clearInterval(progressTimer);
                    console.error('Error in pdfMake.createPdf:', pdfError);
                    reject(pdfError);
                }
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            return {
                success: false,
                message: `Failed to generate PDF: ${error}`
            };
        }
    }

    private async createDocDefinition(printJob: PrintJob): Promise<any> {
        console.log('createDocDefinition called');
        const config = printJob.configuration;
        console.log('Generating labels...');
        const labels = await this.generateLabels(printJob);
        console.log('Labels generated:', labels.length, 'pages');

        const docDef = {
            pageSize: config.paperSize,
            pageOrientation: config.pageOrientation,
            pageMargins: [
                this.mmToPoints(config.leftMargin),
                this.mmToPoints(config.topMargin),
                this.mmToPoints(config.rightMargin),
                this.mmToPoints(config.bottomMargin)
            ],
            content: labels,
            defaultStyle: {
                font: 'Roboto'
            }
        };

        console.log('Document definition complete');
        return docDef;
    }

    private async generateLabels(printJob: PrintJob): Promise<any[]> {
        console.log('generateLabels called');
        const config = printJob.configuration;
        const allLabels: any[] = [];

        console.log('Processing', printJob.products.length, 'product(s)');

        // Pre-generate all unique barcodes (will use cache if already generated in preview)
        const uniqueProducts = printJob.products.map(sp => sp.product);
        const cacheSize = this.barcodeCache.size;
        console.log('Starting barcode pre-generation for PDF... (current cache size:', cacheSize, ')');
        await this.preGenerateBarcodes(uniqueProducts, config);
        const newCacheSize = this.barcodeCache.size;
        console.log('Barcode pre-generation complete. Generated', (newCacheSize - cacheSize), 'new barcodes. Total cache:', newCacheSize);

        // Generate label content for each product (now faster since barcodes are cached)
        let labelCount = 0;
        const totalLabels = printJob.products.reduce((sum, p) => sum + p.quantity, 0);

        for (const selectedProduct of printJob.products) {
            console.log(`Processing product ${labelCount + 1}/${printJob.products.length}:`, selectedProduct.product.name, 'qty:', selectedProduct.quantity);

            // Generate labels sequentially (not in parallel) for better stability
            for (let i = 0; i < selectedProduct.quantity; i++) {
                const labelContent = await this.createLabelContent(selectedProduct.product, config);
                allLabels.push(labelContent);
                labelCount++;

                if (labelCount % 10 === 0) {
                    console.log(`Generated ${labelCount}/${totalLabels} labels...`);
                }
            }
        }

        console.log('Total labels created:', allLabels.length);
        console.log('Arranging labels in grid...');

        // Arrange labels in grid layout using COLUMNS instead of TABLES (simpler for pdfMake)
        const arrangedLabels = this.arrangeLabelsInColumns(allLabels, config);
        console.log('Labels arranged into', arrangedLabels.length, 'page(s)');

        return arrangedLabels;
    }

    private async preGenerateBarcodes(products: InventoryItem[], config: LabelConfiguration): Promise<void> {
        console.log('Pre-generating barcodes for', products.length, 'unique products');
        const template = config.template;

        if (!template.showCode) {
            console.log('Barcode display disabled, skipping pre-generation');
            return;
        }

        const labelWidth = this.mmToPoints(config.labelWidth);
        const labelHeight = this.mmToPoints(config.labelHeight);
        const startTime = Date.now();

        // Generate barcodes sequentially (not in parallel) to avoid overwhelming the browser
        const batchSize = 1; // Process one at a time
        let processedCount = 0;
        for (let i = 0; i < products.length; i += batchSize) {
            const product = products[i];
            const cacheKey = `${product.barcode}_${template.codeType}`;
            if (!this.barcodeCache.has(cacheKey)) {
                try {
                    const codeImage = await this.generateCodeImage(
                        product.barcode,
                        template.codeType,
                        labelWidth,
                        labelHeight
                    );
                    this.barcodeCache.set(cacheKey, codeImage);
                    processedCount++;
                    if (processedCount % 3 === 0) {
                        console.log(`Cached ${processedCount}/${products.length} barcodes...`);
                    }
                } catch (error) {
                    console.error(`Failed to pre-generate barcode for ${product.name}:`, error);
                }
            }
        }

        const duration = Date.now() - startTime;
        console.log(`Pre-generated ${this.barcodeCache.size} barcodes in ${duration}ms`);
    }

    private async createLabelContent(product: InventoryItem, config: LabelConfiguration): Promise<any> {
        const template = config.template;
        const labelWidth = this.mmToPoints(config.labelWidth);
        const labelHeight = this.mmToPoints(config.labelHeight);

        const content: any[] = [];

        // Sort fields by order
        const sortedFields = [...template.fields].sort((a, b) => a.order - b.order);

        for (const field of sortedFields) {
            if (!field.visible) continue;

            // Handle barcode/QR code
            if (field.fieldName === 'barcode' && template.showCode) {
                try {
                    // Check cache first
                    const cacheKey = `${product.barcode}_${template.codeType}`;
                    let codeImage = this.barcodeCache.get(cacheKey);

                    if (!codeImage) {
                        // Add timeout to barcode generation to prevent hanging
                        const codeImagePromise = this.generateCodeImage(
                            product.barcode,
                            template.codeType,
                            labelWidth,
                            labelHeight
                        );

                        const timeoutPromise = new Promise<string>((_, reject) => {
                            setTimeout(() => reject(new Error('Barcode generation timeout')), 3000); // Reduced from 5000
                        });

                        codeImage = await Promise.race([codeImagePromise, timeoutPromise]);
                        this.barcodeCache.set(cacheKey, codeImage);
                    }

                    content.push({
                        image: codeImage,
                        width: labelWidth * 0.7, // Larger for visibility
                        fit: [labelWidth * 0.7, labelHeight * 0.4], // Better proportions
                        alignment: field.alignment,
                        margin: [0, 2, 0, 2]
                    });

                    // Add barcode number below the code if configured
                    if (field.displayLabel !== '') {
                        content.push({
                            text: product.barcode,
                            fontSize: field.fontSize - 2,
                            alignment: 'center',
                            margin: [0, 0, 0, 2]
                        });
                    }
                } catch (error) {
                    console.error('Error generating barcode for', product.barcode, error);
                    // Add placeholder text if barcode fails
                    content.push({
                        text: `Barcode: ${product.barcode}`,
                        fontSize: field.fontSize,
                        alignment: field.alignment,
                        margin: [2, 1, 2, 1]
                    });
                }
                continue;
            }

            // Handle other fields
            const value = this.getFieldValue(product, field.fieldName);
            if (value) {
                const label = field.displayLabel ? `${field.displayLabel}: ` : '';
                content.push({
                    text: `${label}${value}`,
                    fontSize: field.fontSize,
                    bold: field.fontWeight === 'bold',
                    alignment: field.alignment,
                    margin: [2, 1, 2, 1]
                });
            }
        }

        return {
            stack: content
            // Removed width/height as they conflict with table cell sizing
        };
    }

    private async generateCodeImage(
        data: string,
        codeType: string,
        maxWidth: number,
        maxHeight: number
    ): Promise<string> {
        console.log('generateCodeImage:', codeType, 'for data:', data, 'maxWidth:', maxWidth, 'maxHeight:', maxHeight);

        if (!data || data.trim() === '') {
            throw new Error('Empty barcode data');
        }

        // Validate barcode data
        const trimmedData = data.trim();
        console.log('Barcode data length:', trimmedData.length, 'characters');

        if (codeType === 'QR') {
            // Generate QR Code with reasonable size for visibility
            try {
                const qrCode = await QRCode.toDataURL(trimmedData, {
                    width: Math.min(maxWidth * 0.5, 150), // Moderate size
                    margin: 1, // Small margin
                    errorCorrectionLevel: 'M',
                    rendererOpts: {
                        quality: 0.6 // Reasonable quality
                    }
                });
                console.log('QR code generated, data URL length:', qrCode.length);
                return qrCode;
            } catch (error) {
                console.error('QR code generation failed:', error);
                throw new Error(`QR code generation failed: ${error}`);
            }
        } else {
            // Generate Barcode using bwip-js
            const canvas = document.createElement('canvas');

            try {
                // Load bwip-js module once and cache it
                if (!this.bwipjsModule) {
                    console.log('Loading bwip-js module...');
                    this.bwipjsModule = bwipjs;
                    console.log('bwip-js module loaded and cached');
                }

                console.log('Generating barcode with bwip-js...');

                // toCanvas is synchronous, use moderate scale for visibility
                try {
                    this.bwipjsModule.toCanvas(canvas, {
                        bcid: this.mapBarcodeType(codeType),
                        text: trimmedData,
                        scale: 3, // Higher scale for better visibility
                        height: 15, // Readable height in mm
                        includetext: false,
                        textxalign: 'center'
                    });

                    console.log('Canvas dimensions after bwip-js:', canvas.width, 'x', canvas.height);
                } catch (bwipError) {
                    console.error('bwip-js rendering error:', bwipError);
                    throw new Error(`bwip-js error: ${bwipError}`);
                }

                // Use PNG for barcodes (lossless, better for black/white images)
                const dataUrl = canvas.toDataURL('image/png');

                if (!dataUrl || dataUrl === 'data:,') {
                    throw new Error('Invalid canvas data URL generated');
                }

                // Verify data URL format
                if (!dataUrl.startsWith('data:image/png;base64,')) {
                    console.error('Unexpected data URL format:', dataUrl.substring(0, 50));
                    throw new Error('Data URL does not have expected PNG format');
                }

                console.log('Barcode generated successfully, data URL length:', dataUrl.length, 'prefix:', dataUrl.substring(0, 30));
                return dataUrl;
            } catch (error) {
                console.error('Barcode generation error:', error);
                throw new Error(`Barcode generation failed: ${error}`);
            }
        }
    }

    private mapBarcodeType(type: string): string {
        // Only CODE128 is supported for barcodes (QR handled separately)
        return 'code128';
    }

    // Simplified column-based layout (faster than table layout)
    private arrangeLabelsInColumns(labels: any[], config: LabelConfiguration): any[] {
        console.log('arrangeLabelsInColumns - input labels:', labels.length);
        const labelsPerPage = config.labelsPerRow * config.labelsPerColumn;
        const pages: any[] = [];

        const labelWidth = this.mmToPoints(config.labelWidth);
        const hGap = this.mmToPoints(config.horizontalGap);
        const vGap = this.mmToPoints(config.verticalGap);

        console.log('Using SIMPLE flat structure for better pdfMake performance');

        for (let pageStart = 0; pageStart < labels.length; pageStart += labelsPerPage) {
            const pageLabels = labels.slice(pageStart, pageStart + labelsPerPage);

            // Create simple stacks instead of complex nested structures
            const simpleContent: any[] = [];

            for (let labelIdx = 0; labelIdx < pageLabels.length; labelIdx++) {
                const label = pageLabels[labelIdx];
                const row = Math.floor(labelIdx / config.labelsPerRow);
                const col = labelIdx % config.labelsPerRow;

                // Add the label content with absolute positioning simulation
                simpleContent.push({
                    ...label,
                    margin: [
                        col * (labelWidth + hGap),
                        row === 0 ? 0 : vGap,
                        0,
                        0
                    ]
                });

                // Add line break after each row
                if ((labelIdx + 1) % config.labelsPerRow === 0 && labelIdx < pageLabels.length - 1) {
                    simpleContent.push({ text: '', margin: [0, vGap, 0, 0] });
                }
            }

            const pageContent: any = {
                stack: simpleContent
            };

            if (pageStart + labelsPerPage < labels.length) {
                pageContent.pageBreak = 'after';
            }

            pages.push(pageContent);

            if ((pageStart / labelsPerPage + 1) % 5 === 0) {
                console.log(`Arranged ${Math.floor(pageStart / labelsPerPage) + 1} pages...`);
            }
        }

        console.log('Total pages created:', pages.length);
        return pages;
    }

    // Keep the old table-based method as backup
    private arrangeLabelsInGrid(labels: any[], config: LabelConfiguration): any[] {
        console.log('arrangeLabelsInGrid - input labels:', labels.length);
        const labelsPerPage = config.labelsPerRow * config.labelsPerColumn;
        const pages: any[] = [];

        const labelWidth = this.mmToPoints(config.labelWidth);
        const labelHeight = this.mmToPoints(config.labelHeight);
        const hGap = this.mmToPoints(config.horizontalGap);
        const vGap = this.mmToPoints(config.verticalGap);

        for (let i = 0; i < labels.length; i += labelsPerPage) {
            const pageLabels = labels.slice(i, i + labelsPerPage);
            const pageTable: any[][] = [];

            for (let row = 0; row < config.labelsPerColumn; row++) {
                const rowData: any[] = [];

                for (let col = 0; col < config.labelsPerRow; col++) {
                    const labelIndex = row * config.labelsPerRow + col;

                    if (labelIndex < pageLabels.length) {
                        const label = pageLabels[labelIndex];
                        // Remove width/height from label stack as it conflicts with table sizing
                        const { width, height, ...labelContent } = label;
                        rowData.push(labelContent);
                    } else {
                        // Empty cell
                        rowData.push({ text: '' });
                    }
                }

                pageTable.push(rowData);
            }

            const widths = Array(config.labelsPerRow).fill(labelWidth);

            console.log('Page table structure:', {
                rows: pageTable.length,
                cols: widths.length,
                widths: widths
            });

            pages.push({
                table: {
                    widths: widths,
                    body: pageTable
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    paddingLeft: () => hGap / 2,
                    paddingRight: () => hGap / 2,
                    paddingTop: () => vGap / 2,
                    paddingBottom: () => vGap / 2
                },
                pageBreak: (i < labels.length - labelsPerPage) ? 'after' : undefined
            });
        }

        console.log('Total pages created:', pages.length);
        return pages;
    }

    private getFieldValue(product: InventoryItem, fieldName: string): string {
        switch (fieldName) {
            case 'tenantName':
                return this.tenantName;
            case 'name':
                return product.name;
            case 'price':
                return `$${product.price.toFixed(2)}`;
            case 'barcode':
                return product.barcode;
            default:
                return '';
        }
    }

    // ==================== Print Actions ====================

    previewPDF(blob: Blob): void {
        console.log('previewPDF called with blob size:', blob.size);

        try {
            const url = URL.createObjectURL(blob);
            console.log('Opening PDF in new window:', url);

            const newWindow = window.open(url, '_blank');

            if (!newWindow) {
                console.error('Failed to open new window - popup might be blocked');
                alert('Please allow popups for this site to preview the PDF');
            } else {
                console.log('PDF preview window opened successfully');
            }

            // Cleanup after 1 minute
            setTimeout(() => {
                console.log('Revoking blob URL after 1 minute');
                URL.revokeObjectURL(url);
            }, 60000);
        } catch (error) {
            console.error('Error in previewPDF:', error);
            throw error;
        }
    }

    downloadPDF(blob: Blob, filename: string = 'labels.pdf'): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    printPDF(blob: Blob): void {
        console.log('printPDF called with blob size:', blob.size);

        try {
            const url = URL.createObjectURL(blob);
            console.log('Created blob URL:', url);

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.position = 'fixed';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.src = url;

            console.log('Appending iframe to body...');
            document.body.appendChild(iframe);

            iframe.onload = () => {
                console.log('Iframe loaded, attempting to print...');
                setTimeout(() => {
                    try {
                        if (iframe.contentWindow) {
                            console.log('Calling iframe print...');
                            iframe.contentWindow.print();
                        } else {
                            console.error('iframe.contentWindow is null');
                            // Fallback: open in new window
                            window.open(url, '_blank');
                        }

                        setTimeout(() => {
                            console.log('Cleaning up iframe...');
                            if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                            }
                            URL.revokeObjectURL(url);
                        }, 1000);
                    } catch (printError) {
                        console.error('Error calling print:', printError);
                        // Fallback: open in new window
                        window.open(url, '_blank');
                    }
                }, 500);
            };

            iframe.onerror = (error) => {
                console.error('Iframe failed to load:', error);
                // Fallback: open in new window
                window.open(url, '_blank');
            };
        } catch (error) {
            console.error('Error in printPDF:', error);
            throw error;
        }
    }

    // ==================== Utility ====================

    private mmToPoints(mm: number): number {
        // 1 mm = 2.83465 points
        return mm * 2.83465;
    }

    private generateId(): string {
        return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateTotalPages(totalLabels: number, config: LabelConfiguration): number {
        const labelsPerPage = config.labelsPerRow * config.labelsPerColumn;
        return Math.ceil(totalLabels / labelsPerPage);
    }

    getDefaultConfiguration(): LabelConfiguration {
        return LABEL_PRESETS[0].configuration;
    }
}
