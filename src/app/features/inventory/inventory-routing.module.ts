
import { Routes, RouterModule } from '@angular/router';

import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { InventoryDetailComponent } from './components/inventory-detail/inventory-detail.component';
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
    loadComponent: () => import('./components/inventory-detail/inventory-detail.component').then(m => m.InventoryDetailComponent)
  }
];

export const InventoryRoutingModule = RouterModule.forChild(routes);
