import { writable, derived, get } from 'svelte/store';
import type { User, UserRole, ROLE_PERMISSIONS } from '$lib/types';

// Utilisateurs par défaut
const defaultUsers: User[] = [
  {
    id: 'owner-001',
    name: 'Patron',
    pin: '1234',
    role: 'owner',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'secretary-001',
    name: 'Secrétaire',
    pin: '5678',
    role: 'secretary',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'employee-001',
    name: 'Marie',
    pin: '1111',
    role: 'employee',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'employee-002',
    name: 'Jean',
    pin: '2222',
    role: 'employee',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'employee-003',
    name: 'Paul',
    pin: '3333',
    role: 'employee',
    isActive: true,
    createdAt: new Date()
  }
];

// Store des utilisateurs
function createUsersStore() {
  const stored = typeof localStorage !== 'undefined'
    ? localStorage.getItem('pos_users')
    : null;

  const initial: User[] = stored ? JSON.parse(stored) : defaultUsers;

  const { subscribe, set, update } = writable<User[]>(initial);

  const save = (users: User[]) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pos_users', JSON.stringify(users));
    }
  };

  return {
    subscribe,

    add: (user: Omit<User, 'id' | 'createdAt'>) => {
      update(users => {
        const newUser: User = {
          ...user,
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date()
        };
        const updated = [...users, newUser];
        save(updated);
        return updated;
      });
    },

    update: (id: string, changes: Partial<User>) => {
      update(users => {
        const updated = users.map(u =>
          u.id === id ? { ...u, ...changes } : u
        );
        save(updated);
        return updated;
      });
    },

    delete: (id: string) => {
      update(users => {
        const updated = users.filter(u => u.id !== id);
        save(updated);
        return updated;
      });
    },

    toggleActive: (id: string) => {
      update(users => {
        const updated = users.map(u =>
          u.id === id ? { ...u, isActive: !u.isActive } : u
        );
        save(updated);
        return updated;
      });
    },

    reset: () => {
      set(defaultUsers);
      save(defaultUsers);
    },

    getByPin: (pin: string): User | undefined => {
      return get({ subscribe }).find(u => u.pin === pin && u.isActive);
    }
  };
}

export const usersStore = createUsersStore();

// Store de l'utilisateur connecté
function createAuthStore() {
  const stored = typeof localStorage !== 'undefined'
    ? localStorage.getItem('pos_current_user')
    : null;

  const initial: User | null = stored ? JSON.parse(stored) : null;

  const { subscribe, set } = writable<User | null>(initial);

  return {
    subscribe,

    login: (pin: string): { success: boolean; error?: string } => {
      const user = get(usersStore).find(u => u.pin === pin && u.isActive);

      if (!user) {
        return { success: false, error: 'Code PIN invalide' };
      }

      set(user);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pos_current_user', JSON.stringify(user));
      }

      return { success: true };
    },

    logout: () => {
      set(null);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pos_current_user');
      }
    },

    getCurrentUser: (): User | null => {
      return get({ subscribe });
    }
  };
}

export const authStore = createAuthStore();

// Store dérivé pour les permissions
export const currentPermissions = derived(authStore, ($user) => {
  if (!$user) {
    return null;
  }

  const permissions: Record<UserRole, {
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

  return permissions[$user.role];
});

// Store dérivé pour savoir si l'utilisateur est connecté
export const isAuthenticated = derived(authStore, ($user) => $user !== null);

// Store dérivé pour le rôle actuel
export const currentRole = derived(authStore, ($user) => $user?.role || null);

// Fonction utilitaire pour vérifier une permission
export function hasPermission(permission: keyof typeof ROLE_PERMISSIONS['owner']): boolean {
  const user = get(authStore);
  if (!user) return false;

  const perms = get(currentPermissions);
  return perms ? perms[permission] : false;
}
