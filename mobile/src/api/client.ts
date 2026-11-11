import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL, STORAGE_KEYS } from '../config';

class ApiClient {
  private baseUrl: string = DEFAULT_API_URL;
  private token: string | null = null;

  async init() {
    try {
      const storedUrl = await AsyncStorage.getItem(STORAGE_KEYS.API_URL);
      if (storedUrl) {
        this.baseUrl = storedUrl;
      }
      this.token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (e) {
      console.error('Error inicializando ApiClient:', e);
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.init();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || `Error del servidor (${response.status})`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutMsg = `Tiempo de espera agotado al conectar con el servidor (${url}). Verifica que el backend esté ejecutándose en la misma red Wi-Fi.`;
        console.error(`[API Timeout] ${options.method || 'GET'} ${url}`);
        throw new Error(timeoutMsg);
      }
      if (error.message?.includes('Network request failed')) {
        const netMsg = `No se pudo conectar al servidor en ${url}. Asegúrate de que el backend esté activo y el celular en la misma red Wi-Fi.`;
        console.error(`[API Network Failed] ${options.method || 'GET'} ${url}`);
        throw new Error(netMsg);
      }
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
      throw error;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  del<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

