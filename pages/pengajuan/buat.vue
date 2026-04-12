<template>
  <div class="p-4 space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/pengajuan">
        <Button variant="ghost" size="icon" class="h-8 w-8">
          <AppIcon name="chevronLeft" :size="16" />
        </Button>
      </NuxtLink>
      <div>
        <h1 class="text-base font-semibold">Buat Pengajuan PO</h1>
        <p class="text-xs text-muted-foreground">{{ items.length }} barang</p>
      </div>
    </div>

    <div v-if="role !== 'kapal'" class="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
      <AppIcon name="alert" :size="14" /> Hanya Pihak Kapal yang dapat membuat pengajuan.
    </div>

    <template v-else>
      <!-- Identitas -->
      <Card class="p-4 space-y-3">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Identitas Pengajuan</p>
        <div class="space-y-1.5">
          <label class="text-sm font-medium">No. SPB</label>
          <Input v-model="noSPB" placeholder="SPB-2026-001" />
          <p class="text-xs text-muted-foreground">Nomor Surat Permintaan Barang</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-medium">Nama Kapal</label>
          <Select v-model="namaKapal">
            <option value="">Pilih kapal...</option>
            <option>MV. Ocean Phoenix</option>
            <option>MV. Simore</option>
            <option>MV. Noah Asyera</option>
            <option>MV Tahta 2</option>
            <option>MV. Savior</option>
            <option>MV. Tiga Roda</option>
          </Select>
        </div>
      </Card>

      <!-- Barang -->
      <div class="space-y-3">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daftar Barang</p>

        <div v-if="items.length === 0" class="border border-dashed border-border rounded-lg py-8 text-center">
          <AppIcon name="package" :size="24" class="text-muted-foreground/40 mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">Belum ada barang</p>
        </div>

        <Card v-for="(item, idx) in items" :key="idx" class="p-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-muted-foreground">Barang #{{ idx + 1 }}</p>
            <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:text-destructive" @click="removeItem(idx)">
              <AppIcon name="trash" :size="13" />
            </Button>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium">Nama Barang</label>
            <Input v-model="item.nama" placeholder="Pompa Air Laut" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-sm font-medium">Qty</label>
              <Input v-model.number="item.qty" type="number" min="1" />
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium">Urgensi</label>
              <div class="flex gap-1">
                <button v-for="u in ['rendah','sedang','tinggi']" :key="u" type="button"
                  @click="item.urgensi = u as any"
                  :class="['flex-1 h-9 rounded-md text-xs font-medium border transition-colors',
                    item.urgensi === u ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent']">
                  {{ u[0].toUpperCase() }}
                </button>
              </div>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium">Spesifikasi</label>
            <Textarea v-model="item.spesifikasi" :rows="2" placeholder="Tipe, ukuran, kapasitas..." />
          </div>
        </Card>

        <Button variant="outline" class="w-full gap-1.5 border-dashed" @click="addItem">
          <AppIcon name="plus" :size="14" /> Tambah Barang
        </Button>
      </div>

      <!-- Catatan -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Catatan <span class="text-muted-foreground font-normal">(opsional)</span></label>
        <Textarea v-model="catatanKapal" :rows="3" placeholder="Catatan untuk Tim Purchasing..." />
      </div>

      <!-- Summary -->
      <div v-if="items.length > 0" class="rounded-md border border-border bg-secondary p-3 space-y-1.5 text-sm">
        <p class="font-medium">Ringkasan</p>
        <div class="space-y-1 text-muted-foreground">
          <div class="flex justify-between"><span>No. SPB</span><span class="text-foreground font-medium">{{ noSPB || '-' }}</span></div>
          <div class="flex justify-between"><span>Nama Kapal</span><span class="text-foreground font-medium">{{ namaKapal || '-' }}</span></div>
          <div class="flex justify-between"><span>Total Barang</span><span class="text-foreground font-medium">{{ items.length }} item</span></div>
        </div>
      </div>

      <Button class="w-full gap-1.5" size="lg" :disabled="!isValid || submitting" @click="submitForm">
        <AppIcon v-if="submitting" name="loader" :size="15" class="animate-spin" />
        <AppIcon v-else name="send" :size="15" />
        {{ submitting ? 'Mengirim...' : 'Kirim ke Purchasing' }}
      </Button>
      <div class="h-2" />
    </template>

    <Transition name="fade">
      <div v-if="showSuccess" class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium z-50 whitespace-nowrap shadow-lg flex items-center gap-2">
        <AppIcon name="check" :size="14" /> Pengajuan berhasil dikirim
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { ItemBarang } from '~/composables/useStore'

const { userProfile } = useAuth()
const { createPO } = useStore()
const router = useRouter()

const role = computed(() => userProfile.value?.role ?? 'kapal')
const showSuccess = ref(false), submitting = ref(false)
const noSPB = ref(''), namaKapal = ref(''), catatanKapal = ref('')

const makeItem = (): ItemBarang => ({ nama: '', qty: 1, spesifikasi: '', urgensi: 'sedang', statusInstalasi: 'belum' })
const items = ref<ItemBarang[]>([makeItem()])
const addItem = () => items.value.push(makeItem())
const removeItem = (idx: number) => { if (items.value.length > 1) items.value.splice(idx, 1) }

const isValid = computed(() =>
  noSPB.value.trim() !== '' && namaKapal.value.trim() !== '' &&
  items.value.length > 0 && items.value.every(i => i.nama.trim() && i.qty > 0 && i.spesifikasi.trim())
)

const submitForm = async () => {
  if (!isValid.value) return
  submitting.value = true
  try {
    await createPO({ noSPB: noSPB.value.trim(), namaKapal: namaKapal.value.trim(), items: items.value, catatanKapal: catatanKapal.value, createdBy: userProfile.value?.uid })
    showSuccess.value = true
    setTimeout(() => router.push('/pengajuan'), 1500)
  } finally { submitting.value = false }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
