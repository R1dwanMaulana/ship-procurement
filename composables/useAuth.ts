import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  email: string
  nama: string
  role: 'kapal' | 'purchasing'
  namaKapal?: string
}

const currentUser = ref<User | null>(null)
const userProfile = ref<UserProfile | null>(null)
const authLoading = ref(true)

export const useAuth = () => {
  // Guard: plugin hanya tersedia di client
  const nuxtApp = useNuxtApp()
  const isClient = import.meta.client

  const getAuth = () => {
    if (!isClient) throw new Error('Firebase only available on client')
    return nuxtApp.$firebaseAuth as import('firebase/auth').Auth
  }

  const getDb = () => {
    if (!isClient) throw new Error('Firebase only available on client')
    return nuxtApp.$firebaseDb as import('firebase/firestore').Firestore
  }

  const initAuth = () => {
    if (!isClient) return Promise.resolve()
    return new Promise<void>((resolve) => {
      onAuthStateChanged(getAuth(), async (user) => {
        currentUser.value = user
        if (user) {
          await fetchProfile(user.uid)
        } else {
          userProfile.value = null
        }
        authLoading.value = false
        resolve()
      })
    })
  }

  const fetchProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(getDb(), 'users', uid))
      if (snap.exists()) {
        userProfile.value = { uid, ...snap.data() } as UserProfile
      }
    } catch (e) {
      console.error('fetchProfile error:', e)
    }
  }

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(getAuth(), email, password)
    await fetchProfile(cred.user.uid)
    return cred.user
  }

  const logout = async () => {
    await signOut(getAuth())
    currentUser.value = null
    userProfile.value = null
  }

  const createProfile = async (uid: string, data: Omit<UserProfile, 'uid'>) => {
    await setDoc(doc(getDb(), 'users', uid), data)
    userProfile.value = { uid, ...data }
  }

  return {
    currentUser: readonly(currentUser),
    userProfile: readonly(userProfile),
    authLoading: readonly(authLoading),
    initAuth,
    login,
    logout,
    createProfile,
    fetchProfile,
  }
}
