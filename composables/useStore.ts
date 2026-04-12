import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

export type Role = 'kapal' | 'purchasing'

export type StatusPO =
  | 'draft'
  | 'diajukan'
  | 'divalidasi'
  | 'dikirim'
  | 'tiba'
  | 'dikonfirmasi'
  | 'selesai'

export interface ItemBarang {
  nama: string
  qty: number
  spesifikasi: string
  urgensi: 'rendah' | 'sedang' | 'tinggi'
  statusInstalasi: 'belum' | 'dipasang' | 'terpasang'
  lokasiPasang?: string
  teknisi?: string
  tanggalDipasang?: string
  fotoBukti?: string   // URL foto dari Firebase Storage
}

export interface PengajuanPO {
  id: string
  noSPB?: string        // Nomor SPB dari pihak kapal
  namaKapal?: string    // Nama kapal pengaju
  noPO?: string
  noTracking?: string
  lokasiDocking?: string
  status: StatusPO
  tanggalPengajuan: string
  tanggalTiba?: string
  catatanKapal?: string
  catatanPurchasing?: string
  createdBy?: string
  items: ItemBarang[]
  reminderSent?: boolean
  reminderCount: number
}

const poList = ref<PengajuanPO[]>([])
const loadingPO = ref(false)
let unsubscribe: (() => void) | null = null

const notifications = ref<{ id: string; pesan: string; waktu: string; dibaca: boolean; type?: string; poId?: string }[]>([])

