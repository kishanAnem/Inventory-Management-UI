# Copilot Instructions - Inventory Management UI

## Standard Form and Component Styling

**IMPORTANT**: All new components and forms must follow the standardized styling patterns defined in this document. This applies to ALL new components going forward - you should NOT need to be reminded each time.

## Reference Components

Primary reference for form styling: `src/app/features/inventory/components/add-product/add-product.component.html` and `.scss`

## Required HTML Structure

### Page Layout
```html
<div class="[component-name]-page">
  <!-- Loading Spinner -->
  @if (isLoading) {
  <div class="loading-container">
    <mat-spinner diameter="50"></mat-spinner>
    <p>Loading...</p>
  </div>
  }

  @if (!isLoading) {
  <!-- Header -->
  <div class="page-header">
    <button mat-icon-button class="back-button" (click)="onBack()">
      <mat-icon>arrow_back</mat-icon>
    </button>
    <h1>Page Title</h1>
  </div>

  <!-- Main Content -->
  <div class="page-content">
    <mat-card class="form-card">
      <!-- Error Message -->
      @if (errorMessage()) {
      <div class="error-message">
        <mat-icon>error</mat-icon>
        <span>{{ errorMessage() }}</span>
      </div>
      }

      <form [formGroup]="form" class="[form-name]-form">
        <!-- Form fields here -->
      </form>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" (click)="onSubmit()">
          Submit
        </button>
      </div>
    </mat-card>
  </div>
  }
</div>
```

### Form Field Structure

#### Standard Input Field
```html
<div class="form-field">
  <label class="field-label">
    Field Name <span class="required">*</span>
  </label>
  <input type="text" class="field-input" formControlName="fieldName" placeholder="Placeholder" />
  <div class="field-error" *ngIf="form.get('fieldName')?.invalid && form.get('fieldName')?.touched">
    {{ getErrorMessage('fieldName') }}
  </div>
</div>
```

#### Textarea Field
```html
<div class="form-field full-width">
  <label class="field-label">Description</label>
  <textarea class="field-input field-textarea" formControlName="description" 
    placeholder="Description" rows="3"></textarea>
</div>
```

#### Select/Dropdown Field
```html
<div class="form-field">
  <label class="field-label">Category</label>
  <select class="field-input field-select" formControlName="categoryId">
    <option value="">Select category</option>
    <option *ngFor="let item of items" [value]="item.id">
      {{ item.name }}
    </option>
  </select>
</div>
```

#### Input with Inline Button
```html
<div class="form-field">
  <label class="field-label">Barcode <span class="required">*</span></label>
  <div class="input-with-button">
    <input type="text" class="field-input" formControlName="barcode" placeholder="Barcode" />
    <button type="button" class="inline-btn" (click)="generateBarcode()">
      <mat-icon>qr_code</mat-icon>
    </button>
  </div>
</div>
```

#### Two-Column Row Layout
```html
<div class="form-row">
  <div class="form-field">
    <!-- First field -->
  </div>
  <div class="form-field">
    <!-- Second field -->
  </div>
</div>
```

#### Checkbox Field
```html
<div class="checkbox-field">
  <label class="checkbox-container">
    <input type="checkbox" formControlName="isActive" />
    <span class="checkbox-label">Active</span>
  </label>
  <small class="checkbox-hint">Additional hint text</small>
</div>
```

### Buttons

#### Standard Buttons
```html
<!-- Primary Button -->
<button type="button" class="btn btn-primary" (click)="onAction()">
  <mat-icon *ngIf="isLoading" class="spinning">sync</mat-icon>
  {{ isLoading ? 'Loading...' : 'Submit' }}
</button>

<!-- Secondary Button -->
<button type="button" class="btn btn-secondary" (click)="onCancel()">
  Cancel
</button>
```

### Dialog/Modal Structure

