import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomerService } from '../../services/customer.service';
import { Customer, CustomerPurchaseHistory } from '../../models/customer.interface';
import { CustomerFormComponent } from '../customer-form/customer-form.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer;
  purchaseHistory?: CustomerPurchaseHistory;
  isLoadingHistory = false;
  activeTab = 0;

  constructor(
    private customerService: CustomerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CustomerDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Customer
  ) {
    this.customer = data;
  }

  ngOnInit(): void {
    this.loadPurchaseHistory();
  }

  loadPurchaseHistory(): void {
    this.isLoadingHistory = true;
    this.customerService.getCustomerPurchaseHistory(this.customer.id).subscribe({
      next: (history) => {
        this.purchaseHistory = history;
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading purchase history:', error);
        this.isLoadingHistory = false;
      }
    });
  }

  editCustomer(): void {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      width: '600px',
      data: this.customer
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh customer data
        this.customerService.getCustomerById(this.customer.id).subscribe({
          next: (updatedCustomer) => {
            this.customer = updatedCustomer;
          },
          error: (error) => {
            console.error('Error refreshing customer data:', error);
          }
        });
      }
    });
  }

  sendWhatsAppMessage(): void {
    // This would open a message composition dialog
    const message = prompt('Enter your WhatsApp message:');
    if (message) {
      this.customerService.sendWhatsAppMessage(this.customer.id, message).subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open('WhatsApp message sent successfully', 'Close', { duration: 3000 });
          } else {
            this.snackBar.open('Failed to send WhatsApp message', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error sending WhatsApp message:', error);
          this.snackBar.open('Error sending WhatsApp message', 'Close', { duration: 3000 });
        }
      });
    }
  }

  callCustomer(): void {
    window.open(`tel:${this.customer.phone}`);
  }

  emailCustomer(): void {
    window.open(`mailto:${this.customer.email}`);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getCustomerInitials(): string {
    return this.customer.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getTotalSpent(): number {
    return this.purchaseHistory?.totalAmount || 0;
  }

  getLastPurchaseDate(): Date | null {
    return this.purchaseHistory?.lastPurchaseDate || null;
  }

  getPurchaseCount(): number {
    return this.purchaseHistory?.totalPurchases || 0;
  }
}