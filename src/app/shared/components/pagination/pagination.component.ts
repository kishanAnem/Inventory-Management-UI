import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
}

export interface PaginationChange {
  pageNumber: number;
  pageSize: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() config: PaginationConfig = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    pageSizeOptions: [5, 10, 20, 50, 100]
  };

  @Output() pageChange = new EventEmitter<PaginationChange>();

  get totalPages(): number {
    return Math.ceil(this.config.totalItems / this.config.pageSize);
  }

  get startIndex(): number {
    return (this.config.currentPage - 1) * this.config.pageSize + 1;
  }

  get endIndex(): number {
    const end = this.config.currentPage * this.config.pageSize;
    return Math.min(end, this.config.totalItems);
  }

  get hasPreviousPage(): boolean {
    return this.config.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.config.currentPage < this.totalPages;
  }

  onPageSizeChange(newPageSize: number): void {
    this.config.pageSize = newPageSize;
    // Reset to first page when page size changes
    this.config.currentPage = 1;
    this.emitPageChange();
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.config.currentPage--;
      this.emitPageChange();
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.config.currentPage++;
      this.emitPageChange();
    }
  }

  firstPage(): void {
    if (this.hasPreviousPage) {
      this.config.currentPage = 1;
      this.emitPageChange();
    }
  }

  lastPage(): void {
    if (this.hasNextPage) {
      this.config.currentPage = this.totalPages;
      this.emitPageChange();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.config.currentPage = page;
      this.emitPageChange();
    }
  }

  private emitPageChange(): void {
    this.pageChange.emit({
      pageNumber: this.config.currentPage,
      pageSize: this.config.pageSize
    });
  }
}
