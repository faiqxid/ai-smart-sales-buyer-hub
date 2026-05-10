# 🚀 AI Smart Sales & Buyer Hub

Aplikasi web Progressive Web App (PWA) dua sisi yang dirancang khusus untuk digitalisasi operasional **Sales Keliling/Kanvaser** dan **Buyer/Toko UMKM**. Sistem ini memberdayakan tim lapangan dengan asisten AI (Google Gemini) untuk memberikan *insight* operasional harian, manajemen stok cerdas, dan interaksi pesanan yang *seamless* dengan pembeli.

---

## ✨ Fitur Utama

### 🛒 Modul Buyer (Pemilik Toko)
* **Katalog B2B Digital:** Browsing produk, harga, dan ketersediaan stok secara *real-time*.
* **Order & Inden (Pre-order):** Pesan langsung dari aplikasi. Jika stok kosong, sistem mencatat sebagai *pre-order* (inden).
* **Manajemen Tagihan:** Pantau riwayat pesanan, status pengiriman, dan sisa tagihan.
* **Notifikasi Real-time (FCM):** Push notification saat pesanan diproses, dikirim, atau saat stok inden sudah tersedia.
* **PWA Ready:** Instal langsung ke *home screen* HP (Android/iOS) tanpa perlu ke Play Store.

### 💼 Modul Sales (Kanvaser Lapangan)
* **AI Daily Briefing:** Gemini AI merangkum prioritas kerja hari ini (stok hampir habis, barang *near-expired*, retur tertunda, dan estimasi profit).
* **Manajemen Operasional Terpadu:** Kelola Order, Retur Barang, dan Distribusi Inden dalam satu dashboard.
* **Manajemen Stok B2B:** Update stok *real-time* yang langsung tersinkronisasi ke katalog pembeli.
* **AI WhatsApp Generator:** Membuat *template* pesan tagihan WhatsApp otomatis yang ramah, profesional, dan detail berdasarkan invoice.
* **Notifikasi Operasional:** Dapatkan *alert* ketika toko mengajukan *pre-order* atau retur.

### ⚙️ Modul Admin (Dashboard Pusat)
* **Manajemen Pengguna:** Kelola akses (Admin, Sales, Buyer), aktivasi, dan reset *password*.
* **Integrasi Dinamis (In-App Setup):** 
  * Atur **Google Gemini API Key** dan ubah versi Model AI (contoh: `gemini-flash-latest`) langsung dari panel.
  * *Upload* Service Account **Firebase JSON** untuk *push notification* tanpa menyentuh *source code*.
* **Audit Trail:** Mencatat seluruh perubahan penting untuk *compliance* keamanan.

---

## 🛠️ Stack Teknologi

**Frontend:**
* Next.js 14 (App Router)
* React 18
* Tailwind CSS
* next-pwa (Progressive Web App)
* Firebase Web SDK (Cloud Messaging)

**Backend:**
* Python 3.12, FastAPI
* PostgreSQL & SQLAlchemy (ORM)
* Alembic (Database Migrations)
* Google GenAI SDK (Gemini AI)
* Firebase Admin SDK (FCM Server)

**Infrastruktur & Deployment:**
* Docker & Docker Compose
* Google Cloud Run (Serverless API & Web)
* Google Cloud SQL (Managed Database)
* Ubuntu VPS (Alternatif Self-hosted)

---

## 📂 Struktur Project

```text
ai-smart-sales-buyer-hub/
├── backend/                 # Layanan API (FastAPI)
│   ├── app/                 # Source code Backend (Routers, Models, Services)
│   ├── alembic/             # Skrip migrasi skema database
│   ├── requirements.txt     # Dependensi Python
│   ├── cloudrun-env.yaml    # (GCP) File environment khusus deployment Cloud Run
│   └── seed.py              # Skrip injeksi data awal (User Admin/Demo)
│
├── frontend/                # Layanan Web (Next.js)
│   ├── app/                 # Source code Frontend (Pages, Layouts, API Routes)
│   ├── components/          # Reusable UI React Components
│   ├── lib/                 # Utilitas (API Client, Auth state)
│   ├── public/              # Aset statis & konfigurasi PWA (manifest, service worker)
│   ├── cloudbuild.yaml      # (GCP) Build script dengan injeksi build-args
│   └── .env                 # Environment variables lokal
│
├── docker-compose.yml       # Konfigurasi orkestrasi deployment lokal
└── README.md                # Dokumentasi utama
```

