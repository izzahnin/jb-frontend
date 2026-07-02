export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export type UserRole = 'super_admin' | 'admin_sales' | 'admin_ops' | 'demo';

export interface UserResponse {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  expires_at: number;
  user: UserResponse;
}

interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  expires_at?: number | string;
  user?: UserResponse;
  count?: number;
  total?: number;
  offset?: number;
  limit?: number;
}

export async function apiCall<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Block mutations for demo role
  if (options.method && options.method !== 'GET') {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.role === 'demo') throw new Error('Mode Demo: tidak dapat membuat perubahan.');
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('Mode Demo')) throw e;
        }
      }
    }
  }

  const url = `${API_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Use Headers API for proper typing
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Merge custom headers if provided
  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => headers.set(key, value));
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const hasSession = !!localStorage.getItem('token');
        if (hasSession) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
          window.location.href = '/login';
        }
      }
      throw new Error(data.error || 'Sesi berakhir. Silakan login kembali.');
    }

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Auth APIs
export async function login(username: string, password: string) {
  return apiCall<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return apiCall('/auth/logout', {
    method: 'POST',
  });
}

export async function setupAdmin(username: string, password: string) {
  return apiCall('/admin/setup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

// Users APIs
export async function getUsers() {
  return apiCall<UserResponse[]>('/admin/users', {
    method: 'GET',
  });
}

export async function createUser(
  username: string,
  password: string,
  role: UserRole,
  full_name?: string,
  is_active = true
) {
  return apiCall('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username, password, role, full_name, is_active }),
  });
}

export async function deleteUser(id: number) {
  return apiCall(`/admin/users/${id}`, { method: 'DELETE' });
}

export async function resetUserPassword(id: number, newPassword: string) {
  return apiCall(`/admin/users/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ new_password: newPassword }),
  });
}

export interface UpdateProfileRequest {
  full_name?: string;
  password?: string;
}

