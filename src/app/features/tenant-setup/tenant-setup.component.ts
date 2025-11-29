import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@auth0/auth0-angular';
import { TenantService, UpdateTenantRequest, TenantSetupStatus } from '../../core/services/tenant.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-tenant-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule
  ],
  templateUrl: './tenant-setup.component.html',
  styleUrl: './tenant-setup.component.scss'
})
export class TenantSetupComponent implements OnInit {
  setupForm: FormGroup;
  isLoading = false;
  setupStatus: TenantSetupStatus | null = null;

  constructor(
    private fb: FormBuilder,
    private tenantService: TenantService,
    public auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.setupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobile: ['', [Validators.pattern(/^[\+]?[0-9\-\s\(\)]{10,15}$/)]],
      address: [''],
      city: [''],
      state: [''],
      logoUrl: ['', [Validators.pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i)]]
    });
  }

  ngOnInit() {
    // Load setup status first
    this.loadSetupStatus();
    
    // Pre-fill name if available from Auth0
    this.auth.user$.subscribe(user => {
      if (user?.name) {
        this.setupForm.patchValue({
          name: user.name
        });
      }
    });

    // Load existing tenant data if available
    this.loadExistingTenantData();
  }

  private loadSetupStatus() {
    this.tenantService.getSetupStatus().subscribe({
      next: (status) => {
        this.setupStatus = status;
      },
      error: (error) => {
        console.error('Error loading setup status:', error);
      }
    });
  }

  private loadExistingTenantData() {
    this.tenantService.getCurrentTenant().subscribe({
      next: (tenant) => {
        if (tenant) {
          this.setupForm.patchValue({
            name: tenant.name,
            mobile: tenant.mobile,
            address: tenant.address,
            city: tenant.city,
            state: tenant.state,
            logoUrl: tenant.logoUrl
          });
        }
      },
      error: (error) => {
        // If tenant doesn't exist, that's fine - we're setting it up
        console.log('No existing tenant found, starting fresh setup');
      }
    });
  }

  onSubmit() {
    if (this.setupForm.valid) {
      this.isLoading = true;
      
      const updateRequest: UpdateTenantRequest = {
        name: this.setupForm.value.name,
        mobile: this.setupForm.value.mobile || undefined,
        address: this.setupForm.value.address || undefined,
        city: this.setupForm.value.city || undefined,
        state: this.setupForm.value.state || undefined,
        logoUrl: this.setupForm.value.logoUrl || undefined
      };

      // First initialize tenant, then update
      this.tenantService.initializeTenant().pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          // Now update with the form data
          this.updateTenantData(updateRequest);
        },
        error: (error) => {
          console.error('Error initializing tenant:', error);
          this.showErrorMessage('Failed to initialize tenant. Please try again.');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private updateTenantData(updateRequest: UpdateTenantRequest) {
    this.isLoading = true;
    
    this.tenantService.updateTenant(updateRequest).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.showSuccessMessage('Business profile updated successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error updating tenant:', error);
        this.showErrorMessage('Failed to update business profile. Please try again.');
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.setupForm.controls).forEach(key => {
      this.setupForm.get(key)?.markAsTouched();
    });
  }

  private showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  skipSetup() {
    this.router.navigate(['/dashboard']);
  }
}