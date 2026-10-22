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
