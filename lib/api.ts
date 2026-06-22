export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  expires_at?: number | string;
  user_id?: number;
  username?: string;
  count?: number;
  total?: number;
  offset?: number;
  limit?: number;
}

export async function apiCall<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
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
  return apiCall('/auth/login', {
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
interface UserResponse {
  id: number;
  username: string;
  role: 'admin' | 'customer';
  is_active: boolean;
  created_at: string;
}

export async function getUsers() {
  return apiCall<UserResponse[]>('/admin/users', {
    method: 'GET',
  });
}

export async function createUser(username: string, password: string, role: 'admin' | 'customer' = 'customer', is_active = true) {
  return apiCall('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username, password, role, is_active }),
  });
}

// Trucks APIs
interface TruckResponse {
  id: number;
  plate_number: string;
  driver_name: string;
  status: string;
  created_at: string;
}

export async function getTrucks(offset = 0, limit = 10) {
  return apiCall<TruckResponse[]>(`/admin/trucks?offset=${offset}&limit=${limit}`, {
    method: 'GET',
  });
}

export async function getTruck(id: number) {
  return apiCall(`/admin/trucks/${id}`, {
    method: 'GET',
  });
}

export async function createTruck(plate_number: string, driver_name: string) {
  return apiCall('/admin/trucks', {
    method: 'POST',
    body: JSON.stringify({ plate_number, driver_name }),
  });
}

export async function updateTruck(
  id: number,
  updates: Partial<Pick<TruckResponse, 'plate_number' | 'driver_name'>>
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
interface OrderResponse {
  id: number;
  order_number: string;
  origin: string;
  destination: string;
  description: string;
  quantity: number;
  status: string;
  truck_id: number | null;
  created_at: string;
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

export async function createOrder(order_number: string, origin: string, destination: string, description: string, quantity: number) {
  return apiCall('/admin/orders', {
    method: 'POST',
    body: JSON.stringify({ order_number, origin, destination, description, quantity }),
  });
}

export async function updateOrder(
  id: number,
  updates: Partial<Pick<OrderResponse, 'origin' | 'destination' | 'quantity'>>
) {
  return apiCall<OrderResponse>(`/admin/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteOrder(id: number) {
  return apiCall(`/admin/orders/${id}`, {
    method: 'DELETE',
  });
}

export async function assignTruckToOrder(id: number, truck_id: number) {
  return apiCall(`/admin/orders/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ truck_id }),
  });
}

export async function confirmPickup(id: number) {
  return apiCall(`/admin/orders/${id}/confirm-pickup`, {
    method: 'PUT',
  });
}

export async function confirmDelivery(id: number) {
  return apiCall(`/admin/orders/${id}/confirm-delivery`, {
    method: 'PUT',
  });
}

// Location APIs
export async function submitLocation(truck_id: number, latitude: number, longitude: number, timestamp?: string) {
  return apiCall('/locations', {
    method: 'POST',
    body: JSON.stringify({ truck_id, latitude, longitude, timestamp: timestamp || new Date().toISOString() }),
  });
}

export async function getLatestLocation(truck_id: number) {
  return apiCall(`/locations/${truck_id}/latest`, {
    method: 'GET',
  });
}

export async function getLocationHistory(truck_id: number, offset = 0, limit = 50) {
  return apiCall(`/locations/${truck_id}/history?offset=${offset}&limit=${limit}`, {
    method: 'GET',
  });
}

// Public Tracking APIs
export async function trackOrder(order_number: string) {
  return apiCall(`/public/orders/${order_number}/track`, {
    method: 'GET',
  });
}
