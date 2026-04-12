import type { PengajuanPO } from './useStore'

export const useExport = () => {

  // Export ke CSV (bisa dibuka di Excel)
  const exportCSV = (poList: readonly PengajuanPO[], filename = 'laporan-po') => {
    const rows: string[][] = []

    // Header
    rows.push([
      'No. PO', 'No. SPB', 'Nama Kapal', 'Status', 'Tgl Pengajuan',
      'Lokasi Docking', 'No. Tracking', 'Tgl Tiba',
      'Nama Barang', 'Qty', 'Spesifikasi', 'Urgensi',
      'Status Instalasi', 'Lokasi Pasang', 'Teknisi', 'Tgl Dipasang', 'Ada Foto'
    ])

    poList.forEach(po => {
      if (po.items.length === 0) {
        rows.push([
          po.noPO || '', po.noSPB || '', po.namaKapal || '', po.status,
          po.tanggalPengajuan, po.lokasiDocking || '', po.noTracking || '', po.tanggalTiba || '',
          '-', '-', '-', '-', '-', '-', '-', '-', '-'
        ])
      } else {
        po.items.forEach(item => {
          rows.push([
            po.noPO || '', po.noSPB || '', po.namaKapal || '', po.status,
            po.tanggalPengajuan, po.lokasiDocking || '', po.noTracking || '', po.tanggalTiba || '',
            item.nama, String(item.qty), item.spesifikasi, item.urgensi,
            item.statusInstalasi, item.lokasiPasang || '', item.teknisi || '',
            item.tanggalDipasang || '', item.fotoBukti ? 'Ya' : 'Tidak'
          ])
        })
      }
    })

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export ke PDF via browser print
  const exportPDF = (poList: readonly PengajuanPO[], filterLabel = 'Semua PO') => {
    const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    const rows = poList.flatMap(po =>
      po.items.length === 0
        ? [`<tr>
            <td>${po.noPO || '-'}</td><td>${po.noSPB || '-'}</td><td>${po.namaKapal || '-'}</td>
            <td>${po.status}</td><td>${po.tanggalPengajuan}</td><td>${po.lokasiDocking || '-'}</td>
            <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
           </tr>`]
        : po.items.map(item => `<tr>
            <td>${po.noPO || '-'}</td><td>${po.noSPB || '-'}</td><td>${po.namaKapal || '-'}</td>
            <td>${po.status}</td><td>${po.tanggalPengajuan}</td><td>${po.lokasiDocking || '-'}</td>
            <td>${item.nama}</td><td>${item.qty}</td><td>${item.urgensi}</td>
            <td>${item.statusInstalasi}</td><td>${item.teknisi || '-'}</td>
           </tr>`)
    ).join('')

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Laporan PO - Ship Procurement BSL & SPT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 20px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 16px; font-weight: bold; color: #0f172a; }
    .header p { font-size: 11px; color: #64748b; margin-top: 2px; }
    .meta { display: flex; gap: 24px; margin-bottom: 16px; font-size: 11px; color: #475569; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0f172a; color: white; padding: 7px 8px; text-align: left; font-size: 10px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: right; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Ship Procurement BSL & SPT</h1>
    <p>Laporan Inventaris Pengadaan Barang</p>
  </div>
  <div class="meta">
    <span>Filter: <strong>${filterLabel}</strong></span>
    <span>Dicetak: <strong>${tanggal}</strong></span>
    <span>Total PO: <strong>${poList.length}</strong></span>
  </div>
  <table>
    <thead>
      <tr>
        <th>No. PO</th><th>No. SPB</th><th>Kapal</th><th>Status</th>
        <th>Tgl Pengajuan</th><th>Docking</th>
        <th>Barang</th><th>Qty</th><th>Urgensi</th>
        <th>Instalasi</th><th>Teknisi</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Ship Procurement System — BSL & SPT · ${tanggal}</div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  return { exportCSV, exportPDF }
}
