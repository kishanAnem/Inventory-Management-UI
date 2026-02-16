import { InventoryItem } from '../../../services/inventory.service';
import { LabelConfiguration } from './label-configuration.interface';

export interface SelectedProduct {
  product: InventoryItem;
  quantity: number;  // Number of labels to print for this product
}

export interface PrintJob {
  products: SelectedProduct[];
  configuration: LabelConfiguration;
  totalLabels: number;
  totalPages: number;
}

export interface PrintResult {
  success: boolean;
  message: string;
  pdfBlob?: Blob;
}
