@AGENTS.md

# CLAUDE.md — jb-frontend

Next.js admin dashboard + public tracking page untuk PT. Jalur Berlian Makassar.

---

## Running

```bash
npm run dev      # Development — http://localhost:3000
npm run build    # Production build
npm start        # Serve production build
npm run lint     # ESLint check
```

Set `NEXT_PUBLIC_API_URL` di `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Deploy ke Vercel:** set `NEXT_PUBLIC_API_URL=https://jb-backend.onrender.com` di Vercel → Settings → Environment Variables, lalu trigger redeploy.

**Docker build:**
```bash
docker build -t jb-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.example.com jb-frontend
```
`next.config.ts` sudah pakai `output: 'standalone'` untuk mendukung Docker.

---

## Tech Stack

- **Next.js 16** + **React 19** — App Router
- **TypeScript** strict mode
- **Tailwind CSS v4** — utility classes, mobile-first
- **@tanstack/react-table v8** — tabel dengan sorting/filtering/pagination
- **react-leaflet v5** + **leaflet v1.9** — peta interaktif (OSM tiles)
- **react-toastify v11** — notifikasi toast

---

## Route Map

```
/                          Public order tracking (tanpa auth)
/login                     Login admin
/dashboard                 Home + stats cards
/dashboard/orders          CRUD orders + map picker koordinat
/dashboard/dispatch        Buat trip, update status, lihat lokasi
/dashboard/trucks          Inventory truk
/dashboard/drivers         Manajemen driver
/dashboard/customers       CRUD customer
/dashboard/users           Manajemen user admin (super_admin only)
```

**File struktur:**
```
app/
  page.tsx                 Public tracking
  not-found.tsx            Halaman 404 custom (bertema logistik)
  login/page.tsx
  layout.tsx               Root layout (fonts, metadata)
  globals.css
  dashboard/
    layout.tsx             Layout dashboard (sidebar + navbar)
    page.tsx               Home stats + DeniedToastHandler (?denied=1)
    orders/page.tsx
    dispatch/page.tsx
    trucks/page.tsx
    drivers/page.tsx
    customers/page.tsx
    users/page.tsx
middleware.ts              Auth guard + RBAC redirect server-side
next.config.ts             output: 'standalone' (Docker support)
Dockerfile                 Multi-stage build untuk production
```

---

## Component Map

### `components/` (root)
| Component | Fungsi |
|-----------|--------|
| `DataTable.tsx` | Generic table reusable — pass `columns` + `data` props. Gunakan ini untuk semua tabel baru. |
| `ProtectedRoute.tsx` | Client-side auth guard — wrap page component |
| `PageHeader.tsx` | Judul halaman + tombol aksi |
| `StatusBadge.tsx` | Badge berwarna untuk status entity |
| `Sidebar.tsx` | Sidebar navigasi (MD+ screen), collapsible, state disimpan di localStorage |
| `BottomNavBar.tsx` | Bottom nav untuk mobile |
| `ConfirmModal.tsx` | Dialog konfirmasi sebelum delete |
| `AddressAutocomplete.tsx` | Autocomplete alamat via Nominatim API (OpenStreetMap) |
| `MapPickerLeaflet.tsx` | Map interaktif untuk pilih koordinat |
| `MapPickerModal.tsx` | Modal wrapper untuk MapPickerLeaflet |
| `PublicLeafletMap.tsx` | Map read-only untuk halaman tracking publik |
| `Navigation.tsx` | Top navbar (tidak dipakai di layout saat ini) |

### `components/dispatch/`
| Component | Fungsi |
|-----------|--------|
| `TripBoardTable.tsx` | Tabel daftar trip dengan action buttons |
| `TripDetailsModal.tsx` | Modal detail trip |
| `LocationModal.tsx` | Modal peta lokasi + history trip |
| `LeafletMap.tsx` | Map dengan polyline history GPS untuk dispatch |

---

## Lib

### `lib/api.ts` — SATU-SATUNYA tempat semua API call
- Konstanta: `API_URL` dari `NEXT_PUBLIC_API_URL`
- Wrapper `fetch` dengan Bearer token injection otomatis
- Semua CRUD untuk: users, customers, drivers, trucks, orders, trips, locations, dashboard stats

