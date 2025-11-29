import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@auth0/auth0-angular';
import { AuthService as LocalAuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  constructor(
    public auth0: AuthService,
    public authService: LocalAuthService
  ) {}

  onMenuToggle() {
    this.menuToggle.emit();
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  onImageError(event: any) {
    // Hide the broken image by setting display to none
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.style.display = 'none';
    }
  }
}