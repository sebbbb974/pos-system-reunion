// Types pour le système de caisse - La Réunion

export interface Product {
  id: string;
  name: string;
  price: number;
  category: CategoryType;
  vatRate: VatRate;
  color?: string;
  icon?: string;
  stock?: number;
  minStock?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryType =
  | 'repas'
  | 'boissons'
  | 'boissons_alcool'
  | 'desserts'
  | 'sandwichs'
  | 'glaces'
  | 'formules'
  | 'snacks'
  | 'autres';

export interface Category {
  id: CategoryType;
  name: string;
  color: string;
  icon: string;
}

// TVA La Réunion (DOM-TOM)
// 2.1% = taux réduit (restauration, alimentaire)
// 8.5% = taux normal (alcool)
export type VatRate = 2.1 | 8.5;

export interface VatInfo {
  rate: VatRate;
  label: string;
  description: string;
}

// Informations sur les taux de TVA à La Réunion
export const VAT_RATES: Record<VatRate, VatInfo> = {
  2.1: {
    rate: 2.1,
    label: '2,1%',
    description: 'Taux réduit DOM (restauration, alimentaire)'
  },
  8.5: {
    rate: 8.5,
    label: '8,5%',
    description: 'Taux normal DOM (boissons alcoolisées)'
  }
};

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  vatAmount: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  totalVat: number;
  total: number;
  itemCount: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  totalVat: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  change?: number;
  timestamp: Date;
  employeeId?: string;
  employeeName?: string;
  receiptNumber: string;
}

export type PaymentMethod = 'cash' | 'card' | 'cheque' | 'ticket';

export interface DailySales {
  date: string;
  transactions: Transaction[];
  totalRevenue: number;
  totalVat: number;
  transactionCount: number;
  averageTicket: number;
  hourlyBreakdown: HourlySales[];
}

export interface HourlySales {
  hour: number;
  revenue: number;
  transactionCount: number;
  customerCount: number;
}

export interface TrafficAnalysis {
  peakHours: PeakHour[];
  recommendations: StaffRecommendation[];
  averageCustomersPerHour: number;
  busiestDay: string;
  quietestDay: string;
}

export interface PeakHour {
  hour: number;
  averageCustomers: number;
  averageRevenue: number;
  level: 'low' | 'medium' | 'high';
}

export interface StaffRecommendation {
  timeSlot: string;
  startHour: number;
  endHour: number;
  recommendedStaff: number;
  trafficLevel: 'low' | 'medium' | 'high';
  reason: string;
}

// Rôles utilisateur
export type UserRole = 'owner' | 'secretary' | 'employee';

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<UserRole, {
  label: string;
  canAccessDashboard: boolean;
  canAccessProducts: boolean;
  canAccessSettings: boolean;
  canAccessEmployees: boolean;
  canViewRemotely: boolean;
}> = {
  owner: {
    label: 'Patron',
    canAccessDashboard: true,
    canAccessProducts: true,
    canAccessSettings: true,
    canAccessEmployees: true,
    canViewRemotely: true
  },
  secretary: {
    label: 'Secrétaire',
    canAccessDashboard: true,
    canAccessProducts: true,
    canAccessSettings: false,
    canAccessEmployees: false,
    canViewRemotely: true
  },
  employee: {
    label: 'Employé',
    canAccessDashboard: false,
    canAccessProducts: false,
    canAccessSettings: false,
    canAccessEmployees: false,
    canViewRemotely: false
  }
};

export interface StockAlert {
  product: Product;
  currentStock: number;
  minStock: number;
  status: 'low' | 'critical' | 'out';
}

export interface DashboardStats {
  todayRevenue: number;
  todayTransactions: number;
  averageTicket: number;
  comparisonYesterday: number;
  topProducts: ProductSales[];
  stockAlerts: StockAlert[];
  hourlyData: HourlySales[];
}

export interface ProductSales {
  product: Product;
  quantitySold: number;
  revenue: number;
}

// État de l'application
export interface AppState {
  currentUser: User | null;
  selectedCategory: CategoryType | 'all';
  cart: Cart;
  isProcessingPayment: boolean;
  isAuthenticated: boolean;
}

// Pour le suivi en temps réel
export interface LiveStats {
  currentRevenue: number;
  transactionCount: number;
  lastTransaction?: Transaction;
  lastUpdate: Date;
}
