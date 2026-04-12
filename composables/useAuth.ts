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
  const { auth, db } = useFirebase()

  const initAuth = () => {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (user) => {
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
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      userProfile.value = { uid, ...snap.data() } as UserProfile
    }
  }

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await fetchProfile(cred.user.uid)
    return cred.user
  }

  const logout = async () => {
    await signOut(auth)
    currentUser.value = null
    userProfile.value = null
  }

  // Seed user profile ke Firestore (dipakai saat pertama kali setup)
  const createProfile = async (uid: string, data: Omit<UserProfile, 'uid'>) => {
    await setDoc(doc(db, 'users', uid), data)
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
