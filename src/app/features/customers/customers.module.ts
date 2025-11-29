import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Components
import { CustomerListComponent } from './components/customer-list/customer-list.component';

// Services
import { CustomerService } from './services/customer.service';

const routes = [
  { path: '', component: CustomerListComponent },
  { path: 'list', component: CustomerListComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CustomerListComponent
  ],
  providers: [
    CustomerService
  ]
})
export class CustomersModule { }
