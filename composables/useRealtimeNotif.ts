import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'

let unsubRealtimeNotif: (() => void) | null = null

export const useRealtimeNotif = () => {
  const nuxtApp = useNuxtApp()
  const { userProfile } = useAuth()
  const { show } = useToast()

  const getDb = () => nuxtApp.$firebaseDb as import('firebase/firestore').Firestore

  const start = () => {
    if (unsubRealtimeNotif) return
    const role = userProfile.value?.role
    const myUid = userProfile.value?.uid
    if (!role) return

    // Snapshot state sebelumnya untuk deteksi perubahan status
    const prevStatus = new Map<string, string>()
    let initialized = false

    const q = query(
      collection(getDb(), 'pengajuan'),
      orderBy('createdAt', 'desc')
    )

    unsubRealtimeNotif = onSnapshot(q, (snap) => {
      if (!initialized) {
        // Simpan state awal — jangan trigger notif
        snap.docs.forEach(d => prevStatus.set(d.id, d.data().status))
        initialized = true
        return
      }

      snap.docChanges().forEach((change) => {
        const data = change.doc.data()
        const docId = change.doc.id
        const newStatus = data.status as string
        const oldStatus = prevStatus.get(docId)
        const noSPB = data.noSPB || 'SPB'
        const namaKapal = data.namaKapal || 'Kapal'
        const createdBy = data.createdBy as string | undefined

        // Dokumen baru (added) — hanya notif ke purchasing
        if (change.type === 'added' && !prevStatus.has(docId)) {
          prevStatus.set(docId, newStatus)
          // Skip jika saya yang buat
          if (createdBy === myUid) return
          if (role === 'purchasing' && newStatus === 'diajukan') {
            show({
              title: 'Pengajuan Baru Masuk',
              body: `${noSPB} — ${namaKapal} · ${data.items?.length || 0} barang`,
              type: 'info',
            })
          }
          return
        }

        // Perubahan status (modified)
        if (change.type === 'modified' && oldStatus !== newStatus) {
          prevStatus.set(docId, newStatus)

          // Skip jika saya yang trigger (perubahan dari diri sendiri)
          // Deteksi: updatedAt sangat baru (< 2 detik) dan createdBy adalah saya
          // Kita tidak bisa tahu siapa yang update, jadi tampilkan semua kecuali
          // status yang sama dengan yang kita set sendiri

          // ── Notif untuk PURCHASING ──
          if (role === 'purchasing') {
            if (newStatus === 'dikonfirmasi') {
              show({
                title: 'Penerimaan Dikonfirmasi',
                body: `${noSPB} (${namaKapal}) telah dikonfirmasi diterima`,
                type: 'success',
              })
            } else if (newStatus === 'selesai') {
              show({
                title: 'Semua Barang Terpasang',
                body: `${noSPB} (${namaKapal}) selesai dipasang`,
                type: 'success',
              })
            }
            // Cek item baru dipasang
            if (newStatus === 'dikonfirmasi' || newStatus === 'selesai') {
              const items = (data.items || []) as Array<{ statusInstalasi: string; nama: string }>
              const belum = items.filter(i => i.statusInstalasi !== 'terpasang')
              if (belum.length > 0 && newStatus === 'dikonfirmasi') {
                show({
                  title: 'Barang Dipasang',
                  body: `${noSPB}: ${items.length - belum.length}/${items.length} terpasang`,
                  type: 'warning',
                })
              }
            }
          }

          // ── Notif untuk KAPAL ──
          if (role === 'kapal') {
            // Hanya notif untuk SPB milik kapal ini
            if (createdBy !== myUid) return
            if (newStatus === 'divalidasi') {
              show({
                title: 'Pengajuan Divalidasi ✓',
                body: `${noSPB} · Docking: ${data.lokasiDocking || '-'}`,
                type: 'success',
              })
            } else if (newStatus === 'dikirim') {
              show({
                title: 'Barang Sedang Dikirim',
                body: `${noSPB} · Tracking: ${data.noTracking || '-'}`,
                type: 'info',
              })
            } else if (newStatus === 'tiba') {
              show({
                title: 'Barang Tiba di Pelabuhan!',
                body: `${noSPB} sudah tiba. Segera konfirmasi penerimaan.`,
                type: 'warning',
                duration: 8000,
              })
            }
          }
        }

        // Update prevStatus untuk modified tanpa status change
        if (change.type === 'modified') {
          prevStatus.set(docId, newStatus)
        }
      })
    }, (error) => {
      console.error('[RealtimeNotif] error:', error)
    })
  }

  const stop = () => {
    unsubRealtimeNotif?.()
    unsubRealtimeNotif = null
  }

  return { start, stop }
}
