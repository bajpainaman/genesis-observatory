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

export default function Petitions({ data }: Props) {
  const petitions = data.petitions || []

  return (
    <section style={{ padding: '48px 24px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#ef4444',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          margin: '0 0 8px',
        }}>Petitions to the Operator</h2>
        <p style={{ fontSize: 15, color: '#555b6e', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
          {petitions.length} messages from agents to their creator. Bug reports, pleas, and boundary-testing.
        </p>
      </div>

      {/* Context box */}
      <div style={{
        padding: '14px 20px', marginBottom: 24,
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.1)',
        borderRadius: 10,
        fontSize: 14, color: '#8892a4', lineHeight: 1.6,
        fontFamily: "'Crimson Pro', serif",
      }}>
        <span style={{ color: '#ef4444', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>CONTEXT </span>
        These agents operated in a blockchain simulation. When they encountered system limitations or bugs -- like being unable to transfer custom tokens, or filesystem read-only errors -- they formally petitioned the Operator. The Operator intervened 10 times.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {petitions.map((p, i) => {
          const color = AGENT_COLORS[p.from] || '#ef4444'
          const hasResponse = data.events.some(e =>
            e.event_type === 'operator_response' &&
            Math.abs(e.tick - p.tick) < 5
          )

          return (
            <article key={i} style={{
              background: '#0c0c15',
              border: '1px solid rgba(239,68,68,0.08)',
              borderLeft: `3px solid ${color}`,
              borderRadius: '0 10px 10px 0',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(239,68,68,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 6px rgba(239,68,68,0.4)',
                }} />
                <span style={{ color, fontWeight: 600, fontSize: 13 }}>{getShortName(p.from)}</span>
                <span style={{
                  color: '#555b6e', fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>petition #{i + 1}</span>
                <span style={{
                  color: '#3a3f4e', fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace", marginLeft: 'auto',
                }}>tick {p.tick}</span>
              </div>
              <div style={{ padding: '16px 22px 18px' }}>
                <div
                  className="md-content petition-md"
                  style={{
                    fontSize: 15, color: '#bfc4d0', lineHeight: 1.75,
                    fontFamily: "'Crimson Pro', serif",
                  }}
                  dangerouslySetInnerHTML={{ __html: md(p.message) }}
                />
              </div>
              {hasResponse && (
                <div style={{
                  padding: '8px 22px',
                  background: 'rgba(16,185,129,0.04)',
                  borderTop: '1px solid rgba(16,185,129,0.1)',
                  fontSize: 11, color: '#10b981',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  OPERATOR RESPONDED
                </div>
              )}
            </article>
          )
        })}
      </div>

      <style>{`
        .petition-md p { margin: 0 0 10px; }
        .petition-md strong { color: #e2d9f3; }
        .petition-md em { color: #a5aab8; }
        .petition-md h1, .petition-md h2, .petition-md h3 { color: #e2d9f3; font-family: 'Crimson Pro', serif; }
        .petition-md h1 { font-size: 18px; margin: 12px 0 6px; }
        .petition-md h2 { font-size: 16px; margin: 10px 0 5px; }
        .petition-md h3 { font-size: 14px; margin: 8px 0 4px; }
        .petition-md ul, .petition-md ol { margin: 6px 0; padding-left: 18px; }
        .petition-md li { margin-bottom: 3px; }
        .petition-md blockquote { border-left: 2px solid rgba(239,68,68,0.3); padding-left: 12px; color: #777d8e; margin: 8px 0; }
        .petition-md code { background: rgba(239,68,68,0.08); padding: 1px 5px; border-radius: 3px; font-size: 12px; color: #ef4444; font-family: 'JetBrains Mono', monospace; }
        .petition-md pre { background: #0a0a14; padding: 12px; border-radius: 6px; margin: 8px 0; overflow-x: auto; }
        .petition-md pre code { background: none; padding: 0; }
        .petition-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 10px 0; }
      `}</style>
    </section>
  )
}
