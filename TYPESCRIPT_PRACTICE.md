/**
 * TYPESCRIPT BEST PRACTICE - Error Handling & Type Safety
 * 
 * Problem & Solution untuk: "argument of type '{}' is not assignable"
 */

// ============================================================================
// 1️⃣ MASALAH: Response Data Typing
// ============================================================================

/**
 * ❌ MASALAH: ApiResponse<T> pakai optional data, jadi kalau tidak specify T,
 * compiler tidak tahu type data
 */
interface ApiResponse<T> {
  data?: T;  // T bisa apa saja kalau tidak di-specify
}

// Kalau dipanggil tanpa generic:
// const response = await apiCall(...);  // T = unknown
// response.data  // Type = unknown - tidak bisa assign ke Order[]

// ============================================================================
// 2️⃣ SOLUSI: Specify Generic at Call Site (INDUSTRY STANDARD)
// ============================================================================

/**
 * Cara yang benar - SPESIFIK generic type saat mendeklarasikan function
 * Ini yang digunakan oleh:
 * - React Query / SWR
 * - Axios
 * - Fetch wrappers di perusahaan besar
 */

// lib/api.ts
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

// ✅ BENAR: Specify generic type dalam function
export async function getOrders(offset = 0, limit = 10, status?: string) {
  let url = `/admin/orders?offset=${offset}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  // Specify type di sini! OrderResponse[]
  return apiCall<OrderResponse[]>(url, {
    method: 'GET',
  });
  // Return type: ApiResponse<OrderResponse[]>
  // response.data type: OrderResponse[] | undefined
}

// pages/orders.tsx
const loadOrders = async () => {
  const response = await getOrders(0, 100);
  // ✅ response.data adalah OrderResponse[] | undefined
  setOrders(response.data || []);  // TypeScript HAPPY - tidak ada error
};

// ============================================================================
// 3️⃣ ERROR HANDLING: Cara yang BENAR
// ============================================================================

/**
 * ❌ SALAH - Menggunakan 'any'
 */
try {
  // ...
} catch (err: any) {  // ❌ any = tidak type-safe
  setError(err.message || 'Error');
}

/**
 * ❌ SALAH - Menggunakan type assertion
 */
try {
  // ...
} catch (err as Error) {  // ❌ Sama dengan any, tidak safe
  setError(err.message);
}

/**
 * ✅ BENAR - Menggunakan unknown + type guard
 * Ini standar di industri, contoh:
 * - Node.js documentation
 * - TypeScript handbook
 * - Major libraries (lodash, etc)
 */
try {
  await someAsyncFunction();
} catch (err: unknown) {
  // err bisa apa saja - string, Error object, object lain, null, undefined
  
  // Common pattern:
  if (err instanceof Error) {
    // Sekarang TypeScript tahu err adalah Error instance
    setError(err.message);
  } else {
    setError('An unexpected error occurred');
  }
}

// Kalau ingin lebih detail:
catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else if (typeof err === 'string') {
    setError(err);
  } else if (err && typeof err === 'object' && 'message' in err) {
    setError((err as { message: string }).message);
  } else {
    setError('An unexpected error occurred');
  }
}

// ============================================================================
// 4️⃣ CONTOH LENGKAP - Best Practice
// ============================================================================

// lib/api.ts
interface UserResponse {
  id: number;
  username: string;
  role: 'admin' | 'customer';
  is_active: boolean;
  created_at: string;
}

export async function getUsers() {
  // ✅ Specify generic: UserResponse[]
  return apiCall<UserResponse[]>('/admin/users', {
    method: 'GET',
  });
}

// app/users/page.tsx
const loadUsers = async () => {
  setLoading(true);
  try {
    const response = await getUsers();
    // response.data adalah UserResponse[] | undefined
    // Compiler TAHU type-nya, tidak ada error!
    setUsers(response.data || []);
  } catch (err: unknown) {
    // ✅ Type-safe error handling
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('Failed to load users');
    }
  } finally {
    setLoading(false);
  }
};

// ============================================================================
// 5️⃣ COMPARISON: 3 CARA HANDLE DATA TYPING
// ============================================================================

/**
 * CARA 1: Specify Generic (RECOMMENDED ⭐)
 * ✅ Paling clean
 * ✅ Compiler fully understands
 * ✅ Industry standard
 * ✅ Reusable
 */
async function getOrders() {
  return apiCall<OrderResponse[]>('/admin/orders', { method: 'GET' });
}
const response = await getOrders();
setOrders(response.data || []);  // ✅ No error

/**
 * CARA 2: Type Guard Function
 * ✅ Very type-safe (runtime validation)
 * ✅ Bagus untuk dynamic/untrusted data
 * ❌ Lebih verbose
 * ❌ Runtime overhead
 */
function isOrderArray(data: unknown): data is OrderResponse[] {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' && item !== null && 'id' in item
  );
}

const response = await apiCall('/admin/orders', { method: 'GET' });
if (isOrderArray(response.data)) {
  setOrders(response.data);  // ✅ Type-safe
} else {
  setOrders([]);
}

/**
 * CARA 3: Array Check (Pragmatic)
 * ✅ Simple
 * ✅ Fast
 * ❌ Hanya check array, tidak check content
 */
const response = await apiCall('/admin/orders', { method: 'GET' });
setOrders(Array.isArray(response.data) ? response.data : []);  // ✅ Works

// ============================================================================
// 6️⃣ REAL WORLD EXAMPLE - Partial Updates
// ============================================================================

/**
 * ❌ LAMA - Menggunakan 'any'
 */
export async function updateTruck(
  id: number,
  plate_number?: string,
  driver_name?: string
) {
  const body: any = {};  // ❌ any type
  if (plate_number) body.plate_number = plate_number;
  if (driver_name) body.driver_name = driver_name;
  return apiCall(`/admin/trucks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * ✅ BENAR - Menggunakan Partial<T>
 */
interface TruckResponse {
  id: number;
  plate_number: string;
  driver_name: string;
  status: string;
  created_at: string;
}

export async function updateTruck(
  id: number,
  updates: Partial<Pick<TruckResponse, 'plate_number' | 'driver_name'>>
) {
  return apiCall<TruckResponse>(`/admin/trucks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),  // ✅ Type-safe updates
  });
}

// Penggunaan:
const updates: Partial<Pick<TruckResponse, 'plate_number'>> = {
  plate_number: 'AB1234XY'
};
await updateTruck(1, updates);  // ✅ Compiler validates updates

// ============================================================================
// 7️⃣ TABEL PERBANDINGAN
// ============================================================================

/*
┌─────────────────┬────────────────────┬────────────────────────┬──────────────┐
│   Approach      │  Error Handling    │   Data Typing          │   Usage      │
├─────────────────┼────────────────────┼────────────────────────┼──────────────┤
│ err: any        │ ❌ Not type-safe   │ ❌ Any type anywhere   │ ❌ Avoid     │
│ err as Error    │ ❌ Runtime danger  │ ❌ Assumes type        │ ❌ Avoid     │
│ err: unknown    │ ✅ Type-safe       │ ✅ Must check with     │ ✅ BEST      │
│ with guard      │    + type guard    │    type guard          │      PRACTICE│
└─────────────────┴────────────────────┴────────────────────────┴──────────────┘

┌─────────────────┬───────────────┬──────────────┬──────────────┬─────────────┐
│  Data Typing    │  Type-Safe    │   Runtime    │  Reusable    │   Overhead  │
├─────────────────┼───────────────┼──────────────┼──────────────┼─────────────┤
│ as Type         │ ❌ No         │ ❌ No        │ ✅ Yes       │ Low         │
│ Generic<T>      │ ✅ Yes        │ ❌ No        │ ✅ Yes       │ NONE        │
│ Type Guard      │ ✅ Yes        │ ✅ Yes       │ Partial      │ Some        │
└─────────────────┴───────────────┴──────────────┴──────────────┴─────────────┘
*/

// ============================================================================
// 8️⃣ KEY TAKEAWAYS
// ============================================================================

/**
 * 1. JANGAN gunakan 'any' atau type assertion
 *    - Melanggar principle TypeScript
 *    - ESLint akan warn
 *    - Tidak ada type safety
 *
 * 2. GUNAKAN generic types di API functions
 *    - export function getOrders() {
 *        return apiCall<OrderResponse[]>('/admin/orders', ...)
 *      }
 *    - Ini standar di React Query, SWR, Axios
 *    - Compiler fully understands
 *
 * 3. SELALU gunakan 'unknown' untuk error handling
 *    - catch (err: unknown) { ... }
 *    - Gunakan type guard: if (err instanceof Error) { ... }
 *    - Ini standard di Node.js documentation
 *
 * 4. Hindari runtime casting
 *    - setData(response.data)?  // ❌ Compiler doesn't know type
 *    - setData(response.data || [])  // ✅ If generic specified correctly
 *
 * 5. Use Partial<T> untuk optional updates
 *    - Lebih type-safe dari optional parameters
 *    - Self-documenting code
 *    - Compiler validates
 */