---

## 3. Setup Lokal dengan Docker Compose

### Prasyarat
- Docker Desktop / Docker Engine
- Docker Compose
- Git

### 3.1 Clone Project

```bash
git clone <repo-url>
cd ai-smart-sales-buyer-hub
```

### 3.2 Buat File Environment Backend

Buat file:

```text
backend/.env
```

Contoh minimal:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/sales_hub
JWT_SECRET=ganti_dengan_secret_random_minimal_32_karakter
GEMINI_API_KEY=
CORS_ORIGINS=*

# Firebase Admin / FCM, opsional untuk lokal kalau tidak tes push notification
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Catatan `FIREBASE_PRIVATE_KEY`:
- Jika memakai format satu baris, gunakan `\n` untuk line break.
- Jika memakai YAML/Cloud Run, lebih aman gunakan block scalar `|`.

### 3.3 Buat File Environment Frontend

Buat file:

```text
frontend/.env
```

Contoh:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Web SDK / FCM, wajib kalau mau push notification web
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

### 3.4 Jalankan Service

```bash
docker compose up --build
```

URL lokal:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 3.5 Migration dan Seed Data

Buka terminal baru:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python seed.py
```

Akun demo:

| Role  | Username          | Password   |
|-------|-------------------|------------|
| Admin | `admin1`          | `admin123` |
| Sales | `sales1`          | `sales123` |
| Buyer | `toko_makmur`     | `buyer123` |
| Buyer | `warung_barokah`  | `buyer123` |

---

## 4. Setup Manual Lokal tanpa Docker

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 5. Deploy ke Google Cloud Run

Bagian ini adalah panduan production Cloud Run.

Contoh production project yang pernah dipakai:
- Project ID: `juaravibecoding-337f9`
- Region: `asia-southeast2`
- Backend service: `sales-hub-api`
- Frontend service: `sales-hub-web`
- Cloud SQL instance: `sales-hub-db`

Kalau project berbeda, ganti semua `PROJECT_ID`, region, nama service, dan image path sesuai project Anda.

### 5.1 Prasyarat Google Cloud

Aktifkan API:

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

Login dan set project:

```bash
gcloud auth login
gcloud config set project PROJECT_ID
```

Set region default, opsional:

```bash
gcloud config set run/region asia-southeast2
```

### 5.2 Buat Artifact Registry

Jika repository belum ada:

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=asia-southeast2 \
  --description="Docker images for Sales Hub"
```

Configure Docker auth:

```bash
gcloud auth configure-docker asia-southeast2-docker.pkg.dev
```

### 5.3 Buat Cloud SQL PostgreSQL

```bash
gcloud sql instances create sales-hub-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-southeast2 \
  --root-password=PASSWORD_ROOT_DATABASE

gcloud sql databases create sales_hub --instance=sales-hub-db

gcloud sql users create appuser \
  --instance=sales-hub-db \
  --password=PASSWORD_APPUSER_DATABASE
```

Catat connection name:

```bash
gcloud sql instances describe sales-hub-db --format="value(connectionName)"
```

Format biasanya:

```text
PROJECT_ID:asia-southeast2:sales-hub-db
```

### 5.4 Siapkan Env Backend Cloud Run

Buat file:

```text
backend/cloudrun-env.yaml
```

Contoh isi:

```yaml
DATABASE_URL: "postgresql+psycopg://appuser:PASSWORD_APPUSER_DATABASE@/sales_hub?host=/cloudsql/PROJECT_ID:asia-southeast2:sales-hub-db"
JWT_SECRET: "ganti_dengan_secret_random_minimal_32_karakter"
GEMINI_API_KEY: "isi_api_key_gemini_jika_dipakai"
CORS_ORIGINS: "*"

FIREBASE_PROJECT_ID: "PROJECT_ID_FIREBASE"
FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-xxxxx@PROJECT_ID_FIREBASE.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY: |
  -----BEGIN PRIVATE KEY-----
  ISI_PRIVATE_KEY_FIREBASE
  -----END PRIVATE KEY-----
```

Penting:
- Jangan commit `cloudrun-env.yaml` yang berisi secret asli.
- Jika private key pernah dibagikan di chat/public, revoke/generate ulang service account key Firebase.

### 5.5 Build dan Deploy Backend

Dari root project, atau langsung masuk folder backend.

PowerShell Windows:

```powershell
cd "D:\project python\JuaraVibeCoding\ai-smart-sales-buyer-hub\backend"

gcloud builds submit `
  --tag asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-api:latest

gcloud run services update sales-hub-api `
  --region asia-southeast2 `
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-api:latest `
  --add-cloudsql-instances "PROJECT_ID:asia-southeast2:sales-hub-db" `
  --env-vars-file cloudrun-env.yaml
```

Kalau service belum pernah dibuat, gunakan `gcloud run deploy`:

```powershell
gcloud run deploy sales-hub-api `
  --region asia-southeast2 `
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-api:latest `
  --add-cloudsql-instances "PROJECT_ID:asia-southeast2:sales-hub-db" `
  --env-vars-file cloudrun-env.yaml `
  --allow-unauthenticated
```

Bash/Linux/WSL:

```bash
cd backend

gcloud builds submit \
  --tag asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-api:latest

gcloud run deploy sales-hub-api \
  --region asia-southeast2 \
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-api:latest \
  --add-cloudsql-instances "PROJECT_ID:asia-southeast2:sales-hub-db" \
  --env-vars-file cloudrun-env.yaml \
  --allow-unauthenticated
```

### 5.6 Jalankan Migration di Cloud Run

Gunakan **Cloud Run Jobs** agar migration database berjalan di environment production yang sama dengan backend.

> Catatan PowerShell penting: untuk Alembic, kirim argumen sebagai dua flag terpisah (`--args="upgrade"` dan `--args="head"`). Jika memakai `--args upgrade,head`, beberapa shell/gcloud version dapat menggabungkannya menjadi `"upgrade head"` dan Alembic akan gagal.

Dari folder `backend`:

```powershell
cd "D:\project python\JuaraVibeCoding\ai-smart-sales-buyer-hub\backend"
```

Buat job migration jika belum ada:

```powershell
gcloud run jobs create sales-hub-db-migrate `
  --region asia-southeast2 `
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-api:latest `
  --set-cloudsql-instances "PROJECT_ID:asia-southeast2:sales-hub-db" `
  --env-vars-file cloudrun-env.yaml `
  --command "alembic" `
  --args="upgrade" `
  --args="head"
```

Jika job sudah ada dan ingin update image/env/command:

```powershell
gcloud run jobs update sales-hub-db-migrate `
  --region asia-southeast2 `
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-api:latest `
  --set-cloudsql-instances "PROJECT_ID:asia-southeast2:sales-hub-db" `
  --env-vars-file cloudrun-env.yaml `
  --command "alembic" `
  --args="upgrade" `
  --args="head"
```

Eksekusi migration:

```powershell
gcloud run jobs execute sales-hub-db-migrate --region asia-southeast2 --wait
```

Opsional seed data production (hati-hati, karena dapat menambah akun demo):

```powershell
gcloud run jobs create sales-hub-db-seed `
  --region asia-southeast2 `
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-api:latest `
  --set-cloudsql-instances "PROJECT_ID:asia-southeast2:sales-hub-db" `
  --env-vars-file cloudrun-env.yaml `
  --command "python" `
  --args="seed.py"

gcloud run jobs execute sales-hub-db-seed --region asia-southeast2 --wait
```

