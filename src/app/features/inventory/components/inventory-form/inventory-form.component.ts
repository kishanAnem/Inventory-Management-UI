import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryActions } from '../../store/inventory.actions';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatStepperModule,
    MatSnackBarModule
  ],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.scss'
})
export class InventoryFormComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  router = inject(Router); // Made public for template access
  private route = inject(ActivatedRoute);
  private inventoryService = inject(InventoryService);

  isEdit = signal(false);
  form = this.fb.group({
    id: [''],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.inventoryService.getById(id).subscribe(item => {
        this.form.patchValue(item);
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    const item = this.form.value as InventoryItem;
    if (this.isEdit()) {
      this.store.dispatch(InventoryActions.updateItem({ item }));
    } else {
      this.store.dispatch(InventoryActions.addItem({ item }));
    }
    this.router.navigate(['/inventory']);
  }
}
