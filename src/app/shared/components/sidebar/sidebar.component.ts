import { Component, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleCollapsed = new EventEmitter<boolean>();

  isCollapsed = signal(false);

  menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      route: '/'
    },
    // {
    //   id: 'orders',
    //   label: 'Orders',
    //   icon: 'receipt_long',
    //   route: '/orders'
    // },
    {
      id: 'all-products',
      label: 'All products',
      icon: 'inventory_2',
      route: '/inventory'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: 'category',
      route: '/inventory/categories'
    },
    {
      id: 'label-printing',
      label: 'Label Printing',
      icon: 'local_printshop',
      route: '/inventory/label-printing'
    },
    {
      id: 'purchase-orders',
      label: 'Purchase orders',
      icon: 'receipt',
      route: '/inventory/purchase-orders'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: 'people',
      route: '/customers'
    },
    // {
    //   id: 'marketing',
    //   label: 'Marketing',
    //   icon: 'campaign',
    //   route: '/marketing'
    // },
    // {
    //   id: 'discounts',
    //   label: 'Discounts',
    //   icon: 'local_offer',
    //   route: '/discounts'
    // },
    // {
    //   id: 'content',
    //   label: 'Content',
    //   icon: 'article',
    //   route: '/content'
    // },
    // {
    //   id: 'analytics',
    //   label: 'Analytics',
    //   icon: 'analytics',
    //   route: '/analytics'
    // }
  ];

  salesChannels = [
    { id: 'online-store', label: 'Online Store', icon: 'storefront' },
    { id: 'point-of-sale', label: 'Point of Sale', icon: 'point_of_sale' }
  ];

  constructor(private router: Router) { }

  toggleSidebar() {
    const newState = !this.isCollapsed();
    this.isCollapsed.set(newState);
    this.toggleCollapsed.emit(newState);
  }

  navigateTo(route?: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  isActiveRoute(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route;
  }
}