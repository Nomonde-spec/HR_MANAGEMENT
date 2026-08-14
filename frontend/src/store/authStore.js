import create from 'zustand';

const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  setAuth: (tokens, user) => {
	localStorage.setItem('accessToken', tokens.accessToken);
	localStorage.setItem('refreshToken', tokens.refreshToken || '');
	localStorage.setItem('user', JSON.stringify(user));
	set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
  },
  logout: () => {
	localStorage.removeItem('accessToken');
	localStorage.removeItem('refreshToken');
	localStorage.removeItem('user');
	set({ accessToken: null, refreshToken: null, user: null });
  }
}));

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('theme') === 'dark' || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  toggleTheme: () => {
    set((state) => {
      const newIsDark = !state.isDark;
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
      if (newIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDark: newIsDark };
    });
  },
  initTheme: () => {
    const isDark = localStorage.getItem('theme') === 'dark' || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    set({ isDark });
  }
}));

export default useAuthStore;
