export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetSex = 'male' | 'female' | 'unknown';

export interface Pet {
  id: string; // UUID
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  date_of_birth: string | null; // YYYY-MM-DD
  weight_kg: string | null;
  is_neutered: boolean;
  microchip_number: string;
  notes: string;
  owner: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface PetCreatePayload {
  name: string;
  species: PetSpecies;
  breed?: string;
  sex?: PetSex;
  date_of_birth?: string | null;
  weight_kg?: string | null;
  is_neutered?: boolean;
  microchip_number?: string;
  notes?: string;
}

export interface PetUpdatePayload extends Partial<PetCreatePayload> {}

export type DeviceStatus = 'registered' | 'paired' | 'unpaired' | 'revoked';
export type HardwareType = 'esp32_imu_collar' | 'simulator';

export interface Device {
  id: string; // UUID
  name: string;
  device_uid: string;
  hardware_type: HardwareType;
  firmware_version: string;
  status: DeviceStatus;
  pet: string | null;
  pet_name: string | null;
  is_connected: boolean;
  last_seen_at: string | null;
  battery_level: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceRegisterResponse extends Device {
  token?: string;
}

export interface TelemetryReading {
  id: string;
  device: string;
  device_uid: string;
  pet: string | null;
  pet_name: string | null;
  timestamp: string;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number | null;
  gyro_y: number | null;
  gyro_z: number | null;
  accel_magnitude: number;
  battery_level: number | null;
  rssi: number | null;
  is_simulation: boolean;
  received_at: string;
}

export interface ActivitySummary {
  id: string;
  pet: string;
  pet_name: string;
  window_start: string;
  window_end: string;
  total_samples: number;
  avg_acceleration: number;
  peak_acceleration: number;
  rest_minutes: number;
  active_minutes: number;
  high_intensity_minutes: number;
  dominant_state: 'resting' | 'walking' | 'running' | 'unknown';
  anomaly_detected: boolean;
  anomaly_reason: string;
  confidence_score: number;
  is_simulation: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  user: UserProfile;
  tokens: AuthTokens;
  message: string;
}

export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

export interface WeightRecord {
  id: string;
  pet: string;
  weight_kg: string;
  recorded_at: string;
  notes: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  pet: string;
  record_type: 'vaccination' | 'deworming' | 'medication' | 'lab_test' | 'checkup';
  title: string;
  administered_at: string;
  next_due_date: string | null;
  batch_number: string;
  veterinarian: string;
  clinic_name: string;
  notes: string;
  created_at: string;
}

export interface VetAppointment {
  id: string;
  pet: string;
  title: string;
  appointment_date: string;
  veterinarian: string;
  clinic_name: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}