Melihat log job jika gagal:

```powershell
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="sales-hub-db-migrate" AND resource.labels.location="asia-southeast2"' --limit=50 --format='value(textPayload)'
```

### 5.7 Verifikasi Backend

Ambil URL backend:

```bash
gcloud run services describe sales-hub-api \
  --region asia-southeast2 \
  --format="value(status.url)"
```

Tes health:

```bash
curl https://URL_BACKEND_CLOUD_RUN/health
```

Response normal:

```json
{
  "status": "ok",
  "app": "AI Smart Sales Hub",
  "gemini": true,
  "firebase": true
}
```

### 5.8 Siapkan Frontend `cloudbuild.yaml`

Next.js membutuhkan semua `NEXT_PUBLIC_*` saat build, bukan hanya saat runtime. Karena itu frontend harus dibuild memakai `cloudbuild.yaml` yang mengirim `--build-arg`.

File:

```text
frontend/cloudbuild.yaml
```

Contoh:

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -t
      - asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-web:latest
      - --build-arg
      - NEXT_PUBLIC_API_URL=https://URL_BACKEND_CLOUD_RUN
      - --build-arg
      - NEXT_PUBLIC_FIREBASE_API_KEY=ISI_FIREBASE_API_KEY
      - --build-arg
      - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=PROJECT_ID_FIREBASE.firebaseapp.com
      - --build-arg
      - NEXT_PUBLIC_FIREBASE_PROJECT_ID=PROJECT_ID_FIREBASE
      - --build-arg
      - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ISI_MESSAGING_SENDER_ID
      - --build-arg
      - NEXT_PUBLIC_FIREBASE_APP_ID=ISI_FIREBASE_APP_ID
      - --build-arg
      - NEXT_PUBLIC_FIREBASE_VAPID_KEY=ISI_FIREBASE_VAPID_KEY
      - .

images:
  - asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-web:latest
```

Penting:
- Jangan deploy frontend dengan `gcloud builds submit --tag ...` kalau butuh `NEXT_PUBLIC_*` build arg.
- Gunakan `gcloud builds submit --config cloudbuild.yaml .`
- Jika error `NEXT_PUBLIC_API_URL belum diset`, berarti build frontend tidak memakai `cloudbuild.yaml` atau value build arg belum benar.

### 5.9 Build dan Deploy Frontend

PowerShell Windows:

```powershell
cd "D:\project python\JuaraVibeCoding\ai-smart-sales-buyer-hub\frontend"

gcloud builds submit --config cloudbuild.yaml .

gcloud run deploy sales-hub-web `
  --region asia-southeast2 `
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-web:latest `
  --allow-unauthenticated
```

Bash/Linux/WSL:

```bash
cd frontend

gcloud builds submit --config cloudbuild.yaml .

gcloud run deploy sales-hub-web \
  --region asia-southeast2 \
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/cloud-run-source-deploy/sales-hub-web:latest \
  --allow-unauthenticated
```

### 5.10 Verifikasi Frontend

Ambil URL frontend:

```bash
gcloud run services describe sales-hub-web \
  --region asia-southeast2 \
  --format="value(status.url)"
```

Buka URL tersebut di browser.

Jika ada service worker/PWA update:
1. Buka DevTools > Application > Service Workers
2. Klik `Unregister` service worker lama
3. Hard refresh: `Ctrl + Shift + R`

### 5.11 Melihat Logs Cloud Run

Backend:

```bash
gcloud run services logs tail sales-hub-api --region asia-southeast2
```

Frontend:

```bash
gcloud run services logs tail sales-hub-web --region asia-southeast2
```

### 5.12 Tes Push Notification

Register token FCM:

```bash
curl -X POST \
  'https://URL_BACKEND_CLOUD_RUN/api/notifications/register-token' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer JWT_USER' \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "FCM_TOKEN_BROWSER",
    "platform": "web"
  }'
```

