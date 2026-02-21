import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class SnackbarService {
    constructor(private snackBar: MatSnackBar) { }

    success(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    error(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    info(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 3500,
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }
}
