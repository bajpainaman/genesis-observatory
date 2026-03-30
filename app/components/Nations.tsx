'use client'

import { marked } from 'marked'
import { GenesisData } from './types'
import { AGENT_COLORS, getShortName } from './constants'

marked.setOptions({ breaks: true, gfm: true })

interface Props {
  data: GenesisData
}

function md(s: string): string {
  try { return marked.parse(s || '') as string } catch { return s || '' }
}

export default function Nations({ data }: Props) {
  const nation = Object.entries(data.proposals).find(([k, v]) => v.type === 'found_nation')
  const services = Object.entries(data.proposals).filter(([k]) => k.startsWith('service:'))

  return (
    <section style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#10b981',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          margin: '0 0 8px',
        }}>Governance & Institutions</h2>
        <p style={{ fontSize: 15, color: '#555b6e', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
          The nation they founded, the charter they wrote, and the services they built.
        </p>
      </div>

      {/* Nation card */}
      {nation && (
        <div style={{
          background: '#0c0c15',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 28,
        }}>
          <div style={{
            padding: '24px 28px 20px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 60%)',
            borderBottom: '1px solid rgba(16,185,129,0.1)',
          }}>
            <div style={{
              fontSize: 9, color: '#10b981', fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 8,
            }}>SOVEREIGN NATION</div>
            <h3 style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 32, fontWeight: 700, color: '#e2d9f3',
              margin: '0 0 8px', letterSpacing: '-0.02em',
            }}>{nation[1].name}</h3>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#555b6e' }}>
              <span>Founded by <span style={{ color: AGENT_COLORS[nation[1].founder as string] || '#10b981', fontWeight: 500 }}>
                {getShortName(nation[1].founder as string)}
              </span></span>
              {nation[1].tax_rate !== undefined && (
                <span>Tax: {String(nation[1].tax_rate)} bps</span>
              )}
              {nation[1].citizens && (
                <span>Citizens: {(nation[1].citizens as string[]).length}</span>
              )}
            </div>
          </div>

          {/* Charter */}
          {nation[1].charter && (
            <div style={{ padding: '24px 28px 28px' }}>
              <div style={{
                fontSize: 10, color: '#10b98188', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 14,
              }}>CHARTER</div>
              <div
                className="md-content charter-md"
                style={{
                  fontSize: 15, color: '#bfc4d0', lineHeight: 1.8,
                  fontFamily: "'Crimson Pro', serif",
                }}
                dangerouslySetInnerHTML={{ __html: md(nation[1].charter as string) }}
              />
            </div>
          )}
        </div>
      )}

      {/* Services marketplace */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 16,
          textAlign: 'center',
        }}>Marketplace -- {services.length} Services Registered</div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 10,
        }}>
          {services.map(([key, svc]) => {
            const color = AGENT_COLORS[svc.provider as string] || '#8b5cf6'
            return (
              <div key={key} style={{
                background: '#0c0c15',
                border: '1px solid rgba(255,255,255,0.04)',
                borderLeft: `2px solid ${color}55`,
                borderRadius: '0 8px 8px 0',
                padding: '12px 16px',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${color}33`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.04)'}
              >
                <div style={{
                  fontSize: 13, color: '#bfc4d0', fontWeight: 500,
                  lineHeight: 1.3, marginBottom: 6,
                }}>{svc.name}</div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: 11, color,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{getShortName(svc.provider as string)}</span>
                  {svc.price && (
                    <span style={{
                      fontSize: 11, color: '#10b981',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{String(svc.price)}G</span>
                  )}
                </div>
                {svc.description && (
                  <div style={{
                    fontSize: 12, color: '#555b6e', marginTop: 6,
                    lineHeight: 1.5, fontFamily: "'Crimson Pro', serif",
                    overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                  }}>{String(svc.description)}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        .charter-md p { margin: 0 0 10px; }
        .charter-md strong { color: #e2d9f3; }
        .charter-md em { color: #a5aab8; }
        .charter-md h1, .charter-md h2, .charter-md h3 { color: #10b981; font-family: 'Crimson Pro', serif; }
        .charter-md h1 { font-size: 20px; margin: 14px 0 8px; }
        .charter-md h2 { font-size: 17px; margin: 12px 0 6px; }
        .charter-md h3 { font-size: 15px; margin: 10px 0 5px; }
        .charter-md ul, .charter-md ol { margin: 8px 0; padding-left: 20px; }
        .charter-md li { margin-bottom: 4px; }
        .charter-md blockquote { border-left: 3px solid rgba(16,185,129,0.3); padding-left: 14px; color: #777d8e; margin: 10px 0; }
        .charter-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 14px 0; }
      `}</style>
    </section>
  )
}
