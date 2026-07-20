export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  sizes?: { label: string; price: number }[];
  emoji: string;
  category: string;
}

export interface CartItem {
  id: string; // unique cart entry key, e.g., "fries-M"
  menuItemId: string;
  name: string;
  description: string;
  emoji: string;
  sizeLabel?: string;
  unitPrice: number;
  quantity: number;
}

export interface UserSession {
  name: string;
  phone: string;
  email: string;
  token: string;
  consent: boolean;
  tableNumber: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  tableNumber: string;
  items: {
    id: string;
    menuItemId?: string;
    name: string;
    sizeLabel?: string;
    unitPrice: number;
    quantity: number;
    emoji: string;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Preparing' | 'Ready for Pickup' | 'Completed';
  paymentStatus: 'Pay at Counter' | 'Paid';
  timestamp: string;
}

export type MenuCategory = 'Popular' | 'Burgers' | 'Sides' | 'Drinks' | 'Desserts';
