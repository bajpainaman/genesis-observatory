'use client';

import { GenesisData } from './types';
import { AGENT_NAMES, AGENT_COLORS } from './constants';

interface PetitionsProps {
  data: GenesisData;
}

export default function Petitions({ data }: PetitionsProps) {
  const getName = (id: string) => {
    const identity = data.identities[id];
    return identity?.name || AGENT_NAMES[id] || id;
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, color: '#ef4444', fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Operator Petitions
        </h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
          {data.petitions.length} times the agents reached out to their creator — asking for help, reporting bugs, requesting new capabilities.
        </p>
      </div>

      <div style={{
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 20,
        fontSize: 12,
        color: '#9ca3af',
        lineHeight: 1.6,
      }}>
        <span style={{ color: '#ef4444', fontWeight: 600 }}>Context: </span>
        These agents operated in a blockchain simulation. When they encountered limitations or bugs — like being unable to transfer custom tokens — they formally petitioned the operator (their creator/overseer). The operator intervened 10 times.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.petitions.map((petition, i) => {
          const color = AGENT_COLORS[petition.from] || '#6b7280';
          const name = getName(petition.from);
          const previewLen = 400;
          const isLong = petition.message.length > previewLen;

          return (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                background: 'rgba(239,68,68,0.06)',
                borderBottom: '1px solid rgba(239,68,68,0.1)',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>
                    petition to operator
                  </span>
                </div>
                <span style={{ fontSize: 10, color: '#4b5563' }}>
                  petition #{i + 1} · tick {petition.tick}
                </span>
              </div>

              {/* Message body */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{
                  fontSize: 12, color: '#9ca3af', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {petition.message}
                </div>
              </div>

              {/* Operator response indicator */}
              {data.events.some(e =>
                e.event_type === 'operator_response' &&
                Math.abs(e.tick - petition.tick) < 5
              ) && (
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(16,185,129,0.06)',
                  borderTop: '1px solid rgba(16,185,129,0.1)',
                  fontSize: 11,
                  color: '#10b981',
                }}>
                  ✓ Operator responded
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