**Types yang diekspor:**
```typescript
UserRole = 'super_admin' | 'admin_sales' | 'admin_ops'
UserResponse         // id, username, full_name, role, is_active, created_at
LoginResponse        // token, expires_at, user
CustomerResponse     // id, company_name, pic_name, phone, email, address, npwp, is_active,
                     //   created_at, updated_at?, created_by_name?, updated_by_name?
DriverResponse       // id, name, license_number, phone, status, is_active,
                     //   created_at?, updated_at?, created_by_name?, updated_by_name?
TruckResponse        // id, plate_number, truck_type, status, is_active,
                     //   created_at, updated_at?, created_by_name?, updated_by_name?
OrderResponse        // id, order_number, customer_id, origin, destination, status,
                     //   created_at, updated_at?
TripResponse         // id, order_id, truck_id, driver_id, trip_number, container_number, status,
                     //   start_time?, end_time?, started_by_name?, completed_by_name?
TrackingLocation     // id, trip_id, latitude, longitude, created_at
TrackingTripDetail   // trip, latest_location, location_history
DashboardStatsResponse  // total_orders, total_trucks, active_trucks, order_breakdown
ApiResponse<T>       // Generic wrapper: data, message, error, count, total, offset, limit
```

Status values:
- Driver: `available | on_duty | off`
- Truck: `available | on_duty | maintenance`
- Order: `pending | partial | completed | cancelled`
- Trip: `pickup | in_transit | delivered | cancelled`

### `lib/hooks.ts`
- `useAuth()` — returns `{ user, token, loading, isSignedIn, login, logout }`
- Token disimpan di **localStorage** + **cookies**

---

## Auth & RBAC

**Flow auth:**
1. Login di `/login` → dapat JWT token dari backend
2. Token disimpan di `localStorage` + cookie `token`
3. Role disimpan di cookie `role` (untuk middleware server-side)
4. `middleware.ts` (server-side, Edge Runtime) redirect:
   - Tidak ada token → `/login`
   - Role tidak punya akses ke route → `/dashboard?denied=1`
5. `ProtectedRoute.tsx` (client-side) double-check auth state
6. API 401 → `lib/api.ts` interceptor clear semua session + redirect `/login`

**Role-based navigation (Sidebar):**
| Role | Halaman yang terlihat |
|------|----------------------|
| `super_admin` | Semua halaman |
| `admin_sales` | Customers, Orders |
| `admin_ops` | Trucks, Drivers, Dispatch |

---

## Key Patterns

**Tambah API call baru:** hanya di `lib/api.ts` — jangan fetch langsung dari komponen.

**Tambah tabel baru:** pakai `DataTable.tsx` — definisikan column config dengan TanStack Table, pass ke komponen.

**Map:** gunakan `react-leaflet` (bukan Leaflet vanilla) untuk konsistensi. Koordinat dari Nominatim autocomplete atau MapPickerLeaflet.

**Soft delete:** endpoint DELETE backend hanya set `is_active = false`, data tetap ada di DB.

**Status progression:** order/trip status hanya maju, tidak bisa mundur.

**Audit trail:** form edit Customer, Truck, Driver, Order menampilkan `created_by_name` + `created_at` ("Daftar pertama") dan `updated_by_name` + `updated_at` ("Ubah terakhir"). Field ini dari backend, hanya muncul jika ada nilainya (optional).

**Auto-logout:** `lib/api.ts` mendeteksi HTTP 401 → clear localStorage + cookies + redirect ke `/login`.

**RBAC middleware:** `middleware.ts` cek cookie `role` untuk redirect ke `/dashboard?denied=1` jika role tidak punya akses ke route tersebut.

**Responsive:** Sidebar untuk MD+, BottomNavBar untuk mobile. Dashboard layout handle ini di `app/dashboard/layout.tsx`.

---

## Styling

- Tailwind v4 via `@import "tailwindcss"` di `globals.css`
- Sidebar/navbar: dark theme (`slate-900`)
- Konten: light theme
- Font: Space Grotesk (UI), Spectral (dekoratif) via Google Fonts
- Path alias: `@/` → project root
