# Known Issues & Improvement Notes — jb-frontend

Dokumen ini mencatat keterbatasan teknis, masalah yang diketahui, dan daftar improvement yang bisa dilakukan di masa depan pada `jb-frontend`.

---

## Masalah yang Diketahui (Known Issues)

### ~~1. Audit Trail: Tidak Ada Timestamp `updated_at`~~ ✅ RESOLVED
**Diselesaikan:** `init.sql` diperbarui — kolom `updated_at` ditambah ke semua tabel. Repository UPDATE query menyetel `updated_at = CURRENT_TIMESTAMP` secara otomatis. UI audit trail menampilkan tanggal & jam untuk "Daftar pertama" dan "Ubah terakhir" di form edit Customer, Truck, Driver, dan Order.

---

### ~~2. Driver: Tidak Ada `created_at`~~ ✅ RESOLVED
**Diselesaikan:** `init.sql` diperbarui — kolom `created_at DEFAULT CURRENT_TIMESTAMP` ditambah ke tabel `drivers`. `DriverResponse` kini punya field `created_at`. Form edit Driver menampilkan timestamp di baris "Daftar pertama".

---

### ~~3. Order: Tidak Ada Audit Trail di UI~~ ✅ RESOLVED
**Diselesaikan:** `OrderResponse` ditambah field `updated_at`. Form edit order menampilkan timestamp "Dibuat" dan "Ubah terakhir". `order_repository.go` kini menyertakan `created_at, updated_at` di semua SELECT query dan `updated_at = CURRENT_TIMESTAMP` di UpdateStatus.

---

### 4. Auth State Tidak Shared via Context
**Masalah:** `useAuth()` dipanggil secara independen di beberapa komponen (`Sidebar`, `BottomNavBar`, halaman-halaman). Setiap pemanggil membaca `localStorage` sendiri — tidak ada shared state. Jika satu komponen logout, komponen lain tidak langsung tahu.

**Penanganan saat ini:** Bekerja karena `localStorage` konsisten dan redirect dilakukan via `window.location.href` (full page reload).

**Solusi di masa depan:** Wrap app dengan React Context (`AuthProvider`), semua komponen subscribe ke context yang sama. Ini juga memungkinkan real-time token expiry detection.

---

### ~~5. Token Expiry Hanya Dideteksi Saat Ada API Request~~ ✅ RESOLVED
**Diselesaikan:** `useAuth()` di `lib/hooks.ts` kini decode `exp` claim dari JWT payload saat login dan saat mount (restore dari localStorage). Timer `setTimeout` dijadwalkan untuk auto-logout 30 detik sebelum token expire. Timer dibersihkan saat manual logout.

---

### ~~6. Cookie `role` Disimpan Plaintext~~ ✅ RESOLVED
**Diselesaikan:** `middleware.ts` kini decode `role` langsung dari JWT payload (`atob` + `JSON.parse` — aman di Edge Runtime, tanpa library tambahan). Cookie `role` dihapus sepenuhnya dari `hooks.ts` dan `lib/api.ts`. Hanya cookie `token` yang tersisa.

---

### 7. `?denied=1` Query Param Bisa Dimanipulasi
**Masalah:** Toast "akses ditolak" di `/dashboard` dipicu oleh query param `?denied=1`. User bisa mengetik URL ini secara manual untuk memunculkan toast palsu.

**Dampak aktual:** Kosmetik saja — tidak ada efek keamanan.

**Solusi di masa depan:** Gunakan server-side flash message atau signed param jika ini menjadi masalah.

---

### 8. Tidak Ada Pagination di Beberapa Halaman
**Masalah:** Halaman Customers, Drivers, dan Trucks memuat **semua data** sekaligus dari API. Saat data bertambah banyak, ini akan lambat.

**Penanganan saat ini:** Backend sudah support `?limit=&offset=` di semua endpoint list, tapi frontend belum menggunakannya untuk halaman-halaman ini.

**Solusi di masa depan:** Implementasi pagination server-side dengan tombol prev/next atau infinite scroll. Dispatch sudah menggunakan pagination.

---