export const useStore = () => {
  const { db } = useFirebase()

  const startListening = (role?: string) => {
    if (unsubscribe) return
    loadingPO.value = true
    const q = query(collection(db, 'pengajuan'), orderBy('createdAt', 'desc'))
    unsubscribe = onSnapshot(q, (snap) => {
      poList.value = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          noSPB: data.noSPB,
          namaKapal: data.namaKapal,
          noPO: data.noPO,
          noTracking: data.noTracking,
          lokasiDocking: data.lokasiDocking,
          status: data.status,
          tanggalPengajuan: data.tanggalPengajuan,
          tanggalTiba: data.tanggalTiba,
          catatanKapal: data.catatanKapal,
          catatanPurchasing: data.catatanPurchasing,
          createdBy: data.createdBy,
          items: data.items ?? [],
          reminderSent: data.reminderSent ?? false,
          reminderCount: data.reminderCount ?? 0,
        } as PengajuanPO
      })
      loadingPO.value = false
      checkReminders(role)
    })
  }

  const stopListening = () => {
    unsubscribe?.()
    unsubscribe = null
  }

  // Cek barang yang sudah tiba tapi belum semua dipasang → kirim reminder KHUSUS purchasing
  const checkReminders = (role?: string) => {
    // Hanya generate reminder jika role purchasing
    if (role !== 'purchasing') return

    const belumPasang = poList.value.filter((po: PengajuanPO) =>
      po.status === 'dikonfirmasi' &&
      po.items.some((i: ItemBarang) => i.statusInstalasi !== 'terpasang')
    )
    belumPasang.forEach((po: PengajuanPO) => {
      const key = `reminder-${po.id}`
      const sudahAda = notifications.value.find((n: { id: string }) => n.id === key)
      if (!sudahAda) {
        const belumCount = po.items.filter((i: ItemBarang) => i.statusInstalasi !== 'terpasang').length
        notifications.value.unshift({
          id: key,
          pesan: `${po.noSPB || po.noPO || 'SPB'} — ${po.namaKapal || 'Kapal'}: ${belumCount} barang tiba belum dipasang`,
          waktu: 'Reminder otomatis',
          dibaca: false,
          type: 'reminder',
          poId: po.id,
        })
      }
    })
  }

  const createPO = async (data: {
    noSPB: string
    namaKapal: string
    items: ItemBarang[]
    catatanKapal?: string
    createdBy?: string
  }) => {
    const today = new Date().toISOString().split('T')[0]
    const ref = await addDoc(collection(db, 'pengajuan'), {
      status: 'diajukan',
      tanggalPengajuan: today,
      noSPB: data.noSPB,
      namaKapal: data.namaKapal,
      items: data.items,
      catatanKapal: data.catatanKapal || '',
      createdBy: data.createdBy || '',
      reminderCount: 0,
      reminderSent: false,
      createdAt: serverTimestamp(),
    })
    addNotif(`📋 SPB ${data.noSPB} — ${data.items.length} barang dikirim ke Purchasing`)
    return ref.id
  }

  const updatePO = async (id: string, updates: Partial<PengajuanPO>) => {
    const ref = doc(db, 'pengajuan', id)
    const { id: _id, ...rest } = updates as PengajuanPO & { id: string }
    await updateDoc(ref, { ...rest, updatedAt: serverTimestamp() })
  }

  const updateItemInstalasi = async (
    poId: string,
    itemIndex: number,
    data: { lokasiPasang: string; teknisi: string; fotoBukti?: string }
  ) => {
    const po = poList.value.find(p => p.id === poId)
    if (!po) return
    const updatedItems = po.items.map((item, i) => {
      if (i === itemIndex) {
        return {
          ...item,
          statusInstalasi: 'terpasang' as const,
          lokasiPasang: data.lokasiPasang,
          teknisi: data.teknisi,
          tanggalDipasang: new Date().toISOString().split('T')[0],
          ...(data.fotoBukti ? { fotoBukti: data.fotoBukti } : {}),
        }
      }
      return item
    })
    const allDone = updatedItems.every((i: ItemBarang) => i.statusInstalasi === 'terpasang')
    await updateDoc(doc(db, 'pengajuan', poId), {
      items: updatedItems,
      ...(allDone ? { status: 'selesai' } : {}),
      updatedAt: serverTimestamp(),
    })
    if (allDone) addNotif(`Semua barang PO ${po.noPO || poId} telah terpasang!`)
  }

  const addNotif = (pesan: string) => {
    notifications.value.unshift({
      id: Date.now().toString(),
      pesan,
      waktu: 'Baru saja',
      dibaca: false,
    })
  }

  const markAllRead = () => {
    notifications.value.forEach((n: { dibaca: boolean }) => (n.dibaca = true))
  }

  const markOneRead = (id: string) => {
    const n = notifications.value.find((n: { id: string }) => n.id === id)
    if (n) n.dibaca = true
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.dibaca).length)

  // Statistik
  const stats = computed(() => ({
    diajukan: poList.value.filter(p => p.status === 'diajukan').length,
    dikirim: poList.value.filter(p => p.status === 'dikirim').length,
    tiba: poList.value.filter(p => p.status === 'tiba').length,
    dikonfirmasi: poList.value.filter(p => p.status === 'dikonfirmasi').length,
    selesai: poList.value.filter(p => p.status === 'selesai').length,
    belumPasang: poList.value.filter(p =>
      p.status === 'dikonfirmasi' && p.items.some(i => i.statusInstalasi !== 'terpasang')
    ).length,
  }))

  const statusLabel = (status: StatusPO) => {
    const map: Record<StatusPO, string> = {
      draft: 'Draft',
      diajukan: 'Diajukan',
      divalidasi: 'Divalidasi',
      dikirim: 'Dalam Pengiriman',
      tiba: 'Tiba di Pelabuhan',
      dikonfirmasi: 'Dikonfirmasi',
      selesai: 'Selesai',
    }
    return map[status] || status
  }

  const statusColor = (status: StatusPO) => {
    const map: Record<StatusPO, string> = {
      draft: 'bg-slate-100 text-slate-500',
      diajukan: 'bg-amber-100 text-amber-700',
      divalidasi: 'bg-blue-100 text-blue-700',
      dikirim: 'bg-violet-100 text-violet-700',
      tiba: 'bg-orange-100 text-orange-700',
      dikonfirmasi: 'bg-teal-100 text-teal-700',
      selesai: 'bg-emerald-100 text-emerald-700',
    }
    return map[status] || 'bg-slate-100 text-slate-500'
  }

  const urgensiColor = (urgensi: string) => {
    if (urgensi === 'tinggi') return 'bg-red-100 text-red-700'
    if (urgensi === 'sedang') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-500'
  }

  const urgensiIcon = (urgensi: string) => {
    if (urgensi === 'tinggi') return '🔴'
    if (urgensi === 'sedang') return '🟡'
    return '🟢'
  }

  return {
    poList: readonly(poList),
    loadingPO: readonly(loadingPO),
    notifications: readonly(notifications),
    unreadCount,
    stats,
    startListening,
    stopListening,
    createPO,
    updatePO,
    updateItemInstalasi,
    addNotif,
    markAllRead,
    markOneRead,
    statusLabel,
    statusColor,
    urgensiColor,
    urgensiIcon,
  }
}
