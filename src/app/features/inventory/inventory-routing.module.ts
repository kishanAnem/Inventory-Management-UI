
import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
  },
  {
    path: 'product/add',
    loadComponent: () => import('./components/add-product/add-product.component').then(m => m.AddProductComponent)
  },
  {
    path: 'product/edit/:id',
    loadComponent: () => import('./components/add-product/add-product.component').then(m => m.AddProductComponent)
  },
  {
    path: 'categories',
    loadComponent: () => import('./components/category-management/category-management.component').then(m => m.CategoryManagementComponent)
  },
  {
    path: 'add',
    loadComponent: () => import('./components/inventory-form/inventory-form.component').then(m => m.InventoryFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/inventory-form/inventory-form.component').then(m => m.InventoryFormComponent)
  },
  {
    path: 'label-printing',
    loadComponent: () => import('./components/label-printing/label-printing.component').then(m => m.LabelPrintingComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/purchase-order/purchase-order.component').then(m => m.PurchaseOrderComponent)
  }
];

// Keep the RouterModule export for backward compatibility if needed
export const InventoryRoutingModule = inventoryRoutes;
