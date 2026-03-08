// PDF Receipt Generator using jsPDF
// Generates printable billing receipts

export async function generateReceipt(fee, resident, settings = {}) {
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
  const W = doc.internal.pageSize.getWidth()
  const currency = settings.currency_symbol || '৳'
  const hostelName = settings.hostel_name || 'DormHQ Hostel'
  const hostelAddr = settings.address || ''
  const hostelPhone = settings.phone || ''

  // ── Header bar ──────────────────────────────────────────────
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, 30, 'F')

  // Hostel name
  doc.setTextColor(240, 165, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(hostelName, W / 2, 12, { align: 'center' })

  doc.setTextColor(180, 180, 180)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  if (hostelAddr) doc.text(hostelAddr, W / 2, 18, { align: 'center' })
  if (hostelPhone) doc.text(`Tel: ${hostelPhone}`, W / 2, 23, { align: 'center' })

  // ── Receipt title ────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT RECEIPT', W / 2, 40, { align: 'center' })

  // Divider
  doc.setDrawColor(240, 165, 0)
  doc.setLineWidth(0.5)
  doc.line(10, 43, W - 10, 43)

  // ── Receipt meta (two columns) ───────────────────────────────
  const leftX = 12, rightX = W / 2 + 5
  let y = 50

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)

  const metaLeft = [
    ['Receipt No.', fee.receipt_number || `RCP-${fee.id?.slice(0,8)?.toUpperCase() || 'N/A'}`],
    ['Date', fee.paid_date ? new Date(fee.paid_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })],
    ['Payment Method', (fee.payment_method || 'Cash').toUpperCase()],
  ]
  const metaRight = [
    ['Resident', resident?.full_name || '—'],
    ['Phone', resident?.phone || '—'],
    ['Room', fee.room_number || '—'],
  ]

  metaLeft.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text(label + ':', leftX, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(value, leftX + 30, y)
    y += 7
  })

  y = 50
  metaRight.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text(label + ':', rightX, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(value, rightX + 22, y)
    y += 7
  })

  y = Math.max(y, 73)
  doc.setDrawColor(220, 220, 220)
  doc.line(10, y, W - 10, y)
  y += 6

  // ── Fee breakdown table ──────────────────────────────────────
  doc.autoTable({
    startY: y,
    margin: { left: 10, right: 10 },
    head: [['Description', 'Amount']],
    body: [
      [
        fee.fee_type?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) +
          (fee.description ? `\n${fee.description}` : '') +
          (fee.note ? `\nNote: ${fee.note}` : ''),
        `${currency}${(fee.amount || 0).toLocaleString()}`
      ],
      ...(fee.paid_amount < fee.amount ? [['Previous Balance', `${currency}${(fee.amount - fee.paid_amount).toLocaleString()}`]] : []),
    ],
    foot: [
      ['TOTAL PAID', `${currency}${(fee.paid_amount || fee.amount || 0).toLocaleString()}`]
    ],
    headStyles: { fillColor: [15, 23, 42], textColor: [240, 165, 0], fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [240, 165, 0], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 35, halign: 'right' } },
    styles: { cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.2 },
  })

  y = doc.lastAutoTable.finalY + 8

  // ── Transaction reference ────────────────────────────────────
  if (fee.transaction_ref) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('Transaction Ref:', 12, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(fee.transaction_ref, 47, y)
    y += 8
  }

  // ── Status stamp ─────────────────────────────────────────────
  doc.setDrawColor(63, 185, 80)
  doc.setLineWidth(1.5)
  doc.roundedRect(W - 45, y - 6, 34, 12, 2, 2, 'S')
  doc.setTextColor(63, 185, 80)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('PAID ✓', W - 28, y + 2, { align: 'center' })

  // ── Footer ───────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(245, 245, 245)
  doc.rect(0, pageH - 18, W, 18, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140, 140, 140)
  doc.text('This is a computer-generated receipt and does not require a physical signature.', W / 2, pageH - 11, { align: 'center' })
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')} · ${hostelName}`, W / 2, pageH - 5, { align: 'center' })

  return doc
}

export async function downloadReceipt(fee, resident, settings) {
  const doc = await generateReceipt(fee, resident, settings)
  const filename = `Receipt-${fee.receipt_number || fee.id?.slice(0,8)}-${resident?.full_name?.replace(/\s+/g,'_') || 'receipt'}.pdf`
  doc.save(filename)
}

export async function printReceipt(fee, resident, settings) {
  const doc = await generateReceipt(fee, resident, settings)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    win.addEventListener('load', () => {
      win.focus()
      win.print()
    })
  }
}
