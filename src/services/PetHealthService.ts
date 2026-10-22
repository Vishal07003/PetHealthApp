import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { TokenStorage } from './TokenStorage';
import {
  UserProfile,
  LoginResponse,
  RegisterResponse,
  Pet,
  PetCreatePayload,
  PetUpdatePayload,
  Device,
  HardwareType,
  DeviceRegisterResponse,
  TelemetryReading,
  ActivitySummary,
} from '../types/api';

export const AuthService = {
  async register(payload: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
  }): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.AUTH_REGISTER,
      payload
    );
    if (response.data.tokens) {
      await TokenStorage.saveTokens(response.data.tokens);
    }
    return response.data;
  },

  async login(payload: { username: string; password: string }): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH_LOGIN,
      payload
    );
    if (response.data.access && response.data.refresh) {
      await TokenStorage.saveTokens({
        access: response.data.access,
        refresh: response.data.refresh,
      });
    }
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(API_ENDPOINTS.AUTH_ME);
    return response.data;
  },

  async updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>(API_ENDPOINTS.AUTH_ME, payload);
    return response.data;
  },

  async logout(): Promise<void> {
    await TokenStorage.clearTokens();
  },
};

export const PetService = {
  async listPets(): Promise<Pet[]> {
    const response = await apiClient.get<Pet[]>(API_ENDPOINTS.PETS);
    return response.data;
  },

  async getPet(id: string): Promise<Pet> {
    const response = await apiClient.get<Pet>(API_ENDPOINTS.PET_DETAIL(id));
    return response.data;
  },

  async createPet(payload: PetCreatePayload): Promise<Pet> {
    const response = await apiClient.post<Pet>(API_ENDPOINTS.PETS, payload);
    return response.data;
  },

  async updatePet(id: string, payload: PetUpdatePayload): Promise<Pet> {
    const response = await apiClient.patch<Pet>(API_ENDPOINTS.PET_DETAIL(id), payload);
    return response.data;
  },

  async deletePet(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PET_DETAIL(id));
  },
};

export const DeviceService = {
  async listDevices(): Promise<Device[]> {
    const response = await apiClient.get<Device[]>(API_ENDPOINTS.DEVICES);
    return response.data;
  },

  async registerDevice(payload: {
    name: string;
    device_uid: string;
    hardware_type: HardwareType;
    firmware_version?: string;
  }): Promise<DeviceRegisterResponse> {
    const response = await apiClient.post<DeviceRegisterResponse>(API_ENDPOINTS.DEVICES, payload);
    return response.data;
  },

  async pairDevice(deviceId: string, petId: string): Promise<Device> {
    const response = await apiClient.post<Device>(API_ENDPOINTS.DEVICE_PAIR(deviceId), {
      pet_id: petId,
    });
    return response.data;
  },

  async unpairDevice(deviceId: string): Promise<Device> {
    const response = await apiClient.post<Device>(API_ENDPOINTS.DEVICE_UNPAIR(deviceId));
    return response.data;
  },

  async revokeDevice(deviceId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.DEVICE_REVOKE(deviceId));
  },
};

export const TelemetryService = {
  async listReadings(petId?: string): Promise<TelemetryReading[]> {
    const url = petId ? `${API_ENDPOINTS.TELEMETRY_LIST}?pet_id=${petId}` : API_ENDPOINTS.TELEMETRY_LIST;
    const response = await apiClient.get<TelemetryReading[]>(url);
    return response.data;
  },

  async ingestReadings(
    deviceUid: string,
    deviceKey: string,
    readings: Array<{
      accel_x: number;
      accel_y: number;
      accel_z: number;
      gyro_x?: number | null;
      gyro_y?: number | null;
      gyro_z?: number | null;
      battery_level?: number;
      rssi?: number;
      timestamp?: string;
    }>,
    isSimulation = true
  ) {
    const response = await apiClient.post(
      API_ENDPOINTS.TELEMETRY_INGEST,
      { readings, is_simulation: isSimulation },
      {
        headers: {
          'X-Device-UID': deviceUid,
          'X-Device-Key': deviceKey,
        },
      }
    );
    return response.data;
  },
};

export const InsightsService = {
  async listSummaries(petId?: string): Promise<ActivitySummary[]> {
    const url = petId ? `${API_ENDPOINTS.INSIGHTS_LIST}?pet_id=${petId}` : API_ENDPOINTS.INSIGHTS_LIST;
    const response = await apiClient.get<ActivitySummary[]>(url);
    return response.data;
  },

  async generateInsights(petId: string): Promise<ActivitySummary> {
    const response = await apiClient.post<ActivitySummary>(API_ENDPOINTS.INSIGHTS_GENERATE(petId));
    return response.data;
  },
};
