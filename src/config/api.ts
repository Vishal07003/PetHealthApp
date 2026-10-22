import { Platform } from 'react-native';

// In development with an Android physical device or emulator using ADB reverse forwarding:
// `adb reverse tcp:8000 tcp:8000` maps device localhost (127.0.0.1:8000) directly to the host machine.
const DEV_API_URL = 'http://127.0.0.1:8000/api/v1';
const PRODUCTION_API_URL = 'https://api.pethealth.production/api/v1';

export const API_BASE_URL = __DEV__ ? DEV_API_URL :PRODUCTION_API_URL;

export const API_ENDPOINTS = {
  HEALTH: '/health/',
  AUTH_REGISTER: '/auth/register/',
  AUTH_LOGIN: '/auth/login/',
  AUTH_REFRESH: '/auth/refresh/',
  AUTH_ME: '/auth/me/',
  PETS: '/pets/',
  PET_DETAIL: (id: string) => `/pets/${id}/`,
  DEVICES: '/devices/',
  DEVICE_DETAIL: (id: string) => `/devices/${id}/`,
  DEVICE_PAIR: (id: string) => `/devices/${id}/pair/`,
  DEVICE_UNPAIR: (id: string) => `/devices/${id}/unpair/`,
  DEVICE_REVOKE: (id: string) => `/devices/${id}/revoke/`,
  TELEMETRY_INGEST: '/telemetry/ingest/',
  TELEMETRY_LIST: '/telemetry/',
  INSIGHTS_LIST: '/insights/',
  INSIGHTS_GENERATE: (petId: string) => `/insights/generate/${petId}/`,
};