Kirim test notification:

```bash
curl -X POST \
  'https://URL_BACKEND_CLOUD_RUN/api/notifications/send-test' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer JWT_USER' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "USER_ID_TARGET",
    "title": "Test Notifikasi",
    "body": "Notifikasi berhasil dikirim.",
    "data": {
      "type": "test_notification"
    }
  }'
```

---

## 6. Deploy ke VPS dengan Docker Compose

Panduan ini untuk VPS Ubuntu 22.04/24.04. Cocok jika ingin semua service berjalan di satu server: PostgreSQL, backend, frontend, dan Nginx reverse proxy.

Contoh domain:
- Frontend: `https://saleshub.example.com`
- Backend API: `https://api.saleshub.example.com`

Ganti domain sesuai milik Anda.

### 6.1 Prasyarat VPS

- VPS Ubuntu 22.04/24.04
- Domain sudah mengarah ke IP VPS
- Akses SSH root/sudo
- Port firewall terbuka: `80`, `443`

Login ke VPS:

```bash
ssh root@IP_VPS
```

Update server:

```bash
apt update && apt upgrade -y
```

Install paket dasar:

```bash
apt install -y git curl ufw ca-certificates gnupg nginx certbot python3-certbot-nginx
```

Aktifkan firewall:

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
```

### 6.2 Install Docker dan Docker Compose Plugin

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker --version
docker compose version
```

### 6.3 Upload / Clone Project ke VPS

```bash
mkdir -p /opt/sales-hub
cd /opt/sales-hub

git clone <repo-url> .
```

Jika repo private, gunakan SSH key deploy atau upload ZIP/SCP.

### 6.4 Buat File Env Production Backend

Buat file:

```bash
nano /opt/sales-hub/backend/.env
```

Contoh:

```env
DATABASE_URL=postgresql+psycopg://postgres:GANTI_PASSWORD_POSTGRES@db:5432/sales_hub
JWT_SECRET=ganti_dengan_secret_random_minimal_32_karakter
GEMINI_API_KEY=isi_api_key_gemini_jika_dipakai
CORS_ORIGINS=https://saleshub.example.com,https://api.saleshub.example.com

FIREBASE_PROJECT_ID=PROJECT_ID_FIREBASE
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@PROJECT_ID_FIREBASE.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nISI_PRIVATE_KEY_FIREBASE\n-----END PRIVATE KEY-----\n"
```

### 6.5 Buat File Env Production Frontend

Buat file:

```bash
nano /opt/sales-hub/frontend/.env
```

Contoh:

```env
NEXT_PUBLIC_API_URL=https://api.saleshub.example.com
NEXT_PUBLIC_FIREBASE_API_KEY=ISI_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=PROJECT_ID_FIREBASE.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=PROJECT_ID_FIREBASE
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=ISI_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=ISI_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY=ISI_FIREBASE_VAPID_KEY
```

### 6.6 Buat Docker Compose Production untuk VPS

Buat file baru:

```bash
nano /opt/sales-hub/docker-compose.prod.yml
```

Isi:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: sales_hub_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: sales_hub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: GANTI_PASSWORD_POSTGRES
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sales_hub_backend
    restart: unless-stopped
    env_file:
      - ./backend/.env
    ports:
      - "127.0.0.1:8000:8080"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://api.saleshub.example.com
        NEXT_PUBLIC_FIREBASE_API_KEY: ISI_FIREBASE_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: PROJECT_ID_FIREBASE.firebaseapp.com
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT_ID_FIREBASE
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ISI_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID: ISI_FIREBASE_APP_ID
        NEXT_PUBLIC_FIREBASE_VAPID_KEY: ISI_FIREBASE_VAPID_KEY
    container_name: sales_hub_frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:8080"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Penting:
