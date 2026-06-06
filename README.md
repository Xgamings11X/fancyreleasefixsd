# ⚔️ Fancy Network Store

Website store Minecraft Economy Semi RPG — **no database**, semua data disimpan di file JSON lokal.

## Stack
- **Framework**: Next.js 14
- **Storage**: File JSON (`/data/*.json`) — tidak butuh MySQL
- **Auth Player**: Plugin ShadowynAPI HTTP (port 12025)
- **Payment**: Midtrans (QRIS, GoPay, Transfer Bank)
- **Port**: 25580

---

## Setup Cepat

### 1. Install
```bash
npm install
cp .env.example .env.local
# Edit .env.local sesuai konfigurasi kamu
```

### 2. Jalankan
```bash
# Development
npm run dev

# Production (PM2)
npm run build
pm2 start npm --name "fancy-store" -- start
```

### 3. Akses
- **Website**: `http://208.84.103.117:25580`
- **Admin**: `http://208.84.103.117:25580/admin`

---

## Plugin ShadowynAPI

Endpoint plugin yang digunakan website:

| Method | Path | Fungsi |
|--------|------|--------|
| `GET`  | `/api/ping` | Health check |
| `POST` | `/api/check-player` | Login player — cek username + rank |
| `GET`  | `/api/player?name=Steve` | Info lengkap player dari player.yml |
| `POST` | `/api/transaction` | Kirim reward setelah pembayaran |
| `POST` | `/api/products` | Batch transaksi |

**Config plugin (config.yml):**
```yaml
http-server:
  enabled: true
  port: 12025
  server-key: "isi-server-key-kamu"

leaderboards:
  endpoint: "https://fancynet.my.id/api/plugin/leaderboard"
  server-key: "isi-server-key-kamu"
  boards:
    balance:
      enabled: true
      interval: 300  # detik
    auraskills:
      enabled: true
      interval: 300
    votes:
      enabled: true
      interval: 300
```

### Leaderboard Endpoint (plugin → website)
```
POST https://fancynet.my.id/api/plugin/leaderboard
Header: X-Server-Key: <server-key>
Body: {
  "board": "balance",
  "entries": [
    { "rank": 1, "player": "Steve", "value": 1500000 }
  ]
}
```

---

## Struktur Data

Semua data disimpan di folder `/data/`:

| File | Isi |
|------|-----|
| `settings.json` | Konfigurasi website (nama server, sosmed, dll) |
| `categories.json` | Kategori produk |
| `products.json` | Produk store |
| `orders.json` | Riwayat transaksi |
| `redeem_codes.json` | Kode voucher/diskon |
| `support_tickets.json` | Tiket support dari player |
| `leaderboard.json` | Cache data leaderboard dari plugin |
| `admins.json` | Admin tambahan (selain dari .env) |

---

## Admin Panel

**URL**: `/admin`

**Login**: Gunakan `ADMIN_USERNAME` dan `ADMIN_PASSWORD` dari `.env.local`

**Fitur**:
- 📦 Tambah/Edit/Hapus produk (dengan gambar, harga, reward trigger)
- 📁 Kelola kategori
- 🧾 Log transaksi real-time
- 🎫 Kode redeem/voucher
- 🚨 Report & support dari player + balas langsung

---

## Midtrans Webhook

Set di Midtrans Dashboard → **Payment Notification URL**:
```
https://fancynet.my.id/api/orders/webhook
```

---

## Nginx Config (jika pakai domain)

```nginx
server {
    listen 80;
    server_name fancynet.my.id;
    
    location / {
        proxy_pass http://localhost:25580;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# SSL
sudo certbot --nginx -d fancynet.my.id
```
