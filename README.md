# jb-frontend

Admin dashboard dan halaman tracking publik untuk **PT. Jalur Berlian Makassar** — sistem manajemen fleet dan order pengiriman kontainer.

---

## Prerequisite

- Node.js 18+
- npm
- Backend (`jb-backend`) berjalan di port 8080

## Setup

```bash
npm install

# Buat file env
cp .env.local.example .env.local   # jika ada, atau buat manual
```

Isi `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Running

```bash
npm run dev      # Development — http://localhost:3000
npm run build    # Production build
npm start        # Serve production build
npm run lint     # ESLint check
```

---

## Tech Stack

| Library | Versi | Kegunaan |
|---------|-------|----------|
| Next.js | 16 | Framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5 | Type safety (strict mode) |
| Tailwind CSS | 4 | Styling |
| @tanstack/react-table | 8 | Tabel dengan sorting/filtering/pagination |
| react-leaflet + leaflet | 5 + 1.9 | Peta interaktif (OpenStreetMap) |
| react-toastify | 11 | Notifikasi toast |

---

## Project Structure

```
jb-frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (font, metadata)
│   ├── globals.css               # Global styles (Tailwind import)
│   ├── page.tsx                  # Halaman publik — tracking order
│   ├── not-found.tsx             # Halaman 404 custom
│   ├── login/
│   │   └── page.tsx              # Login admin
│   └── dashboard/
│       ├── layout.tsx            # Dashboard layout (sidebar, navbar, toast)
│       ├── page.tsx              # Home dashboard — statistik
│       ├── customers/page.tsx    # CRUD customer
│       ├── orders/page.tsx       # CRUD order + map picker koordinat
│       ├── trucks/page.tsx       # Manajemen armada truk
│       ├── drivers/page.tsx      # Manajemen driver
│       ├── dispatch/page.tsx     # Buat & eksekusi trip (mulai, selesai, lokasi)
│       └── users/page.tsx        # Manajemen akun admin (super_admin only)
│
├── components/
│   ├── DataTable.tsx             # Tabel generik reusable (@tanstack/react-table)
│   ├── ProtectedRoute.tsx        # Client-side auth guard
│   ├── Sidebar.tsx               # Sidebar navigasi (MD+ screen, collapsible)
│   ├── BottomNavBar.tsx          # Bottom navigation (mobile)
│   ├── PageHeader.tsx            # Judul halaman + tombol aksi
│   ├── StatusBadge.tsx           # Badge status berwarna
│   ├── ConfirmModal.tsx          # Dialog konfirmasi
│   ├── AddressAutocomplete.tsx   # Autocomplete alamat (Nominatim/OSM)
│   ├── MapPickerLeaflet.tsx      # Map interaktif untuk pilih koordinat
│   ├── MapPickerModal.tsx        # Modal wrapper untuk MapPickerLeaflet
│   ├── PublicLeafletMap.tsx      # Map read-only untuk halaman tracking publik
│   ├── Navigation.tsx            # Top navbar (tidak dipakai di layout aktif)
│   └── dispatch/
│       ├── TripBoardTable.tsx    # Tabel daftar trip + action buttons
│       ├── TripDetailsModal.tsx  # Modal detail trip (audit trail, timestamps)
│       ├── LocationModal.tsx     # Modal peta lokasi + history GPS
│       └── LeafletMap.tsx        # Map dengan polyline history untuk dispatch
│
├── lib/
│   ├── api.ts                    # Semua API call + semua TypeScript types
│   └── hooks.ts                  # useAuth() hook
│
├── middleware.ts                 # Next.js middleware — auth + RBAC routing
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Halaman & Akses

| Route | Deskripsi | Akses |
|-------|-----------|-------|
| `/` | Tracking order publik (cari by order number) | Semua |
| `/login` | Login admin | Publik |
| `/dashboard` | Home — statistik ringkasan | Semua admin |
| `/dashboard/customers` | CRUD customer (perusahaan pengirim) | super_admin, admin_sales |
| `/dashboard/orders` | CRUD order + map koordinat asal/tujuan | super_admin, admin_sales |
| `/dashboard/trucks` | Inventory & manajemen truk | super_admin, admin_ops |
| `/dashboard/drivers` | Manajemen driver | super_admin, admin_ops |
| `/dashboard/dispatch` | Buat trip, mulai, selesaikan, lihat lokasi GPS | super_admin, admin_ops |
| `/dashboard/users` | Manajemen akun admin | super_admin |

---

## Auth & RBAC

**Flow login:**
1. Admin login di `/login` → dapat JWT token dari backend
2. Token disimpan di `localStorage` + cookie `token`
3. Role disimpan di cookie `role` (untuk middleware server-side)
4. `middleware.ts` redirect unauthenticated dari `/dashboard/*` ke `/login`
5. `middleware.ts` redirect role yang tidak punya akses ke `/dashboard?denied=1`
6. `ProtectedRoute.tsx` double-check auth state di client-side

**Token expired:** API interceptor di `lib/api.ts` mendeteksi HTTP 401 → otomatis clear session + redirect ke `/login`.

---

## Pola Pengembangan

### Tambah API call baru
Selalu tambah di `lib/api.ts` — jangan fetch langsung dari komponen.

```typescript
// lib/api.ts
export async function getMyEntity(id: number) {
  return apiCall<MyEntityResponse>(`/admin/my-entity/${id}`, { method: 'GET' });
}
```

### Tambah halaman dengan tabel
Gunakan `DataTable.tsx` — definisikan `columns` dengan TanStack Table, pass ke komponen:

```typescript
import { DataTable } from '@/components/DataTable';
const columns: ColumnDef<MyType>[] = [ ... ];
<DataTable columns={columns} data={data} searchPlaceholder="Cari..." searchColumn="name" />
```

### Tambah komponen peta
Gunakan `react-leaflet` (bukan Leaflet vanilla). Import harus via `dynamic()` dengan `ssr: false`:

```typescript
const MapComponent = dynamic(() => import('@/components/MapPickerLeaflet'), { ssr: false });
```

### Routing baru yang butuh role guard
Tambahkan mapping di `middleware.ts`:

```typescript
const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard/new-page': ['super_admin', 'admin_sales'],
  // ...
};
```

---

## Entity & Status

**Order:** `pending → partial → completed | cancelled`

**Trip:** `pickup → in_transit → delivered | cancelled`

**Driver status:** `available | on_duty | off`

**Truck status:** `available | on_duty | maintenance`

Status hanya maju, tidak bisa mundur. Driver/Truck status dikunci (`on_duty`) selama trip aktif.

---

## Catatan Penting

- `lib/api.ts` adalah satu-satunya tempat untuk API call dan TypeScript types
- `DataTable.tsx` digunakan untuk semua tabel — jangan buat tabel custom
- Semua toast notifikasi via `react-toastify` yang sudah di-setup di `app/dashboard/layout.tsx`
- Komponen map WAJIB di-import secara dynamic (`ssr: false`) karena Leaflet tidak support SSR
- Audit trail (siapa buat/ubah + timestamp) muncul di form edit untuk Customer, Truck, Driver, Order
- API interceptor di `lib/api.ts` otomatis logout + redirect ke `/login` jika backend return 401
- Docker backend harus di-rebuild dengan `--build` jika ada perubahan Go: `docker-compose up -d --build`