export async function updateProfile(payload: UpdateProfileRequest) {
  return apiCall<{ message: string; user: UserResponse }>('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// Customers APIs
export interface CustomerResponse {
  id: number;
  company_name: string;
  pic_name: string;
  phone: string;
  email: string;
  address: string;
  npwp: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  created_by_name?: string;
  updated_by_name?: string;
}

export async function getCustomers(limit = 100, offset = 0) {
  return apiCall<CustomerResponse[]>(`/admin/customers?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

export async function createCustomer(payload: Omit<CustomerResponse, 'id' | 'created_at' | 'is_active'>) {
  return apiCall<CustomerResponse>('/admin/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomer(
  id: number,
  payload: Partial<Omit<CustomerResponse, 'id' | 'created_at' | 'is_active'>>
) {
  return apiCall<CustomerResponse>(`/admin/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomer(id: number) {
  return apiCall(`/admin/customers/${id}`, {
    method: 'DELETE',
  });
}

export interface DriverResponse {
  id: number;
  name: string;
  license_number: string;
  phone: string;
  status: 'available' | 'on_duty' | 'off';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  created_by_name?: string;
  updated_by_name?: string;
}

export async function getDrivers(limit = 100, offset = 0) {
  return apiCall<DriverResponse[]>(`/admin/drivers?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
}

export async function createDriver(payload: Omit<DriverResponse, 'id'>) {
  return apiCall<DriverResponse>('/admin/drivers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDriver(id: number, payload: Partial<Omit<DriverResponse, 'id'>>) {
  return apiCall<DriverResponse>(`/admin/drivers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDriver(id: number) {
  return apiCall(`/admin/drivers/${id}`, {
    method: 'DELETE',
  });
}

// Trucks APIs
export interface TruckResponse {
  id: number;
  plate_number: string;
  truck_type: string;
  status: 'available' | 'on_duty' | 'maintenance';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  created_by_name?: string;
  updated_by_name?: string;
}

export async function getTrucks(offset = 0, limit = 100) {
  return apiCall<TruckResponse[]>(`/admin/trucks?offset=${offset}&limit=${limit}`, {
    method: 'GET',
  });
}

export async function getTruck(id: number) {
  return apiCall(`/admin/trucks/${id}`, {
    method: 'GET',
  });
}

export async function createTruck(
  plate_number: string,
  truck_type: string,
  status: 'available' | 'on_duty' | 'maintenance',
  is_active = true
) {
  return apiCall('/admin/trucks', {
    method: 'POST',
    body: JSON.stringify({ plate_number, truck_type, status, is_active }),
  });
}

export async function updateTruck(
  id: number,
  updates: Partial<Pick<TruckResponse, 'plate_number' | 'truck_type' | 'status' | 'is_active'>>
) {
  return apiCall<TruckResponse>(`/admin/trucks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteTruck(id: number) {
  return apiCall(`/admin/trucks/${id}`, {
    method: 'DELETE',
  });
}

// Orders APIs
export interface OrderResponse {
  id: number;
  order_number: string;
  customer_id: number;
  admin_id: number;
  origin: string;
  destination: string;
  total_containers: number;
  order_date: string;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export async function getOrders(offset = 0, limit = 10, status?: string) {
  let url = `/admin/orders?offset=${offset}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  return apiCall<OrderResponse[]>(url, {
    method: 'GET',
  });
}

export async function getOrder(id: number) {
  return apiCall(`/admin/orders/${id}`, {
    method: 'GET',
  });
}

export async function createOrder(
  customer_id: number,
  origin: string,
  destination: string,
  coords?: { origin_lat?: number; origin_lng?: number; dest_lat?: number; dest_lng?: number },
) {
  // order_number digenerate otomatis oleh DB trigger (format ORD-{id})
  // total_containers selalu 1 — 1 order = 1 kontainer (divalidasi backend)
  const cleanCoords = coords
    ? Object.fromEntries(Object.entries(coords).filter(([, v]) => v !== undefined && v !== null && !Number.isNaN(v)))
    : {};
  return apiCall('/admin/orders', {
    method: 'POST',
    body: JSON.stringify({ customer_id, origin, destination, total_containers: 1, ...cleanCoords }),
  });
}

export async function updateOrder(
  id: number,
  updates: { status: 'pending' | 'partial' | 'completed' | 'cancelled' }
) {
  return apiCall<OrderResponse>(`/admin/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteOrder(id: number) {
  return apiCall(`/admin/orders/${id}`, {
    method: 'DELETE',
  });
}

export interface TripResponse {
  id: number;
  order_id: number;
  truck_id: number;
  driver_id: number;
  trip_number: string;
  container_number: string;
  seal_number: string;
  status: 'pickup' | 'in_transit' | 'delivered' | 'cancelled';
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  started_by?: number;
  completed_by?: number;
  started_by_name?: string;
  completed_by_name?: string;
  truck_plate_number?: string;
  truck_is_active?: boolean;
  driver_name?: string;
}

export async function createTrip(payload: {
  order_id: number;
  truck_id: number;
  driver_id: number;
  // trip_number digenerate otomatis oleh DB trigger: TRIP-{zero-padded-id}
}) {
  return apiCall<TripResponse>('/admin/trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTripsByOrder(orderId: number) {
  return apiCall<TripResponse[]>(`/admin/orders/${orderId}/trips`, {
    method: 'GET',
  });
}

export async function getTrips() {
  return apiCall<TripResponse[]>('/admin/trips', {
    method: 'GET',
  });
}

export async function startTrip(id: number, payload: { container_number: string; seal_number: string }) {
  return apiCall(`/admin/trips/${id}/start`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deliverTrip(id: number) {
  return apiCall(`/admin/trips/${id}/deliver`, {
    method: 'PATCH',
  });
}

// Location APIs
export async function submitLocation(trip_id: number, lat: number, lon: number, speed?: number, ts?: string) {
  return apiCall(`/trips/${trip_id}/location`, {
    method: 'POST',
    body: JSON.stringify({ lat, lon, speed, ts: ts || new Date().toISOString() }),
  });
}

export async function getLatestLocation(trip_id: number) {
  return apiCall(`/trips/${trip_id}/location`, {
    method: 'GET',
  });
}

export async function getLocationHistory(trip_id: number, limit = 50) {
  return apiCall(`/trips/${trip_id}/locations?limit=${limit}`, {
    method: 'GET',
  });
}

// Public Tracking APIs
export interface TrackingLocation {
  id: number;
  trip_id: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface TrackingTripDetail {
  trip: TripResponse;
  latest_location: TrackingLocation | null;
  location_history: TrackingLocation[];
}

export async function trackOrder(order_number: string) {
  return apiCall(`/public/orders/${order_number}/track`, {
    method: 'GET',
  });
}

// Dashboard Stats API
export interface DashboardStatsResponse {
  total_orders: number;
  total_trucks: number;
  total_users: number;
  total_admins: number;
  active_trucks: number;
  order_breakdown: {
    pending: number;
    partial: number;
    completed: number;
    cancelled: number;
  };
}

export async function getDashboardStats() {
  return apiCall<DashboardStatsResponse>('/admin/dashboard/stats', {
    method: 'GET',
  });
}
