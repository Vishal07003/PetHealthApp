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
