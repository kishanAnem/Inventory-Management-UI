import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ContinueButtonComponent } from './components/continue-button/continue-button.component';

@NgModule({
  declarations: [ContinueButtonComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  exports: [ContinueButtonComponent]
})
export class SharedModule { }