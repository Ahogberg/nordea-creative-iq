// Varumärkt PDF-one-pager för kampanjplanen — ren jspdf-vektor (ingen
// html2canvas) så texten blir skarp och färgerna exakta.
// Nordea Sans finns bara som woff/woff2 (jspdf kräver TTF) → helvetica.

import { jsPDF } from 'jspdf';

const NORDEA_BLUE: [number, number, number] = [0, 0, 160];
const GRAY_600: [number, number, number] = [75, 85, 99];
const GRAY_400: [number, number, number] = [156, 163, 175];

export interface PlanExportChannel {
  label: string;
  budget: number;
  impressions: number;
  reach: number;
  clicks: number;
  frequency: number;
}

export interface PlanExportData {
  name: string;
  budget: number;
  durationDays: number;
  geos: string[];
  ageRange: [number, number];
  audienceSize: number;
  kpis: Array<{ label: string; value: string }>;
  channels: PlanExportChannel[];
  warnings: string[];
}

const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function exportCampaignPlanPdf(data: PlanExportData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 0;

  // ── Header band ──
  doc.setFillColor(...NORDEA_BLUE);
  doc.rect(0, 0, pageW, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Nordea CreativeIQ', margin, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Kampanjplan — one-pager', margin, 21);
  doc.setFontSize(9);
  doc.text(
    new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' }),
    pageW - margin,
    14,
    { align: 'right' }
  );
  y = 44;

  // ── Campaign name + basics ──
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(data.name, margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY_600);
  doc.text(
    `Budget ${fmt(data.budget)} SEK  ·  ${data.durationDays} dagar  ·  ${data.geos.join(', ')}  ·  ${data.ageRange[0]}–${data.ageRange[1]} år  ·  Målgrupp ${fmt(data.audienceSize)}`,
    margin,
    y
  );
  y += 10;

  // ── KPI row ──
  const kpiW = (pageW - margin * 2 - 3 * (data.kpis.length - 1)) / data.kpis.length;
  data.kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + 3);
    doc.setFillColor(245, 246, 250);
    doc.roundedRect(x, y, kpiW, 20, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_400);
    doc.text(kpi.label, x + 4, y + 6);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NORDEA_BLUE);
    doc.text(kpi.value, x + 4, y + 14);
    doc.setFont('helvetica', 'normal');
  });
  y += 29;

  // ── Channel table ──
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Kanalfördelning', margin, y);
  y += 6;

  const cols = [
    { header: 'Kanal', w: 44, align: 'left' as const },
    { header: 'Budget (SEK)', w: 30, align: 'right' as const },
    { header: 'Visningar', w: 30, align: 'right' as const },
    { header: 'Räckvidd', w: 28, align: 'right' as const },
    { header: 'Klick', w: 22, align: 'right' as const },
    { header: 'Frekvens', w: 22, align: 'right' as const },
  ];

  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_400);
  let x = margin;
  cols.forEach((c) => {
    doc.text(c.header, c.align === 'right' ? x + c.w : x, y, { align: c.align });
    x += c.w;
  });
  y += 2;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  for (const ch of data.channels) {
    const cells = [
      ch.label,
      fmt(ch.budget),
      fmt(ch.impressions),
      fmt(ch.reach),
      fmt(ch.clicks),
      ch.frequency.toFixed(1),
    ];
    x = margin;
    doc.setTextColor(31, 41, 55);
    cells.forEach((cell, i) => {
      const c = cols[i];
      doc.text(cell, c.align === 'right' ? x + c.w : x, y, { align: c.align });
      x += c.w;
    });
    y += 6.5;
  }

  // Total row
  doc.setDrawColor(0, 0, 160);
  doc.line(margin, y - 3.5, pageW - margin, y - 3.5);
  doc.setFont('helvetica', 'bold');
  const totals = [
    'Totalt',
    fmt(data.channels.reduce((s, c) => s + c.budget, 0)),
    fmt(data.channels.reduce((s, c) => s + c.impressions, 0)),
    fmt(data.channels.reduce((s, c) => s + c.reach, 0)),
    fmt(data.channels.reduce((s, c) => s + c.clicks, 0)),
    '',
  ];
  x = margin;
  totals.forEach((cell, i) => {
    const c = cols[i];
    doc.text(cell, c.align === 'right' ? x + c.w : x, y + 1, { align: c.align });
    x += c.w;
  });
  y += 12;

  // ── Warnings ──
  if (data.warnings.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 120, 0);
    doc.text('Observera', margin, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    for (const w of data.warnings) {
      const lines = doc.splitTextToSize(`• ${w}`, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 4.2 + 1;
    }
    y += 4;
  }

  // ── Footnote ──
  const footY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, footY - 4, pageW - margin, footY - 4);
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_400);
  doc.text(
    'Prognosen bygger på schablon-CPM/CTR per kanal och historiska räckviddsfaktorer. Faktiskt utfall varierar med kreativ kvalitet, säsong och auktionstryck.',
    margin,
    footY,
    { maxWidth: pageW - margin * 2 }
  );

  doc.save(`kampanjplan-${data.name.toLowerCase().replace(/[^a-z0-9åäö]+/gi, '-')}.pdf`);
}
