import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { rootRedirectGuard } from './core/guards/root-redirect.guard';

export const routes: Routes = [
  // Authentication routes
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'callback',
    loadComponent: () => import('./auth/callback/callback.component').then(m => m.CallbackComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: 'tenant-setup',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tenant-setup/tenant-setup.component').then(m => m.TenantSetupComponent)
  },

  // Protected routes (require tenant setup)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadChildren: () => import('./features/inventory/inventory-routing.module').then(m => m.inventoryRoutes)
  },

  // Default redirects
  {
    path: '',
    canActivate: [rootRedirectGuard],
    children: []
  },
  {
    path: '**',
    canActivate: [rootRedirectGuard],
    children: []
  }
];
