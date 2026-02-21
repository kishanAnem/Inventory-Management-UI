export type PaperSize = 'A4' | 'Letter' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';
export type BarcodeType = 'CODE128' | 'QR';
export type FontFamily = 'Roboto';
export type FontWeight = 'normal' | 'bold';
export type TextAlignment = 'left' | 'center' | 'right';

export interface LabelConfiguration {
    id?: string;
    name?: string;

    // Paper Settings
    paperSize: PaperSize;
    pageOrientation: PageOrientation;
    pageWidth: number;      // in mm
    pageHeight: number;     // in mm

    // Label Dimensions
    labelWidth: number;     // in mm
    labelHeight: number;    // in mm

    // Layout
    labelsPerRow: number;
    labelsPerColumn: number;

    // Spacing
    horizontalGap: number;  // in mm
    verticalGap: number;    // in mm
    topMargin: number;      // in mm
    leftMargin: number;     // in mm
    rightMargin: number;    // in mm
    bottomMargin: number;   // in mm

    // Content Template
    template: LabelTemplate;
}

export interface LabelTemplate {
    id: string;
    name: string;

    // Code Settings
    codeType: BarcodeType;
    showCode: boolean;

    // Fields to Display
    fields: LabelField[];

    // Typography
    fontSize: number;
    fontFamily: FontFamily;
}

export interface LabelField {
    fieldName: string;      // 'tenantName', 'name', 'barcode', 'price'
    displayLabel: string;   // Label text shown on the label (e.g., 'MRP')
    visible: boolean;
    fontSize: number;
    fontWeight: FontWeight;
    alignment: TextAlignment;
    order: number;          // Display order
}

export interface LabelPreset {
    id: string;
    name: string;
    description: string;
    configuration: LabelConfiguration;
}

// Common label presets (Avery templates)
export const LABEL_PRESETS: LabelPreset[] = [
    {
        id: 'avery-l7160',
        name: 'Avery L7160',
        description: '21 labels per page (63.5×38.1mm) - Address labels',
        configuration: {
            paperSize: 'A4',
            pageOrientation: 'portrait',
            pageWidth: 210,
            pageHeight: 297,
            labelWidth: 63.5,
            labelHeight: 38.1,
            labelsPerRow: 3,
            labelsPerColumn: 7,
            horizontalGap: 2.5,
            verticalGap: 0,
            topMargin: 15.5,
            leftMargin: 7,
            rightMargin: 7,
            bottomMargin: 15.5,
            template: {
                id: 'standard',
                name: 'Standard',
                codeType: 'CODE128',
                showCode: true,
                fontSize: 10,
                fontFamily: 'Roboto',
                fields: [
                    { fieldName: 'tenantName', displayLabel: '', visible: true, fontSize: 8, fontWeight: 'normal', alignment: 'center', order: 1 },
                    { fieldName: 'name', displayLabel: '', visible: true, fontSize: 10, fontWeight: 'bold', alignment: 'center', order: 2 },
                    { fieldName: 'barcode', displayLabel: '', visible: true, fontSize: 8, fontWeight: 'normal', alignment: 'center', order: 3 },
                    { fieldName: 'price', displayLabel: 'MRP', visible: true, fontSize: 9, fontWeight: 'bold', alignment: 'center', order: 4 }
                ]
            }
        }
    },
    {
        id: 'avery-l7163',
        name: 'Avery L7163',
        description: '14 labels per page (99.1×38.1mm) - Shipping labels',
        configuration: {
            paperSize: 'A4',
            pageOrientation: 'portrait',
            pageWidth: 210,
            pageHeight: 297,
            labelWidth: 99.1,
            labelHeight: 38.1,
            labelsPerRow: 2,
            labelsPerColumn: 7,
            horizontalGap: 2.5,
            verticalGap: 0,
            topMargin: 15.2,
            leftMargin: 5,
            rightMargin: 5,
            bottomMargin: 15.2,
            template: {
                id: 'standard',
                name: 'Standard',
                codeType: 'CODE128',
                showCode: true,
                fontSize: 10,
                fontFamily: 'Roboto',
                fields: [
                    { fieldName: 'tenantName', displayLabel: '', visible: true, fontSize: 8, fontWeight: 'normal', alignment: 'center', order: 1 },
                    { fieldName: 'name', displayLabel: '', visible: true, fontSize: 11, fontWeight: 'bold', alignment: 'center', order: 2 },
                    { fieldName: 'barcode', displayLabel: '', visible: true, fontSize: 8, fontWeight: 'normal', alignment: 'center', order: 3 },
                    { fieldName: 'price', displayLabel: 'MRP', visible: true, fontSize: 10, fontWeight: 'bold', alignment: 'center', order: 4 }
                ]
            }
        }
    },
    {
        id: 'avery-l4731',
        name: 'Avery L4731',
        description: '189 labels per page (25.4×10mm) - Small product labels',
        configuration: {
            paperSize: 'A4',
            pageOrientation: 'portrait',
            pageWidth: 210,
            pageHeight: 297,
            labelWidth: 25.4,
            labelHeight: 10,
            labelsPerRow: 7,
            labelsPerColumn: 27,
            horizontalGap: 2.5,
            verticalGap: 0,
            topMargin: 13,
            leftMargin: 9,
            rightMargin: 9,
            bottomMargin: 13,
            template: {
                id: 'minimal',
                name: 'Minimal',
                codeType: 'CODE128',
                showCode: false,
                fontSize: 6,
                fontFamily: 'Roboto',
                fields: [
                    { fieldName: 'tenantName', displayLabel: '', visible: false, fontSize: 5, fontWeight: 'normal', alignment: 'center', order: 1 },
                    { fieldName: 'name', displayLabel: '', visible: true, fontSize: 6, fontWeight: 'bold', alignment: 'center', order: 2 },
                    { fieldName: 'barcode', displayLabel: '', visible: false, fontSize: 5, fontWeight: 'normal', alignment: 'center', order: 3 },
                    { fieldName: 'price', displayLabel: '', visible: true, fontSize: 6, fontWeight: 'bold', alignment: 'center', order: 4 }
                ]
            }
        }
    },
    {
        id: 'custom-retail',
        name: 'Custom Retail',
        description: '24 labels per page (52×29mm) - Price tags',
        configuration: {
            paperSize: 'A4',
            pageOrientation: 'portrait',
            pageWidth: 210,
            pageHeight: 297,
            labelWidth: 52,
            labelHeight: 29,
            labelsPerRow: 4,
            labelsPerColumn: 6,
            horizontalGap: 0,
            verticalGap: 0,
            topMargin: 21,
            leftMargin: 0,
            rightMargin: 0,
            bottomMargin: 21,
            template: {
                id: 'retail',
                name: 'Retail Price Tag',
                codeType: 'CODE128',
                showCode: true,
                fontSize: 9,
                fontFamily: 'Roboto',
                fields: [
                    { fieldName: 'tenantName', displayLabel: '', visible: true, fontSize: 7, fontWeight: 'normal', alignment: 'center', order: 1 },
                    { fieldName: 'name', displayLabel: '', visible: true, fontSize: 9, fontWeight: 'bold', alignment: 'center', order: 2 },
                    { fieldName: 'barcode', displayLabel: '', visible: true, fontSize: 7, fontWeight: 'normal', alignment: 'center', order: 3 },
                    { fieldName: 'price', displayLabel: 'MRP', visible: true, fontSize: 10, fontWeight: 'bold', alignment: 'center', order: 4 }
                ]
            }
        }
    }
];