### ~~9. Tidak Ada Error Boundary~~ ✅ RESOLVED
**Diselesaikan:** `components/ErrorBoundary.tsx` dibuat (class component) dan di-wrap di `app/dashboard/layout.tsx` — menampilkan pesan error friendly + tombol "Muat Ulang" daripada blank screen.

---

### 10. Komponen Map Memerlukan Dynamic Import
**Masalah:** Leaflet tidak support Server-Side Rendering (SSR). Semua komponen yang menggunakan Leaflet (`MapPickerLeaflet`, `LeafletMap`, `PublicLeafletMap`, `LocationModal`) harus di-import via `dynamic()` dengan `ssr: false`.

**Penanganan saat ini:** Sudah dilakukan di semua tempat yang relevan, tapi ini rawan terlupakan saat menambah komponen map baru.

**Solusi di masa depan:** Buat wrapper `DynamicLeafletMap` yang sudah handle dynamic import secara internal, sehingga developer tidak perlu ingat pola ini.

---

### ~~11. Tidak Ada Loading State Global~~ ✅ RESOLVED
**Diselesaikan:** `app/dashboard/loading.tsx` ditambah — Next.js App Router otomatis menampilkan spinner saat navigasi ke route dashboard yang sedang load data async.

---

## Improvement yang Sudah Dilakukan

| Tanggal | Improvement |
|---------|-------------|
| 2026-06 | Route guard RBAC via `middleware.ts` — bypass URL langsung dicegah |
| 2026-06 | Auto-logout saat API return 401 |
| 2026-06 | NPWP auto-formatter saat input di form Customer |
| 2026-06 | Halaman 404 custom bertema logistik |
| 2026-06 | Audit trail Trip: tampilkan nama admin yang memulai dan menyelesaikan trip |
| 2026-06 | Audit trail: timestamp `created_at` & `updated_at` untuk Customer, Truck, Driver, Order |
| 2026-06 | `init.sql` diperbarui — semua kolom audit trail ada sejak awal (reset DB bersih) |
| 2026-07 | Error boundary global — `components/ErrorBoundary.tsx` wrap semua halaman dashboard |
| 2026-07 | Auto-logout proaktif — decode JWT `exp`, schedule timer 30 detik sebelum expire |
| 2026-07 | Global loading state — `app/dashboard/loading.tsx` spinner saat navigasi |
| 2026-07 | Reset password admin — tombol "Reset Password" di halaman Users (super_admin) |
| 2026-07 | Cookie `role` dieliminasi — middleware decode role dari JWT payload langsung |
| 2026-07 | Pagination limit/offset — `getCustomers`, `getDrivers`, `getTrucks` default limit 100 |
| 2026-07 | Halaman Profil self-service — user bisa ubah `full_name` dan password sendiri via `PATCH /admin/profile` |
| 2026-07 | BottomNavBar — tambah Profil link + tombol Keluar di sheet "Lainnya" |
| 2026-07 | Sidebar — tambah link Profil di footer (di atas tombol Logout) |

---

## Backlog Improvement

- [x] ~~Tambah `updated_at` di semua model backend~~ — selesai (`init.sql` + repository query)
- [x] ~~Audit trail Order~~ — selesai (`created_at` + `updated_at` di UI order)
- [ ] Migrasi `useAuth()` ke React Context
- [x] ~~Pagination server-side untuk Customers, Drivers, Trucks~~ — selesai (limit/offset params, default 100)
- [x] ~~Error boundary global~~ — selesai (`components/ErrorBoundary.tsx` + wrap di layout)
- [x] ~~Loading state global~~ — selesai (`app/dashboard/loading.tsx`)
- [ ] Wrapper `DynamicLeafletMap` untuk simplifikasi dynamic import
- [x] ~~Encode role di JWT claim (eliminasi cookie `role`)~~ — selesai (middleware decode JWT payload, cookie `role` dihapus)
- [x] ~~Real-time token expiry detection~~ — selesai (decode `exp` + setTimeout di `useAuth`)
- [ ] Unit test untuk `lib/api.ts` dan `formatNPWP()`
- [ ] E2E test untuk flow login, CRUD customer, dan dispatch trip
