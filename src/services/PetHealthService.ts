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
  WeightRecord,
  MedicalRecord,
  VetAppointment,
  BodyConditionScore,
  ClinicalObservation,
  ObservationCategory,
  FoodWaterLog,
  IntakeType,
  IntakeUnit,
  DailyIntakeTotalsResponse,
  AppNotification,
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
    if (payload.photo && typeof payload.photo === 'object' && payload.photo.uri) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (key === 'photo') {
          formData.append('photo', {
            uri: val.uri,
            type: val.type || 'image/jpeg',
            name: val.fileName || 'pet_photo.jpg',
          } as any);
        } else if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
      const response = await apiClient.post<Pet>(API_ENDPOINTS.PETS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await apiClient.post<Pet>(API_ENDPOINTS.PETS, payload);
    return response.data;
  },

  async updatePet(id: string, payload: PetUpdatePayload): Promise<Pet> {
    if (payload.photo && typeof payload.photo === 'object' && payload.photo.uri) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (key === 'photo') {
          const photoObj = val as any;
          formData.append('photo', {
            uri: photoObj.uri,
            type: photoObj.type || 'image/jpeg',
            name: photoObj.fileName || 'pet_photo.jpg',
          } as any);
        } else if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
      const response = await apiClient.patch<Pet>(API_ENDPOINTS.PET_DETAIL(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await apiClient.patch<Pet>(API_ENDPOINTS.PET_DETAIL(id), payload);
    return response.data;
  },

  async deletePet(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PET_DETAIL(id));
  },
};

export const ClinicalService = {
  async listWeights(petId?: string): Promise<WeightRecord[]> {
    const url = petId ? `${API_ENDPOINTS.WEIGHTS}?pet_id=${petId}` : API_ENDPOINTS.WEIGHTS;
    const response = await apiClient.get<WeightRecord[]>(url);
    return response.data;
  },

  async addWeight(petId: string, weightKg: number, notes?: string): Promise<WeightRecord> {
    const response = await apiClient.post<WeightRecord>(API_ENDPOINTS.WEIGHTS, {
      pet: petId,
      weight_kg: weightKg,
      notes: notes || '',
    });
    return response.data;
  },

  async listMedicalRecords(petId?: string): Promise<MedicalRecord[]> {
    const url = petId ? `${API_ENDPOINTS.MEDICAL_RECORDS}?pet_id=${petId}` : API_ENDPOINTS.MEDICAL_RECORDS;
    const response = await apiClient.get<MedicalRecord[]>(url);
    return response.data;
  },

  async addMedicalRecord(payload: {
    pet: string;
    record_type: 'vaccination' | 'deworming' | 'medication' | 'lab_test' | 'checkup';
    title: string;
    administered_at: string;
    next_due_date?: string | null;
    batch_number?: string;
    veterinarian?: string;
    clinic_name?: string;
    notes?: string;
  }): Promise<MedicalRecord> {
    const response = await apiClient.post<MedicalRecord>(API_ENDPOINTS.MEDICAL_RECORDS, payload);
    return response.data;
  },

  async listAppointments(petId?: string): Promise<VetAppointment[]> {
    const url = petId ? `${API_ENDPOINTS.APPOINTMENTS}?pet_id=${petId}` : API_ENDPOINTS.APPOINTMENTS;
    const response = await apiClient.get<VetAppointment[]>(url);
    return response.data;
  },

  async addAppointment(payload: {
    pet: string;
    title: string;
    appointment_date: string;
    veterinarian?: string;
    clinic_name?: string;
    reason?: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
  }): Promise<VetAppointment> {
    const response = await apiClient.post<VetAppointment>(API_ENDPOINTS.APPOINTMENTS, payload);
    return response.data;
  },

  async listBCS(petId?: string): Promise<BodyConditionScore[]> {
    const url = petId ? `${API_ENDPOINTS.BCS}?pet_id=${petId}` : API_ENDPOINTS.BCS;
    const response = await apiClient.get<BodyConditionScore[]>(url);
    return response.data;
  },

  async addBCS(payload: {
    pet: string;
    score: number;
    assessor_source?: string;
    palpation_notes?: string;
    silhouette_notes?: string;
    recorded_at?: string;
  }): Promise<BodyConditionScore> {
    const response = await apiClient.post<BodyConditionScore>(API_ENDPOINTS.BCS, payload);
    return response.data;
  },

  async listObservations(petId?: string, category?: string): Promise<ClinicalObservation[]> {
    let url = API_ENDPOINTS.OBSERVATIONS;
    const params: string[] = [];
    if (petId) params.push(`pet_id=${petId}`);
    if (category) params.push(`category=${category}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await apiClient.get<ClinicalObservation[]>(url);
    return response.data;
  },

  async addObservation(payload: {
    pet: string;
    category: ObservationCategory;
    headline: string;
    details: string;
    is_shared_with_vet?: boolean;
    observed_at?: string;
  }): Promise<ClinicalObservation> {
    const response = await apiClient.post<ClinicalObservation>(API_ENDPOINTS.OBSERVATIONS, payload);
    return response.data;
  },

  async listFoodWaterLogs(petId?: string, intakeType?: IntakeType): Promise<FoodWaterLog[]> {
    let url = API_ENDPOINTS.FOOD_WATER;
    const params: string[] = [];
    if (petId) params.push(`pet_id=${petId}`);
    if (intakeType) params.push(`intake_type=${intakeType}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await apiClient.get<FoodWaterLog[]>(url);
    return response.data;
  },

  async addFoodWaterLog(payload: {
    pet: string;
    intake_type: IntakeType;
    amount: string | number;
    unit: IntakeUnit;
    logged_at?: string;
    notes?: string;
  }): Promise<FoodWaterLog> {
    const response = await apiClient.post<FoodWaterLog>(API_ENDPOINTS.FOOD_WATER, payload);
    return response.data;
  },

  async getDailyIntakeTotals(petId?: string, dateStr?: string): Promise<DailyIntakeTotalsResponse> {
    let url = API_ENDPOINTS.FOOD_WATER_DAILY_TOTALS;
    const params: string[] = [];
    if (petId) params.push(`pet_id=${petId}`);
    if (dateStr) params.push(`date=${dateStr}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await apiClient.get<DailyIntakeTotalsResponse>(url);
    return response.data;
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

export const NotificationService = {
  async listNotifications(petId?: string, isRead?: boolean): Promise<AppNotification[]> {
    let url = API_ENDPOINTS.NOTIFICATIONS;
    const params: string[] = [];
    if (petId) params.push(`pet_id=${petId}`);
    if (isRead !== undefined) params.push(`is_read=${isRead}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await apiClient.get<AppNotification[]>(url);
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<AppNotification> {
    const response = await apiClient.post<AppNotification>(API_ENDPOINTS.NOTIFICATION_MARK_READ(notificationId));
    return response.data;
  },

  async markAllAsRead(): Promise<{ status: string; marked_read_count: number }> {
    const response = await apiClient.post<{ status: string; marked_read_count: number }>(
      API_ENDPOINTS.NOTIFICATION_MARK_ALL_READ
    );
    return response.data;
  },

  async registerDeviceToken(token: string, platform: 'android' | 'ios' = 'android', deviceName = ''): Promise<void> {
    await apiClient.post(API_ENDPOINTS.NOTIFICATION_REGISTER_DEVICE, {
      token,
      platform,
      device_name: deviceName,
    });
  },

  async unregisterDeviceToken(token: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.NOTIFICATION_UNREGISTER_DEVICE, {
      token,
    });
  },
};

