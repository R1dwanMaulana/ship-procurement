import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Ambil dari runtimeConfig, fallback ke nilai langsung dari .env
  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey || import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: config.public.firebaseAuthDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.public.firebaseProjectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: config.public.firebaseStorageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.public.firebaseMessagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.public.firebaseAppId || import.meta.env.VITE_FIREBASE_APP_ID,
  }

  console.log('[Firebase] apiKey:', firebaseConfig.apiKey ? '✓' : '✗ KOSONG — cek .env')

  // Hindari inisialisasi ulang jika sudah ada
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)
  const storage = getStorage(app)

  return {
    provide: {
      firebaseAuth: auth,
      firebaseDb: db,
      firebaseStorage: storage,
    },
  }
})
