# 📋 Jalur Berlian Frontend - Setup Guide

Frontend UI untuk Jalur Berlian Fleet Management system, dibangun dengan Next.js 16 & React 19.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend URL

Edit `.env.local` dan pastikan API URL sesuai dengan backend Anda:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

Akses aplikasi di `http://localhost:3000`

## 🔐 Login

### Jika API sudah memiliki admin:
- Username: `admin`
- Password: (sesuai dengan setup backend)

### Jika API baru (belum ada admin):
1. Klik "Setup Admin" di halaman login
2. Buat username & password (min 6 karakter)
3. Gunakan untuk login

## 📊 Features

### Dashboard
- Overview status sistem
- Quick access ke Orders, Trucks, Users

### Orders Management
- View semua orders dengan pagination
- Create order baru
- Monitor order status (pending, pickup, in_transit, delivered)

### Fleet Management (Trucks)
- Daftar & manage trucks
- Edit informasi truck
- Delete truck dari sistem

### Users Management
- View semua admin & customer users
- Buat user baru dengan role selection
- Monitor user activity

## 🏗️ Architecture

```
app/
├── layout.tsx          # Root layout dengan Navigation
├── page.tsx            # Dashboard
├── login/
│   └── page.tsx        # Login & setup page
├── orders/
│   └── page.tsx        # Orders list & management
├── trucks/
│   └── page.tsx        # Trucks management
└── users/
    └── page.tsx        # Users management

components/
├── Navigation.tsx      # Top navigation bar
├── ProtectedRoute.tsx  # Route protection wrapper
└── PageHeader.tsx      # Page header component

lib/
├── api.ts             # API client & endpoints
└── hooks.ts           # Custom hooks (useAuth)
```

## 🔌 API Integration

Semua endpoints sudah terintegrasi di `lib/api.ts`:
- ✓ Authentication (login, logout, setup)
- ✓ Users management
- ✓ Trucks fleet management
- ✓ Orders management
- ✓ Location tracking
- ✓ Public order tracking

## 🛡️ Authentication

- Token disimpan di `localStorage`
- Automatic token injection di semua API calls
- Protected routes redirect ke login jika belum authenticated

## 📝 Development

### Build untuk production:
```bash
npm run build
npm start
```

### Linting:
```bash
npm run lint
```

## 🐛 Troubleshooting

### CORS Error?
Pastikan backend sudah enable CORS. Update di backend:
```go
// Dalam handler setup
router.Use(cors.Default())
```

### API 404?
- Pastikan backend running di `localhost:3000`
- Check `.env.local` untuk `NEXT_PUBLIC_API_URL`
- Verify backend API routes di `API.md`

### Token Expired?
- Logout & login kembali
- Token otomatis di-refresh setiap kali app load

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## 🎨 Styling

Project menggunakan Tailwind CSS v4 untuk styling. Customization di:
- `app/globals.css` - Global styles
- `tailwind.config.js` - Tailwind config (jika ada)

---

**Made with ❤️ for Jalur Berlian**
