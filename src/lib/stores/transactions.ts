import { writable, derived, get } from 'svelte/store';
import type { Transaction, DailySales, HourlySales, TrafficAnalysis, PeakHour, StaffRecommendation, ProductSales, DashboardStats, StockAlert } from '$lib/types';
import { productsStore } from './products';

// Store des transactions
function createTransactionsStore() {
  // Charger depuis localStorage si disponible
  const stored = typeof localStorage !== 'undefined'
    ? localStorage.getItem('pos_transactions')
    : null;

  const initial: Transaction[] = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable<Transaction[]>(initial);

  return {
    subscribe,

    // Ajouter une transaction
    add: (transaction: Transaction) => {
      update(transactions => {
        const updated = [...transactions, transaction];
        // Sauvegarder dans localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('pos_transactions', JSON.stringify(updated));
        }
        return updated;
      });
    },

    // Obtenir les transactions du jour
    getToday: (): Transaction[] => {
      const transactions = get({ subscribe });
      const today = new Date().toDateString();
      return transactions.filter(t => new Date(t.timestamp).toDateString() === today);
    },

    // Obtenir les transactions d'une date spécifique
    getByDate: (date: Date): Transaction[] => {
      const transactions = get({ subscribe });
      const dateStr = date.toDateString();
      return transactions.filter(t => new Date(t.timestamp).toDateString() === dateStr);
    },

    // Obtenir les transactions des N derniers jours
    getLastDays: (days: number): Transaction[] => {
      const transactions = get({ subscribe });
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return transactions.filter(t => new Date(t.timestamp) >= cutoff);
    },

    // Vider les transactions (pour tests)
    clear: () => {
      set([]);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pos_transactions');
      }
    },

    // Importer des données de démonstration
    importDemo: (transactions: Transaction[]) => {
      set(transactions);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pos_transactions', JSON.stringify(transactions));
      }
    }
  };
}

export const transactionsStore = createTransactionsStore();

// Store dérivé pour les statistiques du jour
export const todayStats = derived(transactionsStore, ($transactions): DashboardStats => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const todayTransactions = $transactions.filter(t =>
    new Date(t.timestamp).toDateString() === today
  );

  const yesterdayTransactions = $transactions.filter(t =>
    new Date(t.timestamp).toDateString() === yesterday
  );

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const yesterdayRevenue = yesterdayTransactions.reduce((sum, t) => sum + t.total, 0);

  const comparison = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
    : 0;

  // Calcul des ventes par heure
  const hourlyData = calculateHourlyData(todayTransactions);

  // Top produits
  const topProducts = calculateTopProducts(todayTransactions);

  // Alertes stock
  const stockAlerts = calculateStockAlerts();

  return {
    todayRevenue,
    todayTransactions: todayTransactions.length,
    averageTicket: todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0,
    comparisonYesterday: comparison,
    topProducts,
    stockAlerts,
    hourlyData
  };
});

// Calcul des données horaires
function calculateHourlyData(transactions: Transaction[]): HourlySales[] {
  const hourlyMap = new Map<number, HourlySales>();

  // Initialiser toutes les heures de 6h à 22h
  for (let h = 6; h <= 22; h++) {
    hourlyMap.set(h, {
      hour: h,
      revenue: 0,
      transactionCount: 0,
      customerCount: 0
    });
  }

  transactions.forEach(t => {
    const hour = new Date(t.timestamp).getHours();
    const existing = hourlyMap.get(hour);
    if (existing) {
      existing.revenue += t.total;
      existing.transactionCount += 1;
      existing.customerCount += 1;
    }
  });

  return Array.from(hourlyMap.values()).sort((a, b) => a.hour - b.hour);
}

