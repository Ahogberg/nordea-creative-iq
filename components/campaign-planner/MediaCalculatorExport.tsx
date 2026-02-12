import { forwardRef } from 'react';

interface ExportProps {
  mode: 'budget' | 'goal';
  budget: number;
  cpm: number;
  ctr: number;
  frequencyCap: number;
  discrepancyRate: number;
  results: {
    grossImpressions: number;
    netImpressions: number;
    clicks: number;
    reach: number;
    cpc: number;
    frequency: number;
    requiredBudget: number;
    actualSpend: number;
  };
}

function fmt(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const MediaCalculatorExport = forwardRef<HTMLDivElement, ExportProps>(
  ({ mode, budget, cpm, ctr, frequencyCap, discrepancyRate, results }, ref) => {
    const displayBudget = mode === 'budget' ? budget : results.requiredBudget;
    const lostImpressions = results.grossImpressions - results.netImpressions;
    const netPct = 100 - discrepancyRate;

    return (
      <div
        ref={ref}
        style={{
          width: '900px',
          backgroundColor: '#FFFFFF',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#1a1a1a',
        }}
      >
        {/* Branded header bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0000A0 0%, #0000C8 100%)',
            padding: '36px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '22px',
              }}
            >
              N
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Nordea CreativeIQ
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '2px 0 0 0' }}>
                Mediaberäkning
              </p>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            {new Date().toLocaleDateString('sv-SE')}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '40px 48px 36px' }}>
          {/* Budget highlight */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f0f0ff 0%, #e8e8ff 100%)',
              borderRadius: '16px',
              padding: '28px 32px',
              marginBottom: '32px',
              border: '1px solid #d0d0ff',
            }}
          >
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 6px 0', fontWeight: 500 }}>
              {mode === 'budget' ? 'Total budget' : 'Beräknad budget'}
            </p>
            <p style={{ fontSize: '40px', fontWeight: 700, color: '#0000A0', margin: 0, letterSpacing: '-0.5px' }}>
              {fmt(displayBudget)} SEK
            </p>
          </div>

          {/* Parameters row */}
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              margin: '0 0 14px 0',
            }}
          >
            Parametrar
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0',
              marginBottom: '32px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            {[
              { label: 'CPM', value: `${cpm} SEK` },
              { label: 'CTR', value: `${ctr}%` },
              { label: 'Frequency Cap', value: `${frequencyCap}x` },
              { label: 'Discrepancy', value: `${discrepancyRate}%` },
            ].map((param, i) => (
              <div
                key={param.label}
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  borderRight: i < 3 ? '1px solid #e5e7eb' : 'none',
                  backgroundColor: '#fafafa',
                }}
              >
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 6px 0', fontWeight: 500 }}>
                  {param.label}
                </p>
                <p style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#1f2937' }}>
                  {param.value}
                </p>
              </div>
            ))}
          </div>

          {/* Results grid */}
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              margin: '0 0 14px 0',
            }}
          >
            Prognostiserat resultat
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '28px',
            }}
          >
            {[
              { label: 'Impressions (brutto)', value: fmt(results.grossImpressions), highlight: true },
              { label: 'Klick', value: fmt(results.clicks), highlight: true },
              { label: 'Räckvidd (unik)', value: fmt(results.reach), highlight: true },
              { label: 'Kostnad per klick', value: `${results.cpc.toFixed(2)} SEK`, highlight: false },
              { label: 'Genomsnittlig frekvens', value: `${results.frequency.toFixed(1)}x`, highlight: false },
              { label: 'Faktisk kostnad', value: `${fmt(results.actualSpend)} SEK`, highlight: false },
            ].map((metric) => (
              <div
                key={metric.label}
                style={{
                  backgroundColor: metric.highlight ? '#f0f4ff' : '#f9fafb',
                  borderRadius: '12px',
                  padding: '20px',
                  border: metric.highlight ? '1px solid #d0d8ff' : '1px solid #f0f0f0',
                }}
              >
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 8px 0' }}>{metric.label}</p>
                <p
                  style={{
                    fontSize: metric.highlight ? '26px' : '20px',
                    fontWeight: 700,
                    margin: 0,
                    color: metric.highlight ? '#0000A0' : '#1f2937',
                  }}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          {/* Discrepancy section */}
          <div
            style={{
              backgroundColor: '#fffbeb',
              borderRadius: '12px',
              padding: '20px 24px',
              border: '1px solid #fde68a',
              marginBottom: '28px',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', margin: '0 0 12px 0' }}>
              Click Discrepancy ({discrepancyRate}%)
            </p>

            {/* Visual bar */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#92400e',
                  marginBottom: '4px',
                }}
              >
                <span>Köpta: {fmt(results.grossImpressions)}</span>
                <span>Levererade: {fmt(results.netImpressions)}</span>
              </div>
              <div
                style={{
                  height: '10px',
                  backgroundColor: '#fde68a',
                  borderRadius: '5px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${netPct}%`,
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    borderRadius: '5px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(245,158,11,0.1)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <p style={{ fontSize: '10px', color: '#b45309', margin: '0 0 2px 0' }}>Förlorade impressions</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  {fmt(lostImpressions)}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(245,158,11,0.1)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <p style={{ fontSize: '10px', color: '#b45309', margin: '0 0 2px 0' }}>Faktisk kostnad</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  {fmt(results.actualSpend)} SEK
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
              Genererad med Nordea CreativeIQ
            </p>
            <p style={{ fontSize: '11px', color: '#d1d5db', margin: 0 }}>
              Internt verktyg - ej för extern distribution
            </p>
          </div>
        </div>
      </div>
    );
  }
);

MediaCalculatorExport.displayName = 'MediaCalculatorExport';
