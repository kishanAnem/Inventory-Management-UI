
import { Routes, RouterModule } from '@angular/router';

import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { PurchaseOrderComponent } from './components/purchase-order/purchase-order.component';
import { InventoryFormComponent } from './components/inventory-form/inventory-form.component';


const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
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
    path: ':id',
    loadComponent: () => import('./components/purchase-order/purchase-order.component').then(m => m.PurchaseOrderComponent)
  }
];

export const InventoryRoutingModule = RouterModule.forChild(routes);
