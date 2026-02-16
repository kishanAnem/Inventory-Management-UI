# Label Printing Feature

## Overview
Complete barcode/QR code label printing system for inventory management. Users can select products, design labels, preview in PDF, and print directly.

## Features Implemented

### ✅ Product Selection (Step 1)
- **Multiple selection methods:**
  - Checkbox selection from product list
  - Search functionality
  - Category filtering
  - Select all/Clear all options
- **Selected products cart:**
  - Adjust quantity per product (number of labels)
  - Remove individual products
  - Real-time label count

### ✅  Label Configuration (Step 2)
- **Pre-configured templates:**
  - Avery L7160 (21 labels/page - 63.5×38.1mm)
  - Avery L7163 (14 labels/page - 99.1×38.1mm)
  - Avery L4731 (189 labels/page - 25.4×10mm)
  - Custom Retail (24 labels/page - 52×29mm)
- **Customizable settings:**
  - Paper size (A4/Letter)
  - Labels per row/column
  - Label dimensions (width/height)
  - Horizontal/vertical gaps
  - Page margins
- **Live preview** of label layout

### ✅ Label Content Design (Step 3)
- **Code type selection:**
  - Barcode (CODE128)
  - Barcode (CODE39)
  - Barcode (EAN13)
  - QR Code
- **Display field options:**
  - Product Name
  - Barcode/QR Code
  - Price
  - MRP
  - SKU
  - Category
  - Description
- **Typography controls:**
  - Font size
  - Font family
  - Text alignment

### ✅ PDF Preview & Print (Step 4)
- **Actions:**
  - Download PDF
  - Print directly
  - Save template for reuse
- **Preview features:**
  - Embedded PDF viewer
  - Page count display
  - Total labels count

## Technology Stack

- **Frontend:** Angular 19 (Standalone Components)
- **PDF Generation:** pdfmake (client-side)
- **Barcode Generator:** bwip-js
- **QR Code Generator:** qrcode
- **UI Components:** Angular Material

## File Structure

```
src/app/features/inventory/components/label-printing/
├── models/
│   ├── label-configuration.interface.ts  # Configuration models & presets
│   └── print-job.interface.ts            # Print job models
├── services/
│   └── label-printing.service.ts         # Core printing service
├── label-printing.component.ts           # Main component
├── label-printing.component.html         # Template
└── label-printing.component.scss         # Styles
```

## Navigation

**Access via:** Products → Label Printing  
**Route:** `/inventory/label-printing`

## Usage Flow

1. **Navigate** to Inventory → Label Printing
2. **Select Products:**
   - Browse, search, or filter products
   - Click to select/deselect
   - Adjust quantities in the cart
3. **Configure Layout:**
   - Choose a preset template OR customize
   - Adjust label dimensions and spacing
   - Preview the layout
4. **Design Content:**
   - Select barcode or QR code
   - Choose which fields to display
   - Configure typography
5. **Preview & Print:**
   - Review the generated PDF
   - Download or print directly

## Configuration Storage

- **Local Storage:** User configurations are saved automatically
- **Presets:** 4 built-in Avery label templates
- **Custom Templates:** Can be saved and reused

## Future Enhancements

- [ ] Backend PDF generation for large batches
- [ ] More barcode types (ITF, Codabar, etc.)
- [ ] Bulk print from inventory list
- [ ] Template sharing across users
- [ ] Direct printer integration (via Print API)
- [ ] Batch scanning for quick label printing
- [ ] Label materials/sizes database

## Dependencies Installed

```bash
npm install pdfmake bwip-js qrcode --save
npm install @types/pdfmake @types/qrcode --save-dev
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Notes

- PDF generation happens client-side (no server load)
- Labels are generated in real-time
- All configurations persist in browser local storage
- Supports up to 1000 products per print job
