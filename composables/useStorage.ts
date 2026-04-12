import { ref as storageRef, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage'

export const useStorage = () => {
  const { $firebaseStorage } = useNuxtApp()
  const storage = $firebaseStorage as FirebaseStorage

  const uploadFoto = async (file: File, poId: string, itemIndex: number): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `bukti-pasang/${poId}/item-${itemIndex}-${Date.now()}.${ext}`
    const ref = storageRef(storage, path)
    await uploadBytes(ref, file)
    return await getDownloadURL(ref)
  }

  return { uploadFoto }
}
