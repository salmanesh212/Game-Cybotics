export const isDev = import.meta.env.DEV;
const env = import.meta.env as ImportMetaEnv & {
  VITE_API_BASE_URL?: string;
  VITE_SOCKET_URL?: string;
  VITE_PUBLIC_GAME_URL?: string;
};

const localServerOrigin = `${window.location.protocol}//${window.location.hostname}:3000`;

export const API_BASE_URL = (env.VITE_API_BASE_URL || (isDev ? `${localServerOrigin}/api` : '/api')).replace(/\/$/, '');
export const SOCKET_URL = env.VITE_SOCKET_URL || (isDev ? localServerOrigin : window.location.origin);
export const PUBLIC_GAME_URL = env.VITE_PUBLIC_GAME_URL || window.location.origin;
