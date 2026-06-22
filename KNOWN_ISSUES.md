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

### 5. Token Expiry Hanya Dideteksi Saat Ada API Request
**Masalah:** Token expired tidak dideteksi secara aktif. User bisa tetap di halaman dashboard tanpa tahu session sudah berakhir — sampai ada interaksi yang trigger API call dan mendapat 401.

**Penanganan saat ini:** API interceptor di `lib/api.ts` mendeteksi 401 dan auto-redirect ke `/login`.

**Solusi di masa depan:** Decode JWT expiry (`exp` claim) di client dan set timer/interval untuk auto-logout sebelum token benar-benar expired. Atau implementasi refresh token di backend.

---

### 6. Cookie `role` Disimpan Plaintext
**Masalah:** Cookie `role` yang digunakan middleware Next.js untuk RBAC routing disimpan sebagai plaintext (misal: `role=admin_ops`). User bisa mengedit cookie ini di browser untuk bypass redirect middleware.

**Dampak aktual:** Rendah — backend tetap validasi JWT dan role dari token. Middleware hanya untuk UX (redirect), bukan keamanan sesungguhnya. Jika admin_ops paksa akses `/dashboard/orders`, request API akan tetap ditolak backend dengan 403.

**Solusi di masa depan:** Encode role dalam JWT claim dan decode di middleware menggunakan Edge-compatible JWT library, sehingga tidak perlu cookie `role` terpisah.

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

### 9. Tidak Ada Error Boundary
**Masalah:** Jika komponen React melempar error yang tidak tertangkap (misalnya saat parsing data dari API), seluruh halaman akan crash dengan pesan error generik.

**Solusi di masa depan:** Tambah `ErrorBoundary` component di `app/dashboard/layout.tsx` atau di level halaman.

---

### 10. Komponen Map Memerlukan Dynamic Import
**Masalah:** Leaflet tidak support Server-Side Rendering (SSR). Semua komponen yang menggunakan Leaflet (`MapPickerLeaflet`, `LeafletMap`, `PublicLeafletMap`, `LocationModal`) harus di-import via `dynamic()` dengan `ssr: false`.

**Penanganan saat ini:** Sudah dilakukan di semua tempat yang relevan, tapi ini rawan terlupakan saat menambah komponen map baru.

**Solusi di masa depan:** Buat wrapper `DynamicLeafletMap` yang sudah handle dynamic import secara internal, sehingga developer tidak perlu ingat pola ini.

---

### 11. Tidak Ada Loading State Global
**Masalah:** Setiap halaman manage state loading sendiri. Tidak ada loading indicator global saat navigasi antar halaman.

**Solusi di masa depan:** Gunakan Next.js `loading.tsx` di setiap route segment, atau tambah NProgress bar di root layout.

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

---

## Backlog Improvement

- [x] ~~Tambah `updated_at` di semua model backend~~ — selesai (`init.sql` + repository query)
- [x] ~~Audit trail Order~~ — selesai (`created_at` + `updated_at` di UI order)
- [ ] Migrasi `useAuth()` ke React Context
- [ ] Pagination server-side untuk Customers, Drivers, Trucks
- [ ] Error boundary global
- [ ] Loading state global (Next.js `loading.tsx` atau NProgress)
- [ ] Wrapper `DynamicLeafletMap` untuk simplifikasi dynamic import
- [ ] Encode role di JWT claim (eliminasi cookie `role`)
- [ ] Real-time token expiry detection (decode `exp` claim, set timer)
- [ ] Unit test untuk `lib/api.ts` dan `formatNPWP()`
- [ ] E2E test untuk flow login, CRUD customer, dan dispatch trip