```html
@if (showDialog) {
<div class="overlay" (click)="closeDialog()">
  <div class="quick-add-dialog" (click)="$event.stopPropagation()">
    <div class="quick-add-header">
      <h3>Dialog Title</h3>
      <button mat-icon-button (click)="closeDialog()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <div class="quick-add-content">
      <!-- Dialog content -->
    </div>
    <div class="quick-add-actions">
      <button type="button" class="btn btn-secondary" (click)="closeDialog()">
        Cancel
      </button>
      <button type="button" class="btn btn-primary" (click)="onDialogSubmit()">
        Submit
      </button>
    </div>
  </div>
</div>
}
```

## CSS Class Reference

### Layout Classes
- `.page-header` - Top header with back button and title
- `.page-content` - Main content container (max-width: 800px)
- `.form-card` - White card container for forms
- `.loading-container` - Centered loading spinner container

### Form Classes
- `.form-row` - Two-column grid layout
- `.form-field` - Individual form field container
- `.full-width` - Full width field (spans both columns in grid)
- `.field-label` - Label text
- `.required` - Red asterisk for required fields
- `.field-input` - Input/textarea/select base styling
- `.field-textarea` - Textarea specific styling
- `.field-select` - Select/dropdown specific styling
- `.field-error` - Error message text
- `.input-with-button` - Container for input with inline button
- `.inline-btn` - Button inside input field
- `.checkbox-field` - Checkbox container
- `.checkbox-container` - Checkbox with label wrapper
- `.checkbox-label` - Checkbox label text
- `.checkbox-hint` - Small hint text below checkbox

### Button Classes
- `.btn` - Base button class (required on all buttons)
- `.btn-primary` - Primary action button (green)
- `.btn-secondary` - Secondary/cancel button (white with border)
- `.spinning` - Spinning animation for mat-icon

### Dialog Classes
- `.overlay` - Full-screen dark overlay
- `.quick-add-dialog` - Dialog container
- `.quick-add-header` - Dialog header with title and close button
- `.quick-add-content` - Dialog main content area
- `.quick-add-actions` - Dialog action buttons footer

### Error/Message Classes
- `.error-message` - Error message banner with icon

## SCSS Standards

### Required SCSS Structure
Every form component SCSS file must follow this structure:

