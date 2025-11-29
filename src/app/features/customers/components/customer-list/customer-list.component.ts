import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.interface';
import { CustomerFormComponent } from '../customer-form/customer-form.component';
import { CustomerDetailComponent } from '../customer-detail/customer-detail.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'select',
    'name',
    'email',
    'phone',
    'address',
    'city',
    'isActive',
    'createdAt',
    'actions'
  ];

  dataSource = new MatTableDataSource<Customer>();
  selection = new SelectionModel<Customer>(true, []);
  isLoading = false;
  searchTerm = '';
  totalCustomers = 0;
  activeCustomers = 0;

  constructor(
    private customerService: CustomerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadCustomerStats();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.dataSource.data = customers;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Error loading customers', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadCustomerStats(): void {
    this.customerService.getCustomerStats().subscribe({
      next: (stats) => {
        this.totalCustomers = stats.totalCustomers;
        this.activeCustomers = stats.activeCustomers;
      },
      error: (error) => {
        console.error('Error loading customer stats:', error);
      }
    });
  }

  applyFilter(): void {
    if (this.searchTerm.trim()) {
      this.isLoading = true;
      this.customerService.searchCustomers(this.searchTerm).subscribe({
        next: (customers) => {
          this.dataSource.data = customers;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching customers:', error);
          this.snackBar.open('Error searching customers', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.loadCustomers();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadCustomers();
  }

  openCustomerForm(customer?: Customer): void {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      width: '600px',
      data: customer
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCustomers();
        this.loadCustomerStats();
      }
    });
  }

  viewCustomerDetail(customer: Customer): void {
    this.dialog.open(CustomerDetailComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: customer
    });
  }

  deleteCustomer(customer: Customer): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Customer',
        message: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.deleteCustomer(customer.id).subscribe({
          next: () => {
            this.snackBar.open('Customer deleted successfully', 'Close', { duration: 3000 });
            this.loadCustomers();
            this.loadCustomerStats();
          },
          error: (error) => {
            console.error('Error deleting customer:', error);
            this.snackBar.open('Error deleting customer', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteSelectedCustomers(): void {
    const selectedCustomers = this.selection.selected;
    if (selectedCustomers.length === 0) {
      this.snackBar.open('No customers selected', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Multiple Customers',
        message: `Are you sure you want to delete ${selectedCustomers.length} customer(s)? This action cannot be undone.`,
        confirmText: 'Delete All',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const deletePromises = selectedCustomers.map(customer => 
          this.customerService.deleteCustomer(customer.id).toPromise()
        );

        Promise.all(deletePromises).then(() => {
          this.snackBar.open(`${selectedCustomers.length} customers deleted successfully`, 'Close', { duration: 3000 });
          this.selection.clear();
          this.loadCustomers();
          this.loadCustomerStats();
        }).catch(error => {
          console.error('Error deleting customers:', error);
          this.snackBar.open('Error deleting some customers', 'Close', { duration: 3000 });
        });
      }
    });
  }

  sendWhatsAppMessage(customer: Customer): void {
    // Implementation for WhatsApp messaging
    // This could open a dialog for composing the message
    console.log('Send WhatsApp message to:', customer.name);
  }

  exportToCSV(): void {
    this.customerService.exportCustomersToCSV().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Customers exported successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error exporting customers:', error);
        this.snackBar.open('Error exporting customers', 'Close', { duration: 3000 });
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.customerService.importCustomersFromCSV(file).subscribe({
        next: (result) => {
          this.snackBar.open(
            `Import completed: ${result.success} customers imported`, 
            'Close', 
            { duration: 5000 }
          );
          if (result.errors.length > 0) {
            console.error('Import errors:', result.errors);
          }
          this.loadCustomers();
          this.loadCustomerStats();
        },
        error: (error) => {
          console.error('Error importing customers:', error);
          this.snackBar.open('Error importing customers', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('Please select a valid CSV file', 'Close', { duration: 3000 });
    }
    // Reset the file input
    event.target.value = '';
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Customer): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.name}`;
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }
}