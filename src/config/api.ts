import { Platform } from 'react-native';

// Target PC backend IP and port for local testing:
export const API_HOST_IP = '192.168.31.8';
export const API_PORT = '8000';
export const BACKEND_BASE_URL = `http://${API_HOST_IP}:${API_PORT}`;
export const API_BASE_URL = `${BACKEND_BASE_URL}/api/v1`;

// DEV_API_URL and PRODUCTION_API_URL point to the active backend for consistency across all build variants
export const DEV_API_URL = API_BASE_URL;
export const PRODUCTION_API_URL = API_BASE_URL;

export const API_ENDPOINTS = {
  HEALTH: '/health/',
  AUTH_REGISTER: '/auth/register/',
  AUTH_LOGIN: '/auth/login/',
  AUTH_REFRESH: '/auth/refresh/',
  AUTH_ME: '/auth/me/',
  PETS: '/pets/',
  PET_DETAIL: (id: string) => `/pets/${id}/`,
  WEIGHTS: '/pets/weights/',
  BCS: '/pets/bcs/',
  OBSERVATIONS: '/pets/observations/',
  FOOD_WATER: '/pets/food-water/',
  FOOD_WATER_DAILY_TOTALS: '/pets/food-water/daily-totals/',
  MEDICAL_RECORDS: '/pets/medical-records/',
  APPOINTMENTS: '/pets/appointments/',
  DEVICES: '/devices/',
  DEVICE_DETAIL: (id: string) => `/devices/${id}/`,
  DEVICE_PAIR: (id: string) => `/devices/${id}/pair/`,
  DEVICE_UNPAIR: (id: string) => `/devices/${id}/unpair/`,
  DEVICE_REVOKE: (id: string) => `/devices/${id}/revoke/`,
  TELEMETRY_INGEST: '/telemetry/ingest/',
  TELEMETRY_LIST: '/telemetry/',
  INSIGHTS_LIST: '/insights/',
  INSIGHTS_GENERATE: (petId: string) => `/insights/generate/${petId}/`,
  INSIGHTS_PET_ANALYTICS: (petId: string) => `/insights/pet/${petId}/analytics/`,
  NOTIFICATIONS: '/notifications/',
  NOTIFICATION_MARK_READ: (id: string) => `/notifications/${id}/mark-read/`,
  NOTIFICATION_MARK_ALL_READ: '/notifications/mark-all-read/',
  NOTIFICATION_REGISTER_DEVICE: '/notifications/devices/register/',
  NOTIFICATION_UNREGISTER_DEVICE: '/notifications/devices/unregister/',
};