- Backend Dockerfile expose `8080` di production karena memakai `${PORT:-8080}`.
- Frontend Dockerfile expose `8080` dan menjalankan Next standalone server.
- Frontend `NEXT_PUBLIC_*` harus masuk sebagai build args saat image dibuild.

### 6.7 Build dan Jalankan Container

```bash
cd /opt/sales-hub

docker compose -f docker-compose.prod.yml up -d --build
```

Cek status:

```bash
docker compose -f docker-compose.prod.yml ps
```

Cek logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### 6.8 Jalankan Migration dan Seed di VPS

Migration:

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

Seed data, opsional dan hati-hati untuk production:

```bash
docker compose -f docker-compose.prod.yml exec backend python seed.py
```

### 6.9 Setup Nginx Reverse Proxy

Buat config Nginx:

```bash
nano /etc/nginx/sites-available/sales-hub
```

Isi:

```nginx
server {
    listen 80;
    server_name saleshub.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name api.saleshub.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan config:

```bash
ln -s /etc/nginx/sites-available/sales-hub /etc/nginx/sites-enabled/sales-hub
nginx -t
systemctl reload nginx
```

### 6.10 Aktifkan HTTPS SSL dengan Certbot

Pastikan DNS domain sudah mengarah ke IP VPS, lalu:

```bash
certbot --nginx -d saleshub.example.com -d api.saleshub.example.com
```

Tes auto-renew:

```bash
certbot renew --dry-run
```

### 6.11 Verifikasi VPS

Backend health:

```bash
curl https://api.saleshub.example.com/health
```

Frontend:

```bash
curl -I https://saleshub.example.com
```

Buka di browser:

```text
https://saleshub.example.com
```

### 6.12 Update Deploy VPS Setelah Ada Perubahan Kode

Jika pakai Git:

```bash
cd /opt/sales-hub
git pull

docker compose -f docker-compose.prod.yml up -d --build

docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

Jika hanya frontend berubah:

```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

Jika hanya backend berubah:

```bash
docker compose -f docker-compose.prod.yml up -d --build backend
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 6.13 Backup Database VPS

Backup manual:

```bash
cd /opt/sales-hub
mkdir -p backups

docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres sales_hub > backups/sales_hub_$(date +%F_%H-%M-%S).sql
```

Restore, hati-hati karena akan menimpa data jika database sama:

```bash
cat backups/NAMA_FILE_BACKUP.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres sales_hub
```

---

## 7. Firebase Cloud Messaging / Push Notification

### 7.1 Firebase Admin untuk Backend

Backend membutuhkan service account Firebase:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Cek backend health:

```bash
curl https://URL_BACKEND/health
```

Jika `"firebase": true`, berarti Firebase Admin berhasil inisialisasi.

### 7.2 Web SDK Firebase untuk Frontend

Frontend (PWA) membutuhkan Firebase Web SDK untuk service worker background (SW):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- Dsb.

Token device pengguna diregistrasikan saat mereka memencet tombol "Aktifkan" di banner yang muncul di dashboard frontend.

*Penting*: `firebase-messaging-sw.js` memakai URL absolut atau token Firebase, jadi pastikan credentials valid agar notifikasi background masuk walau app sedang ditutup.

---

## 8. 🤖 Gemini AI

Aplikasi mengandalkan model ringan dan cepat (Gemini 1.5 Flash). Pastikan `GEMINI_API_KEY` dimasukkan.

### Penggunaan:
1. **AI Briefing (Sales)**: Membuat rangkuman data retur dan stok dari database untuk disajikan dalam bahasa santai dan praktis setiap pagi.
2. **Pre-order Matcher**: Saat stok produk yang awalnya `Kosong` ditambah jadi `Tersedia`, AI mengecek tabel `pre_orders` dan memberi notifikasi alokasi stok berdasar wilayah pembeli.
3. **Generator WA Tagihan (Sales)**: Pada pesanan status "Dikirim/Sampai", klik icon WA untuk membiarkan AI menuliskan salam pembuka ramah + rincian nota belanja yang siap kirim ke buyer.