// Calcul des top produits
function calculateTopProducts(transactions: Transaction[]): ProductSales[] {
  const productMap = new Map<string, ProductSales>();

  transactions.forEach(t => {
    t.items.forEach(item => {
      const existing = productMap.get(item.product.id);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += item.subtotal;
      } else {
        productMap.set(item.product.id, {
          product: item.product,
          quantitySold: item.quantity,
          revenue: item.subtotal
        });
      }
    });
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

// Calcul des alertes de stock
function calculateStockAlerts(): StockAlert[] {
  const products = get(productsStore);
  const alerts: StockAlert[] = [];

  products.forEach(product => {
    if (product.stock !== undefined && product.minStock !== undefined) {
      if (product.stock === 0) {
        alerts.push({
          product,
          currentStock: product.stock,
          minStock: product.minStock,
          status: 'out'
        });
      } else if (product.stock <= product.minStock) {
        alerts.push({
          product,
          currentStock: product.stock,
          minStock: product.minStock,
          status: product.stock <= product.minStock / 2 ? 'critical' : 'low'
        });
      }
    }
  });

  return alerts.sort((a, b) => {
    const priority = { out: 0, critical: 1, low: 2 };
    return priority[a.status] - priority[b.status];
  });
}

// Analyse du trafic pour les recommandations de personnel
export function analyzeTraffic(days: number = 7): TrafficAnalysis {
  const transactions = get(transactionsStore);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recentTransactions = transactions.filter(t => new Date(t.timestamp) >= cutoff);

  // Calcul des moyennes par heure
  const hourlyTotals = new Map<number, { customers: number; revenue: number; days: number }>();

  for (let h = 6; h <= 22; h++) {
    hourlyTotals.set(h, { customers: 0, revenue: 0, days: 0 });
  }

  // Grouper par jour et par heure
  const dayHourMap = new Map<string, Map<number, number>>();

  recentTransactions.forEach(t => {
    const date = new Date(t.timestamp);
    const dateKey = date.toDateString();
    const hour = date.getHours();

    if (!dayHourMap.has(dateKey)) {
      dayHourMap.set(dateKey, new Map());
    }
    const hourMap = dayHourMap.get(dateKey)!;
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  // Calculer les moyennes
  dayHourMap.forEach((hourMap, dateKey) => {
    hourMap.forEach((count, hour) => {
      const existing = hourlyTotals.get(hour);
      if (existing) {
        existing.customers += count;
        existing.days += 1;
      }
    });
  });

  // Générer les heures de pointe
  const peakHours: PeakHour[] = [];
  let maxCustomers = 0;

  hourlyTotals.forEach((data, hour) => {
    const avgCustomers = data.days > 0 ? data.customers / data.days : 0;
    if (avgCustomers > maxCustomers) maxCustomers = avgCustomers;

    peakHours.push({
      hour,
      averageCustomers: avgCustomers,
      averageRevenue: 0,
      level: 'low'
    });
  });

  // Déterminer les niveaux
  peakHours.forEach(ph => {
    if (ph.averageCustomers >= maxCustomers * 0.7) {
      ph.level = 'high';
    } else if (ph.averageCustomers >= maxCustomers * 0.4) {
      ph.level = 'medium';
    } else {
      ph.level = 'low';
    }
  });

  // Générer les recommandations de personnel
  const recommendations = generateStaffRecommendations(peakHours);

  // Jour le plus chargé / calme
  const dayTotals = new Map<string, number>();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  recentTransactions.forEach(t => {
    const dayName = dayNames[new Date(t.timestamp).getDay()];
    dayTotals.set(dayName, (dayTotals.get(dayName) || 0) + 1);
  });

  let busiestDay = 'N/A';
  let quietestDay = 'N/A';
  let maxDay = 0;
  let minDay = Infinity;

  dayTotals.forEach((count, day) => {
    if (count > maxDay) {
      maxDay = count;
      busiestDay = day;
    }
    if (count < minDay) {
      minDay = count;
      quietestDay = day;
    }
  });

  return {
    peakHours: peakHours.filter(ph => ph.hour >= 6 && ph.hour <= 22),
    recommendations,
    averageCustomersPerHour: peakHours.reduce((sum, ph) => sum + ph.averageCustomers, 0) / peakHours.length,
    busiestDay,
    quietestDay
  };
}

// Générer les recommandations de personnel
function generateStaffRecommendations(peakHours: PeakHour[]): StaffRecommendation[] {
  const recommendations: StaffRecommendation[] = [];

  // Grouper par niveau consécutif
  let currentLevel: 'low' | 'medium' | 'high' | null = null;
  let startHour = 0;

  peakHours.forEach((ph, index) => {
    if (ph.level !== currentLevel) {
      if (currentLevel !== null) {
        recommendations.push(createRecommendation(startHour, ph.hour, currentLevel));
      }
      currentLevel = ph.level;
      startHour = ph.hour;
    }

    // Dernier élément
    if (index === peakHours.length - 1 && currentLevel !== null) {
      recommendations.push(createRecommendation(startHour, ph.hour + 1, currentLevel));
    }
  });

  return recommendations;
}

function createRecommendation(start: number, end: number, level: 'low' | 'medium' | 'high'): StaffRecommendation {
  const staffCount = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  const reasons = {
    high: 'Forte affluence - Service rapide nécessaire',
    medium: 'Affluence modérée - Bon équilibre',
    low: 'Période calme - Personnel réduit possible'
  };

  return {
    timeSlot: `${start}h - ${end}h`,
    startHour: start,
    endHour: end,
    recommendedStaff: staffCount,
    trafficLevel: level,
    reason: reasons[level]
  };
}

// Générer des données de démonstration
export function generateDemoTransactions(): Transaction[] {
  const demoTransactions: Transaction[] = [];
  const products = get(productsStore);

  if (products.length === 0) return [];

  // Générer des transactions pour les 14 derniers jours
  for (let d = 0; d < 14; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);

    // Nombre de transactions selon le jour (plus le week-end)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseTransactions = isWeekend ? 80 : 60;
    const numTransactions = baseTransactions + Math.floor(Math.random() * 30);

    for (let t = 0; t < numTransactions; t++) {
      // Heure pondérée (plus de transactions à midi et le soir)
      const hour = getWeightedHour();
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(date);
      timestamp.setHours(hour, minute, 0, 0);

      // Générer 1 à 5 articles par transaction
      const numItems = 1 + Math.floor(Math.random() * 4);
      const items = [];
      let total = 0;
      let totalVat = 0;

      for (let i = 0; i < numItems; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = 1 + Math.floor(Math.random() * 2);
        const subtotal = product.price * quantity;
        const vatAmount = (subtotal * product.vatRate) / (100 + product.vatRate);

        items.push({
          product,
          quantity,
          subtotal,
          vatAmount
        });

        total += subtotal;
        totalVat += vatAmount;
      }

      const paymentMethod = Math.random() > 0.3 ? 'card' : 'cash';

      demoTransactions.push({
        id: `demo-${d}-${t}`,
        items,
        subtotal: total - totalVat,
        totalVat,
        total,
        paymentMethod: paymentMethod as any,
        cashGiven: paymentMethod === 'cash' ? Math.ceil(total / 5) * 5 : undefined,
        change: paymentMethod === 'cash' ? Math.ceil(total / 5) * 5 - total : undefined,
        timestamp,
        receiptNumber: `DEMO-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${t.toString().padStart(4, '0')}`
      });
    }
  }

  return demoTransactions;
}

// Obtenir une heure pondérée (plus de transactions à midi et le soir)
function getWeightedHour(): number {
  const weights = [
    { hour: 7, weight: 5 },
    { hour: 8, weight: 10 },
    { hour: 9, weight: 15 },
    { hour: 10, weight: 20 },
    { hour: 11, weight: 40 },
    { hour: 12, weight: 80 },
    { hour: 13, weight: 70 },
    { hour: 14, weight: 30 },
    { hour: 15, weight: 15 },
    { hour: 16, weight: 20 },
    { hour: 17, weight: 25 },
    { hour: 18, weight: 50 },
    { hour: 19, weight: 60 },
    { hour: 20, weight: 40 },
    { hour: 21, weight: 20 }
  ];

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const w of weights) {
    random -= w.weight;
    if (random <= 0) return w.hour;
  }

  return 12;
}
