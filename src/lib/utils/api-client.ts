/**
 * Type-safe API client for consistent API communication
 */

import { handleApiResponse } from "@/lib/errors";
import type {
  ApiResponse,
  AuthResponse,
  LoginResponse,
  SignupResponse,
  CaseResponse,
  CaseListResponse,
  IntakeSaveResponse,
  CaseActionResponse,
  UserPreferencesResponse,
} from "@/types";

// API client configuration
interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || "",
      defaultHeaders: {
        "Content-Type": "application/json",
        ...config?.defaultHeaders,
      },
    };
  }

  /**
   * Make a typed API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...this.config.defaultHeaders,
        ...options.headers,
      },
      ...options,
    });

    return handleApiResponse<T>(response);
  }

  // Authentication endpoints
  async getAuthUser(): Promise<ApiResponse<AuthResponse>> {
    return this.request<ApiResponse<AuthResponse>>("/api/auth/me");
  }

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    return this.request<ApiResponse<LoginResponse>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(
    email: string,
    password: string
  ): Promise<ApiResponse<SignupResponse>> {
    return this.request<ApiResponse<SignupResponse>>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>("/api/auth/logout", {
      method: "POST",
    });
  }

  // Case endpoints
  async getCases(): Promise<ApiResponse<CaseListResponse>> {
    return this.request<ApiResponse<CaseListResponse>>("/api/cases");
  }

  async getCase(caseId: string): Promise<ApiResponse<CaseResponse>> {
    return this.request<ApiResponse<CaseResponse>>(`/api/cases/${caseId}`);
  }

  async deleteCase(caseId: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/api/cases/${caseId}`, {
      method: "DELETE",
    });
  }

  async saveIntake(
    caseId: string,
    intakeData: any
  ): Promise<ApiResponse<IntakeSaveResponse>> {
    return this.request<ApiResponse<IntakeSaveResponse>>(
      `/api/cases/${caseId}/intake/save`,
      {
        method: "POST",
        body: JSON.stringify(intakeData),
      }
    );
  }

  // Case action endpoints
  async transcribeCase(
    caseId: string
  ): Promise<ApiResponse<CaseActionResponse>> {
    return this.request<ApiResponse<CaseActionResponse>>(
      `/api/cases/${caseId}/transcribe`,
      {
        method: "POST",
      }
    );
  }

  async extractCase(caseId: string): Promise<ApiResponse<CaseActionResponse>> {
    return this.request<ApiResponse<CaseActionResponse>>(
      `/api/cases/${caseId}/extract`,
      {
        method: "POST",
      }
    );
  }

  async scoreCase(caseId: string): Promise<ApiResponse<CaseActionResponse>> {
    return this.request<ApiResponse<CaseActionResponse>>(
      `/api/cases/${caseId}/score`,
      {
        method: "POST",
      }
    );
  }

  async submitDecision(
    caseId: string
  ): Promise<ApiResponse<CaseActionResponse>> {
    return this.request<ApiResponse<CaseActionResponse>>(
      `/api/cases/${caseId}/submit`,
      {
        method: "POST",
      }
    );
  }

  // User preferences endpoints
  async getUserPreferences(): Promise<ApiResponse<UserPreferencesResponse>> {
    return this.request<ApiResponse<UserPreferencesResponse>>(
      "/api/user/preferences"
    );
  }

  async updateUserPreferences(
    preferences: Partial<UserPreferencesResponse>
  ): Promise<ApiResponse<UserPreferencesResponse>> {
    return this.request<ApiResponse<UserPreferencesResponse>>(
      "/api/user/preferences",
      {
        method: "POST",
        body: JSON.stringify(preferences),
      }
    );
  }
}

// Create and export a default API client instance
export const apiClient = new ApiClient();

// Export the class for custom instances
export { ApiClient };

// Convenience functions for common operations
export const authApi = {
  getCurrentUser: () => apiClient.getAuthUser(),
  login: (email: string, password: string) => apiClient.login(email, password),
  signup: (email: string, password: string) =>
    apiClient.signup(email, password),
  logout: () => apiClient.logout(),
};

export const caseApi = {
  getAll: () => apiClient.getCases(),
  getById: (id: string) => apiClient.getCase(id),
  delete: (id: string) => apiClient.deleteCase(id),
  saveIntake: (id: string, data: any) => apiClient.saveIntake(id, data),
  transcribe: (id: string) => apiClient.transcribeCase(id),
  extract: (id: string) => apiClient.extractCase(id),
  score: (id: string) => apiClient.scoreCase(id),
  submit: (id: string) => apiClient.submitDecision(id),
};

export const userApi = {
  getPreferences: () => apiClient.getUserPreferences(),
  updatePreferences: (preferences: Partial<UserPreferencesResponse>) =>
    apiClient.updateUserPreferences(preferences),
};
