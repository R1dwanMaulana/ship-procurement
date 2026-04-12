# Setup Firebase

## 1. Buat Project Firebase
1. Buka https://console.firebase.google.com
2. Klik "Add project" → beri nama (misal: `ship-procurement`)
3. Disable Google Analytics (opsional) → Create project

## 2. Aktifkan Authentication
1. Di sidebar kiri → **Authentication** → Get started
2. Tab **Sign-in method** → Enable **Email/Password**

## 3. Aktifkan Firestore
1. Di sidebar kiri → **Firestore Database** → Create database
2. Pilih **Start in test mode** (untuk development)
3. Pilih region terdekat (misal: `asia-southeast1`)

## 3b. Aktifkan Firebase Storage
1. Di sidebar kiri → **Storage** → Get started
2. Pilih **Start in test mode**
3. Pilih region yang sama dengan Firestore

## 4. Ambil Firebase Config
1. Project Settings (⚙️) → **General** → scroll ke "Your apps"
2. Klik ikon `</>` (Web) → Register app
3. Copy nilai config, lalu isi file `.env`:

```env
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
```

## 5. Buat Akun User

Di Firebase Console → **Authentication** → **Users** → Add user:

| Email | Password | Role |
|-------|----------|------|
| kapal@ship.com | password123 | kapal |
| purchasing@ship.com | password123 | purchasing |

## 6. Buat Dokumen User di Firestore

Di **Firestore** → **Data** → Collection: `users` → Add document:

**Document ID** = UID dari user (lihat di Authentication → Users)

```json
// Untuk user kapal
{
  "nama": "Kapten Ahmad",
  "email": "kapal@ship.com",
  "role": "kapal",
  "namaKapal": "KM Nusantara Jaya"
}

// Untuk user purchasing
{
  "nama": "Budi Purchasing",
  "email": "purchasing@ship.com",
  "role": "purchasing"
}
```

> ⚠️ Collection Firestore yang digunakan:
> - `users` — profil user
> - `pengajuan` — data PO (1 dokumen = 1 PO, berisi array `items`, field `noSPB`, `namaKapal`)

## 7. Deploy Firestore Rules (opsional)
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

## 8. Jalankan Aplikasi
```bash
npm run dev
```

Buka http://localhost:3000 → akan redirect ke halaman login.
