import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  arrayUnion,
} from 'firebase/firestore'
import { ulid } from 'ulid'

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
  fotoBukti?: string
  catatan?: string          // Fitur 6: catatan per item
}

export interface LogEntry {
  waktu: string
  aksi: string
  oleh: string
  detail?: string
}

export interface PengajuanPO {
  id: string
  noSPB?: string
  namaKapal?: string
  noTracking?: string
  lokasiDocking?: string
  status: StatusPO
  tanggalPengajuan: string
  estimasiTiba?: string     // Fitur 1: estimasi tiba
  tanggalTiba?: string
  catatanKapal?: string
  catatanPurchasing?: string
  createdBy?: string
  items: ItemBarang[]
  reminderSent?: boolean
  reminderCount: number
  log?: LogEntry[]          // Fitur 5: history log
}

const poList = ref<PengajuanPO[]>([])
const loadingPO = ref(false)
let unsubscribe: (() => void) | null = null

const notifications = ref<{
  id: string
  pesan: string
  waktu: string
  dibaca: boolean
  type?: string
  poId?: string
}[]>([])

export const useStore = () => {
  const nuxtApp = useNuxtApp()
  const getDb = () => nuxtApp.$firebaseDb as import('firebase/firestore').Firestore

  const startListening = (role?: string) => {
    if (unsubscribe) return
    loadingPO.value = true
    const q = query(collection(getDb(), 'pengajuan'), orderBy('createdAt', 'desc'))
    unsubscribe = onSnapshot(q, (snap) => {
      poList.value = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          noSPB: data.noSPB,
          namaKapal: data.namaKapal,
          noTracking: data.noTracking,
          lokasiDocking: data.lokasiDocking,
          status: data.status,
          tanggalPengajuan: data.tanggalPengajuan,
          estimasiTiba: data.estimasiTiba,
          tanggalTiba: data.tanggalTiba,
          catatanKapal: data.catatanKapal,
          catatanPurchasing: data.catatanPurchasing,
          createdBy: data.createdBy,
          items: data.items ?? [],
          reminderSent: data.reminderSent ?? false,
          reminderCount: data.reminderCount ?? 0,
          log: data.log ?? [],
        } as PengajuanPO
      })
      loadingPO.value = false
      checkReminders(role)
      checkEstimasiTiba(role)
    })
  }

  const stopListening = () => {
    unsubscribe?.()
    unsubscribe = null
  }

  // Fitur 1: cek estimasi tiba H-1
  const checkEstimasiTiba = (role?: string) => {
    if (!role) return
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    poList.value.forEach((po: PengajuanPO) => {
      if (po.status === 'dikirim' && po.estimasiTiba === tomorrowStr) {
        const key = `eta-${po.id}-${tomorrowStr}`
        const sudahAda = notifications.value.find((n) => n.id === key)
        if (!sudahAda) {
          notifications.value.unshift({
            id: key,
            pesan: role === 'kapal'
              ? `${po.noSPB} — barang tiba besok (${tomorrowStr}), siapkan penerimaan`
              : `${po.noSPB} — estimasi tiba besok di ${po.lokasiDocking || 'pelabuhan'}`,
            waktu: 'Notif H-1',
            dibaca: false,
            type: 'eta',
            poId: po.id,
          })
        }
      }
    })
  }

  // Fitur 7: reminder belum pasang khusus purchasing
  const checkReminders = (role?: string) => {
    if (role !== 'purchasing') return
    const belumPasang = poList.value.filter((po: PengajuanPO) =>
      po.status === 'dikonfirmasi' &&
      po.items.some((i: ItemBarang) => i.statusInstalasi !== 'terpasang')
    )
    belumPasang.forEach((po: PengajuanPO) => {
      const key = `reminder-${po.id}`
      const sudahAda = notifications.value.find((n) => n.id === key)
      if (!sudahAda) {
        const belumCount = po.items.filter((i: ItemBarang) => i.statusInstalasi !== 'terpasang').length
        notifications.value.unshift({
          id: key,
          pesan: `${po.noSPB || 'SPB'} — ${po.namaKapal || 'Kapal'}: ${belumCount} barang tiba belum dipasang`,
          waktu: 'Reminder otomatis',
          dibaca: false,
          type: 'reminder',
          poId: po.id,
        })
      }
    })
  }

  // Fitur 5: tambah log entry
  const addLog = async (poId: string, aksi: string, oleh: string, detail?: string) => {
    const entry: LogEntry = {
      waktu: new Date().toISOString(),
      aksi,
      oleh,
      detail,
    }
    await updateDoc(doc(getDb(), 'pengajuan', poId), {
      log: arrayUnion(entry),
    })
  }

  const createPO = async (data: {
    noSPB: string
    namaKapal: string
    items: ItemBarang[]
    catatanKapal?: string
    createdBy?: string
    namaUser?: string
  }) => {
    const today = new Date().toISOString().split('T')[0]
    const id = ulid()
    const initLog: LogEntry = {
      waktu: new Date().toISOString(),
      aksi: 'Pengajuan dibuat',
      oleh: data.namaUser || data.createdBy || 'Kapal',
      detail: `${data.items.length} barang`,
    }
    await setDoc(doc(getDb(), 'pengajuan', id), {
      status: 'diajukan',
      tanggalPengajuan: today,
      noSPB: data.noSPB,
      namaKapal: data.namaKapal,
      items: data.items,
      catatanKapal: data.catatanKapal || '',
      createdBy: data.createdBy || '',
      reminderCount: 0,
      reminderSent: false,
      log: [initLog],
      createdAt: serverTimestamp(),
    })
    addNotif(`SPB ${data.noSPB} — ${data.items.length} barang dikirim ke Purchasing`)
    return id
  }

  const updatePO = async (id: string, updates: Partial<PengajuanPO>, logEntry?: { aksi: string; oleh: string; detail?: string }) => {
    const ref = doc(getDb(), 'pengajuan', id)
    const { id: _id, log: _log, ...rest } = updates as PengajuanPO & { id: string }
    const payload: Record<string, unknown> = { ...rest, updatedAt: serverTimestamp() }
    if (logEntry) {
      payload.log = arrayUnion({
        waktu: new Date().toISOString(),
        aksi: logEntry.aksi,
        oleh: logEntry.oleh,
        detail: logEntry.detail,
      })
    }
    await updateDoc(ref, payload)
  }

  const updateItemInstalasi = async (
    poId: string,
    itemIndex: number,
    data: { lokasiPasang: string; teknisi: string; fotoBukti?: string; catatan?: string },
    namaUser?: string,
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
          ...(data.catatan ? { catatan: data.catatan } : {}),
        }
      }
      return item
    })
    const allDone = updatedItems.every((i: ItemBarang) => i.statusInstalasi === 'terpasang')
    const logEntry: LogEntry = {
      waktu: new Date().toISOString(),
      aksi: `Barang dipasang: ${po.items[itemIndex]?.nama}`,
      oleh: namaUser || data.teknisi,
      detail: `Lokasi: ${data.lokasiPasang}`,
    }
    await updateDoc(doc(getDb(), 'pengajuan', poId), {
      items: updatedItems,
      ...(allDone ? { status: 'selesai' } : {}),
      log: arrayUnion(logEntry),
      updatedAt: serverTimestamp(),
    })
    if (allDone) addNotif(`Semua barang SPB ${po.noSPB || poId} telah terpasang!`)
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
    notifications.value.forEach((n) => { n.dibaca = true })
  }

  const markOneRead = (id: string) => {
    const n = notifications.value.find((n) => n.id === id)
    if (n) n.dibaca = true
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.dibaca).length)

  const stats = computed(() => ({
    diajukan: poList.value.filter(p => p.status === 'diajukan').length,
    dikirim: poList.value.filter(p => p.status === 'dikirim').length,
    tiba: poList.value.filter(p => p.status === 'tiba').length,
    dikonfirmasi: poList.value.filter(p => p.status === 'dikonfirmasi').length,
    selesai: poList.value.filter(p => p.status === 'selesai').length,
    belumPasang: poList.value.filter(p =>
      p.status === 'dikonfirmasi' && p.items.some(i => i.statusInstalasi !== 'terpasang')
    ).length,
    // Fitur 7: count urgent
    urgentDiajukan: poList.value.filter(p =>
      p.status === 'diajukan' && p.items.some(i => i.urgensi === 'tinggi')
    ).length,
  }))

  const statusLabel = (status: StatusPO) => {
    const map: Record<StatusPO, string> = {
      draft: 'Draft', diajukan: 'Diajukan', divalidasi: 'Divalidasi',
      dikirim: 'Dalam Pengiriman', tiba: 'Tiba di Pelabuhan',
      dikonfirmasi: 'Dikonfirmasi', selesai: 'Selesai',
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
    addLog,
    addNotif,
    markAllRead,
    markOneRead,
    statusLabel,
    statusColor,
    urgensiColor,
    urgensiIcon,
  }
}
