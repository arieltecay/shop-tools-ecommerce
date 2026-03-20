export interface IAdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'readonly';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  uuid: string;
  name: string;
  slug: string;
  parent?: string | ICategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrand {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductImage {
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IPriceHistory {
  previousPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: Date;
}

export interface IProduct {
  _id: string;
  uuid: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  category: {
    _id: string;
    uuid: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    _id: string;
    uuid: string;
    name: string;
    slug: string;
  };
  brand: {
    _id: string;
    name: string;
  };
  images: IProductImage[];
  costPrice: number;
  price: number;
  priceHistory: IPriceHistory[];
  stock: number;
  minStock: number;
  weight?: number;
  dimensions?: {
    height: number;
    width: number;
    length: number;
  };
  status: 'active' | 'paused' | 'draft' | 'out_of_stock';
  isFeatured: boolean;
  tags: string[];
  salesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomer {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  idNumber?: string;
  defaultAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  origin: 'online' | 'manual';
  whatsappConsent: boolean;
  orders: string[];
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: Date;
  internalNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  product: {
    _id: string;
    uuid: string;
    sku: string;
    name: string;
    primaryImageUrl: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  status: 'pending_payment' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested';
  statusHistory: {
    status: string;
    changedBy: string;
    changedAt: Date;
    note?: string;
  }[];
  customer: {
    fullName: string;
    email: string;
    phone: string;
    idNumber?: string;
    customerId?: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  items: IOrderItem[];
  pricing: {
    subtotal: number;
    discountCode?: string;
    discountAmount: number;
    shippingCost: number;
    total: number;
  };
  shipping: {
    method?: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    pickupLocation?: string;
  };
  payment: {
    method: 'card' | 'bank_transfer';
    gateway?: string;
    status: 'pending' | 'approved' | 'rejected';
    gatewayTransactionId?: string;
    installments?: number;
    confirmedBy?: string;
    confirmedAt?: Date;
    paidAt?: Date;
  };
  whatsappConsent: boolean;
  source: 'storefront' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupplier {
  _id: string;
  name: string;
  taxId: string;
  contact: {
    phone: string;
    email: string;
  };
  defaultPaymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseInvoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  supplier: {
    _id: string;
    name: string;
  };
  invoiceType: 'A' | 'B' | 'C' | 'delivery_note';
  paymentTerms: 'cash' | '30_days' | '60_days';
  items: {
    product: {
      _id: string;
      uuid: string;
      sku: string;
      name: string;
    };
    quantity: number;
    unitCost: number;
    subtotal: number;
  }[];
  totalAmount: number;
  attachmentUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStockMovement {
  _id: string;
  product: {
    _id: string;
    uuid: string;
    sku: string;
    name: string;
  };
  type: 'purchase' | 'sale' | 'adjustment' | 'return';
  quantity: number;
  reason?: string;
  reference?: {
    type: 'invoice' | 'order' | 'manual';
    id: string;
  };
  stockAfter: number;
  createdBy?: string;
  createdAt: Date;
}

export interface IDiscountCode {
  _id: string;
  code: string;
  internalDescription?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUsageTotal?: number;
  maxUsagePerEmail?: number;
  usageCount: number;
  usageLog: {
    email: string;
    orderId: string;
    usedAt: Date;
  }[];
  validFrom: Date;
  validUntil?: Date;
  applicableCategories: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettings {
  _id: string;
  store: {
    name: string;
    logoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
  };
  payment: {
    gateway: {
      provider: 'decidir' | 'payway';
      publicKey: string;
    };
    bankTransfer: {
      isEnabled: boolean;
      holderName: string;
      cbu: string;
      alias: string;
      bank: string;
      taxId: string;
      accountType: string;
      additionalInstructions?: string;
    };
    installments: { count: number; surchargePercent: number }[];
    minAmountForInstallments: number;
  };
  notifications: {
    adminEmails: string[];
    emailEvents: {
      newOrder: boolean;
      lowStock: boolean;
      newReturn: boolean;
    };
    whatsapp: {
      isEnabled: boolean;
      provider: 'meta' | 'twilio';
      phoneNumber: string;
    };
  };
  afterSales: {
    reviewEmailDaysAfterDelivery: number;
  };
  stock: {
    autoPauseOnZero: boolean;
  };
  updatedAt: Date;
}
