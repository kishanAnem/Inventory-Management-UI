export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  isActive: boolean;
  whatsAppNumber?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCustomerDTO {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface UpdateCustomerDTO extends CreateCustomerDTO {
  id: string;
}

export interface CustomerSearchResult {
  customers: Customer[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export interface CustomerPurchaseHistory {
  customerId: string;
  sales: CustomerSale[];
  totalAmount: number;
  totalPurchases: number;
  lastPurchaseDate?: Date;
}

export interface CustomerSale {
  id: string;
  invoiceNumber: string;
  saleDate: Date;
  totalAmount: number;
  items: CustomerSaleItem[];
}

export interface CustomerSaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  topCustomers: TopCustomer[];
}

export interface TopCustomer {
  id: string;
  name: string;
  totalPurchases: number;
  lastPurchase: Date;
}