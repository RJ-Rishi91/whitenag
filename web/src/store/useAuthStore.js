import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  hasPermission: (permission) => {
    const user = get().user;
    if (!user || !user.role) return false;
    if (user.role.code === 'ADMIN' || (user.role.permissions && user.role.permissions.includes('*'))) {
      return true;
    }
    return user.role.permissions && user.role.permissions.includes(permission);
  }
}));
