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

    return (
      <div
        ref={ref}
        style={{
          width: '800px',
          padding: '48px',
          backgroundColor: '#FFFFFF',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#1a1a1a',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#0000A0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '20px',
            }}
          >
            N
          </div>
          <span style={{ fontSize: '24px', fontWeight: 600 }}>Nordea</span>
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          Mediaberäkning
        </p>

        {/* Budget */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            {mode === 'budget' ? 'Budget' : 'Beräknad budget'}
          </p>
          <p style={{ fontSize: '36px', fontWeight: 600, color: '#0000A0', margin: 0 }}>
            {fmt(displayBudget)} SEK
          </p>
        </div>

        <div style={{ height: '1px', backgroundColor: '#e5e5e5', marginBottom: '24px' }} />

        {/* Parameters */}
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            marginBottom: '16px',
          }}
        >
          Parametrar
        </p>
        <div style={{ display: 'flex', gap: '48px', marginBottom: '32px' }}>
          {[
            { label: 'CPM', value: `${cpm} SEK` },
            { label: 'CTR', value: `${ctr}%` },
            { label: 'Frequency', value: `${frequencyCap}x` },
            { label: 'Discrepancy', value: `${discrepancyRate}%` },
          ].map((param) => (
            <div key={param.label}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', margin: '0 0 4px 0' }}>
                {param.label}
              </p>
              <p style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>{param.value}</p>
            </div>
          ))}
        </div>

        <div style={{ height: '1px', backgroundColor: '#e5e5e5', marginBottom: '24px' }} />

        {/* Results */}
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            marginBottom: '16px',
          }}
        >
          Resultat
        </p>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
          {[
            { label: 'Impressions', value: fmt(results.grossImpressions) },
            { label: 'Klick', value: fmt(results.clicks) },
            { label: 'Räckvidd', value: fmt(results.reach) },
            { label: 'CPC', value: `${results.cpc.toFixed(2)} SEK` },
            { label: 'Frekvens', value: `${results.frequency.toFixed(1)}x` },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '20px 24px',
                minWidth: '140px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0' }}>{metric.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Discrepancy note */}
        <div
          style={{
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '32px',
          }}
        >
          <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
            Efter discrepancy ({discrepancyRate}%):{' '}
            <strong>{fmt(results.netImpressions)}</strong> levererade impressions
          </p>
        </div>

        {/* Footer */}
        <div style={{ height: '1px', backgroundColor: '#e5e5e5', marginBottom: '16px' }} />
        <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'right' as const, margin: 0 }}>
          Genererad med Nordea CreativeIQ &bull; {new Date().toLocaleDateString('sv-SE')}
        </p>
      </div>
    );
  }
);

MediaCalculatorExport.displayName = 'MediaCalculatorExport';
