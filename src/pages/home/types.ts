export interface ProductImage {
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Category {
  _id: string;
  uuid: string;
  name: string;
  slug: string;
}

export interface Brand {
  _id: string;
  name: string;
}

export interface Product {
  _id: string;
  uuid: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: ProductImage[];
  category: Category;
  brand: Brand;
  shortDescription?: string;
}

export interface HeroSlide {
  _id: string;
  productUuid: string;
  title: string;
  subtitle?: string;
  buttonText: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor: string;
  product: Product;
}

export interface ProductsResponse {
  products: Product[];
  total?: number;
}
