import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'inventory',
    loadChildren: () => import('./features/inventory/inventory.module').then(m => m.InventoryModule)
  },
  {
    path: 'sales',
    loadChildren: () => import('./features/sales/sales.module').then(m => m.SalesModule)
  },
  {
    path: 'customers',
    loadChildren: () => import('./features/customers/customers.module').then(m => m.CustomersModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
  },
  { path: '', redirectTo: '/inventory', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
