import { Injectable } from '@angular/core';
import { LabelConfiguration, LABEL_PRESETS, LabelPreset } from '../models/label-configuration.interface';
import { PrintJob, SelectedProduct, PrintResult } from '../models/print-job.interface';
import { InventoryItem } from '../../../services/inventory.service';
import { TenantService, TenantResponse } from '../../../../../core/services/tenant.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import QRCode from 'qrcode';

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

    async generatePDF(printJob: PrintJob): Promise<PrintResult> {
        console.log('LabelPrintingService.generatePDF called with:', printJob);
        
        try {
            console.log('Creating document definition...');
            const docDefinition = await this.createDocDefinition(printJob);
            console.log('Document definition created:', docDefinition);

            return new Promise<PrintResult>((resolve, reject) => {
                // Set a timeout to detect if getBlob hangs
                const timeout = setTimeout(() => {
                    console.error('PDF generation timed out after 30 seconds');
                    reject(new Error('PDF generation timed out'));
                }, 30000);

                try {
                    console.log('Creating PDF with pdfMake...');
                    const pdf = pdfMake.createPdf(docDefinition);
                    console.log('PDF object created, getting blob...');
                    
                    // Try using getDataUrl as a fallback test
                    (pdf as any).getDataUrl((dataUrl: string) => {
                        console.log('DataURL generated successfully');
                    });
                    
                    (pdf as any).getBlob((blob: Blob) => {
                        clearTimeout(timeout);
                        console.log('PDF blob received:', blob);
                        resolve({
                            success: true,
                            message: 'PDF generated successfully',
                            pdfBlob: blob
                        });
                    }, (error: any) => {
                        clearTimeout(timeout);
                        console.error('Error in getBlob callback:', error);
                        reject(error);
                    });
                } catch (pdfError) {
                    clearTimeout(timeout);
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
            pageOrientation: 'portrait',
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
        
        // Generate label content for each product
        for (const selectedProduct of printJob.products) {
            console.log('Processing product:', selectedProduct.product.name, 'qty:', selectedProduct.quantity);
            for (let i = 0; i < selectedProduct.quantity; i++) {
                const labelContent = await this.createLabelContent(selectedProduct.product, config);
                allLabels.push(labelContent);
            }
        }

        console.log('Total labels created:', allLabels.length);
        console.log('Arranging labels in grid...');
        
        // Arrange labels in grid layout
        const arrangedLabels = this.arrangeLabelsInGrid(allLabels, config);
        console.log('Labels arranged into', arrangedLabels.length, 'page(s)');
        
        return arrangedLabels;
    }

    private async createLabelContent(product: InventoryItem, config: LabelConfiguration): Promise<any> {
        console.log('Creating label for product:', product.name);
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
                    console.log('Generating barcode for:', product.barcode);
                    const codeImage = await this.generateCodeImage(
                        product.barcode,
                        template.codeType,
                        labelWidth,
                        labelHeight
                    );
                    console.log('Barcode generated successfully');

                    content.push({
                        image: codeImage,
                        width: labelWidth * 0.8,
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
                        text: product.barcode,
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
            stack: content,
            width: labelWidth,
            height: labelHeight
        };
    }

    private async generateCodeImage(
        data: string,
        codeType: string,
        maxWidth: number,
        maxHeight: number
    ): Promise<string> {
        console.log('generateCodeImage:', codeType, 'for data:', data);
        
        if (codeType === 'QR') {
            // Generate QR Code
            try {
                const qrCode = await QRCode.toDataURL(data, {
                    width: maxWidth * 0.7,
                    margin: 1,
                    errorCorrectionLevel: 'M'
                });
                console.log('QR code generated');
                return qrCode;
            } catch (error) {
                console.error('QR code generation failed:', error);
                throw error;
            }
        } else {
            // Generate Barcode using bwip-js
            const canvas = document.createElement('canvas');

            try {
                console.log('Loading bwip-js...');
                const bwipjs = await import('bwip-js/browser');
                console.log('bwip-js loaded, generating barcode...');

                (bwipjs as any).toCanvas(canvas, {
                    bcid: this.mapBarcodeType(codeType),
                    text: data,
                    scale: 3,
                    height: 10,
                    includetext: false,
                    textxalign: 'center'
                });

                const dataUrl = canvas.toDataURL('image/png');
                console.log('Barcode canvas converted to data URL');
                return dataUrl;
            } catch (error) {
                console.error('Barcode generation error:', error);
                throw error;
            }
        }
    }

    private mapBarcodeType(type: string): string {
        // Only CODE128 is supported for barcodes (QR handled separately)
        return 'code128';
    }

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
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Cleanup after 1 minute
        setTimeout(() => URL.revokeObjectURL(url), 60000);
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
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 1000);
            }, 500);
        };
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