```scss
// Component Page Styles
.[component-name]-page {
  min-height: 100vh;
  background-color: var(--form-bg);
  padding-top: 32px;

  .page-header {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    padding: 16px 24px;
    border-radius: 8px;
    max-width: 800px;
    margin: 0 auto 24px;
    display: flex;
    align-items: center;
    gap: 16px;

    .back-button {
      color: var(--form-text-muted);
      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
        color: var(--form-text);
      }
    }

    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--form-text);
    }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 24px;

    p {
      color: var(--form-text-muted);
      font-size: 16px;
      font-weight: 500;
      margin: 0;
    }
  }

  .page-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 0;

    .form-card {
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 40px;
      border: 1px solid var(--border-light);

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 24px;
        padding: 12px 16px;
        background: var(--error-bg);
        border-radius: 6px;
        color: var(--error);
        font-size: 14px;
        border: 1px solid var(--error-border);

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
      }

      .[form-name]-form {
        display: flex;
        flex-direction: column;
        gap: 24px;

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;

          @media (max-width: 640px) {
            grid-template-columns: 1fr;
          }
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;

          &.full-width {
            grid-column: 1 / -1;
          }

          .field-label {
            font-size: 14px;
            font-weight: 500;
            color: var(--form-text-secondary);

            .required {
              color: var(--error);
            }
          }

          .field-input {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            color: var(--form-text);
            background: var(--bg-secondary);
            border: 1px solid var(--form-border);
            border-radius: 6px;
            transition: all 0.15s ease;
            font-family: inherit;

            &::placeholder {
              color: var(--form-placeholder);
            }

            &:hover {
              border-color: var(--form-border-hover);
            }

            &:focus {
              outline: none;
              border-color: var(--primary);
              box-shadow: 0 0 0 3px rgba(0, 128, 96, 0.1);
            }

            &:disabled {
              background-color: var(--form-disabled-bg);
              color: var(--form-placeholder);
              cursor: not-allowed;
            }

            &.field-textarea {
              resize: vertical;
              min-height: 80px;
            }

            &.field-select {
              appearance: none;
              background-position: right 8px center;
              background-repeat: no-repeat;
              background-size: 20px;
              padding-right: 36px;
            }
          }

          .field-error {
            font-size: 12px;
            color: var(--error);
            margin-top: 4px;
          }

          .input-with-button {
            position: relative;
            display: flex;
            align-items: center;

            .field-input {
              flex: 1;
              padding-right: 44px;
            }

            .inline-btn {
              position: absolute;
              right: 4px;
              background: transparent;
              border: none;
              padding: 6px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
              color: var(--form-text-muted);
              transition: all 0.15s ease;

              mat-icon {
                font-size: 20px;
                width: 20px;
                height: 20px;
              }

              &:hover:not(:disabled) {
                background-color: var(--form-hover-bg);
                color: var(--form-text);
              }

              &:disabled {
                opacity: 0.4;
                cursor: not-allowed;
              }
            }
          }
        }

        .checkbox-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 0;

          .checkbox-container {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;

            input[type="checkbox"] {
              width: 18px;
              height: 18px;
              cursor: pointer;
              accent-color: var(--primary);
            }

            .checkbox-label {
              font-size: 14px;
              font-weight: 500;
              color: var(--form-text-secondary);
              cursor: pointer;
            }
          }

          .checkbox-hint {
            font-size: 12px;
            color: var(--form-text-muted);
            margin-left: 28px;
          }
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--border-light);

        .btn {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
          font-family: inherit;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;

            &.spinning {
              animation: spin 1s linear infinite;
            }
          }

          &.btn-secondary {
            background: var(--bg-secondary);
            color: var(--form-text-secondary);
            border: 1px solid var(--form-border);

            &:hover:not(:disabled) {
              background-color: var(--form-disabled-bg);
              border-color: var(--form-border-hover);
            }
          }

          &.btn-primary {
            background: var(--primary);
            color: var(--text-inverse);

            &:hover:not(:disabled) {
              background-color: var(--primary-hover);
            }
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}

// Dialog Styles (if needed)
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-in;

  .quick-add-dialog {
    background: var(--bg-secondary);
    border-radius: 8px;
    width: 90%;
    max-width: 450px;
    animation: slideUp 0.3s ease-out;

    .quick-add-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-light);

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--form-text);
      }

      button {
        color: var(--form-text-muted);
        &:hover {
          background-color: var(--form-hover-bg);
          color: var(--form-text);
        }
      }
    }

    .quick-add-content {
      padding: 24px;
    }

    .quick-add-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border-light);

      .btn {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.15s ease;
        font-family: inherit;
        min-width: 90px;
        height: 40px;

        &.btn-secondary {
          background: var(--bg-secondary);
          color: var(--form-text-secondary);
          border: 1px solid var(--form-border);

          &:hover {
            background-color: var(--form-disabled-bg);
            border-color: var(--form-border-hover);
          }
        }

        &.btn-primary {
          background: var(--primary);
          color: var(--text-inverse);

          &:hover:not(:disabled) {
            background-color: var(--primary-hover);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;

          &.spinning {
            animation: spin 1s linear infinite;
          }
        }
      }
    }
  }
}

// Animations
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// Responsive
@media (max-width: 640px) {
  .[component-name]-page {
    .page-content {
      padding: 16px;
      .form-card {
        padding: 24px;
      }
    }
  }
}
```

## CSS Variables (Already Defined in src/styles.scss)

All components must use these CSS variables:

### Colors
- `--bg-primary` - Primary background (#f1f1f1)
- `--bg-secondary` - Secondary background/white (#ffffff)
- `--text-primary` - Primary text color
- `--text-secondary` - Secondary text color
- `--text-inverse` - White text
- `--primary` - Primary brand color (#008060)
- `--primary-hover` - Primary hover state
- `--border-light` - Light borders
- `--error` - Error red color
- `--error-bg` - Error background
- `--error-border` - Error border

### Form-Specific
- `--form-bg` - Form background (#fafafa)
- `--form-border` - Form input borders
- `--form-border-hover` - Hover state for borders
- `--form-text` - Form text color
- `--form-text-secondary` - Secondary form text
- `--form-text-muted` - Muted/placeholder text
- `--form-placeholder` - Placeholder text color
- `--form-disabled-bg` - Disabled input background
- `--form-hover-bg` - Hover background for buttons

## DO NOT Use Material Design Components for Forms

**IMPORTANT**: Do NOT use the following Material components in forms:
- ❌ `<mat-form-field>` - Use standard HTML inputs with `.field-input` class
- ❌ `<mat-input>` - Use standard `<input>` elements
- ❌ `<mat-select>` - Use standard `<select>` elements  
- ❌ Material button directives - Use standard `<button>` with `.btn` classes

**ONLY use Material components for**:
- ✅ `<mat-icon>` - Icons
- ✅ `<mat-spinner>` - Loading spinners
- ✅ `<mat-stepper>` - Multi-step wizards (when appropriate)
- ✅ `mat-icon-button` - Icon-only buttons (like close button in dialogs)

## Filter/Search Component Patterns

For list pages with filters (like label-printing), use:

```html
<div class="search-filters">
  <mat-form-field class="search-field" appearance="outline">
    <mat-icon matPrefix>search</mat-icon>
    <input matInput placeholder="Search..." [(ngModel)]="searchQuery">
  </mat-form-field>

  <mat-form-field class="filter-field" appearance="outline">
    <mat-label>Category</mat-label>
    <select matNativeControl [(ngModel)]="selectedCategory">
      <option value="all">All Categories</option>
      <option *ngFor="let cat of categories" [value]="cat.id">{{cat.name}}</option>
    </select>
  </mat-form-field>

  <button mat-raised-button color="primary" class="action-btn">
    <mat-icon>icon_name</mat-icon>
    Action
  </button>
</div>
```

**Styling for filters**:
```scss
.search-filters {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  align-items: flex-start;

  .search-field {
    flex: 1;
    min-width: 250px;
  }

  .filter-field {
    min-width: 200px;
  }

  mat-form-field {
    margin: 0;
  }

  .action-btn {
    height: 56px;
    border-radius: 6px;
    font-weight: 500;
    padding: 0 24px;
  }
}
```

## Key Principles

1. **Consistency**: All forms should look and behave identically
2. **Simplicity**: Clean, minimal design without unnecessary decoration
3. **CSS Variables**: Always use defined CSS variables, never hardcode colors
4. **Responsive**: Forms must work on mobile (use provided media queries)
5. **Accessibility**: Proper labels, error messages, and focus states
6. **Standard HTML**: Prefer semantic HTML over framework-specific components
7. **No Material Form Components**: Use Material only for icons, spinners, and specific UI elements

## Common Mistakes to Avoid

- ❌ Using `<mat-form-field>` for inputs
- ❌ Hardcoding colors instead of CSS variables
- ❌ Inconsistent button styling
- ❌ Missing error states
- ❌ Not using the two-column grid layout
- ❌ Forgetting the `.required` span for required fields
- ❌ Not following the exact HTML structure
- ❌ Using different dialog/modal patterns
- ❌ Inconsistent spacing and padding values

## Implementation Checklist

When creating a new form component, ensure:

- [ ] HTML structure matches the standard pattern
- [ ] All CSS classes follow naming convention
- [ ] Uses CSS variables (no hardcoded colors)
- [ ] Has proper error handling and display
- [ ] Includes loading states  
- [ ] Buttons use `.btn` classes
- [ ] Two-column layout for form rows
- [ ] Proper responsive breakpoints
- [ ] Dialogs use overlay + quick-add-dialog pattern
- [ ] Animations included (spin, fadeIn, slideUp)
- [ ] No Material form components used
- [ ] Follows exact SCSS structure provided

---

**Remember**: This is the standard for ALL new components. Apply these patterns automatically without needing reminders.
