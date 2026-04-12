import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

export const useFirebase = () => {
  const { $firebaseAuth, $firebaseDb } = useNuxtApp()
  return {
    auth: $firebaseAuth as Auth,
    db: $firebaseDb as Firestore,
  }
}
