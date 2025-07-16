interface UserSession {
  duz: string;
  htLocation: string;
  userName: string;
  password: string;
  name?: string;
}

const SESSION_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
let sessionTimer: NodeJS.Timeout | null = null;

export const getSession = (): UserSession | null => {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('userData');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const setSession = (data: {
  duz: string;
  htLocation: string;
  userName: string;
  password: string;
  name?: string;
}) => {
  if (typeof window === 'undefined') return;
  
  const userData = {
    duz: data.duz,
    htLocation: data.htLocation,
    userName: data.userName,
    password: data.password,
    name: data.name
  };
  
  localStorage.setItem('userData', JSON.stringify(userData));
  document.cookie = `isAuthenticated=true; path=/`;
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('userData');
  document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

export const initSessionTimeout = (onTimeout: () => void) => {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
  }
  sessionTimer = setTimeout(onTimeout, SESSION_TIMEOUT_MS);
};

export const resetSessionTimeout = (onTimeout: () => void) => {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
  }
  initSessionTimeout(onTimeout);
};

export const clearSessionTimeout = () => {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
  }
};
