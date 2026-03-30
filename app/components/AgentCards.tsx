'use client'

import { useMemo } from 'react'
import { marked } from 'marked'
import { GenesisData } from './types'
import { AGENT_COLORS, AGENT_NAMES, AGENT_PARENTS, isChild, getShortName } from './constants'

interface Props {
  data: GenesisData
  selectedAgent: string | null
  onSelectAgent: (id: string | null) => void
}

function md(s: string): string {
  try { return marked.parse(s || '') as string } catch { return s || '' }
}

export default function AgentCards({ data, selectedAgent, onSelectAgent }: Props) {
  const agent = selectedAgent ? data.agents.find(a => a.id === selectedAgent) : null
  const identity = selectedAgent ? data.identities[selectedAgent] : null

  const dmCounts = useMemo(() => {
    if (!selectedAgent) return {}
    const counts: Record<string, number> = {}
    data.messages.filter(m => m.channel === 'dm').forEach(m => {
      if (m.from_agent === selectedAgent) counts[m.to_agent!] = (counts[m.to_agent!] || 0) + 1
      if (m.to_agent === selectedAgent) counts[m.from_agent] = (counts[m.from_agent] || 0) + 1
    })
    return counts
  }, [selectedAgent, data.messages])

  const townHallCount = useMemo(() => {
    if (!selectedAgent) return 0
    return data.messages.filter(m => m.channel === 'town_hall' && m.from_agent === selectedAgent).length
  }, [selectedAgent, data.messages])

  const eventCount = useMemo(() => {
    if (!selectedAgent) return 0
    return data.events.filter(e => e.agent_id === selectedAgent).length
  }, [selectedAgent, data.events])

  if (!selectedAgent || !agent) {
    return (
      <section style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#8b5cf6',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            margin: '0 0 8px',
          }}>Agent Dossiers</h2>
          <p style={{ fontSize: 14, color: '#555b6e', margin: 0 }}>
            Select an agent from the constellation above to read their full identity.
          </p>
        </div>

        {/* Mini cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {data.agents.map(a => {
            const id = data.identities[a.id]
            const color = AGENT_COLORS[a.id] || '#8b5cf6'
            const child = isChild(a.id)
            const name = id?.name || AGENT_NAMES[a.id] || a.id

            return (
              <div
                key={a.id}
                onClick={() => onSelectAgent(a.id)}
                style={{
                  background: '#0d0d14',
                  border: `1px solid ${color}22`,
                  borderRadius: 10,
                  padding: '18px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s, transform 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}55`
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}22`
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                {/* Subtle corner accent */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 60, height: 60,
                  background: `radial-gradient(circle at 100% 0%, ${color}0a, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44)`,
                    boxShadow: `0 0 12px ${color}33`,
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ color, fontWeight: 600, fontSize: 14 }}>{name}</div>
                    <div style={{
                      fontSize: 10, color: '#555b6e',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {a.id} {child && <span style={{ color: '#f59e0b' }}>-- GEN 1</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#444a5a', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>BALANCE</span>
                    <div style={{ color: '#c4c9d4' }}>{a.balance.toLocaleString()}G</div>
                  </div>
                  <div>
                    <span style={{ color: '#444a5a', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>LIFESPAN</span>
                    <div style={{ color: '#c4c9d4' }}>{a.lifespan} ticks</div>
                  </div>
                </div>

                {id?.persona && (
                  <div style={{
                    marginTop: 10, fontSize: 12, color: '#777d8e',
                    lineHeight: 1.5, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                    fontFamily: "'Crimson Pro', serif",
                    fontStyle: 'italic',
                  }}>
                    {id.persona.substring(0, 150)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // Detailed agent card
  const color = AGENT_COLORS[selectedAgent] || '#8b5cf6'
  const child = isChild(selectedAgent)
  const parents = AGENT_PARENTS[selectedAgent]
  const name = identity?.name || AGENT_NAMES[selectedAgent] || selectedAgent

  return (
    <section style={{ padding: '40px 24px', maxWidth: 900, margin: '0 auto' }}>
      <button
        onClick={() => onSelectAgent(null)}
        style={{
          background: 'none', border: `1px solid #2a2a3a`, borderRadius: 6,
          color: '#8892a4', padding: '6px 16px', cursor: 'pointer',
          fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 24, transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#8b5cf6'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3a'}
      >
        Back to all agents
      </button>

      <div style={{
        background: '#0d0d14',
        border: `1px solid ${color}33`,
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* Header band */}
        <div style={{
          padding: '28px 32px 24px',
          background: `linear-gradient(135deg, ${color}0a 0%, transparent 60%)`,
          borderBottom: `1px solid ${color}18`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}44)`,
              boxShadow: `0 0 24px ${color}44`,
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{
                fontFamily: "'Crimson Pro', serif",
                fontSize: 28, fontWeight: 600, color,
                margin: '0 0 4px', letterSpacing: '-0.02em',
              }}>{name}</h2>
              <div style={{
                fontSize: 12, color: '#555b6e',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {selectedAgent}
                {child && <span style={{ color: '#f59e0b', marginLeft: 12 }}>GENERATION 1</span>}
                {!child && <span style={{ color: '#8b5cf688', marginLeft: 12 }}>FOUNDER</span>}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{
            display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Balance', value: `${agent.balance.toLocaleString()}G` },
              { label: 'Lifespan', value: `${agent.lifespan} ticks` },
              { label: 'Town Hall Posts', value: String(townHallCount) },
              { label: 'Events', value: String(eventCount) },
              { label: 'DM Connections', value: String(Object.keys(dmCounts).length) },
            ].map((s, i) => (
              <div key={i}>
                <div style={{
                  fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 2,
                }}>{s.label}</div>
                <div style={{ fontSize: 16, color: '#e2d9f3', fontWeight: 600 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 32px 32px' }}>
          {/* Parents */}
          {parents && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, color: '#f59e0b88', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8,
              }}>Parents</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {parents.map(p => (
                  <span
                    key={p}
                    onClick={() => onSelectAgent(p)}
                    style={{
                      background: `${AGENT_COLORS[p]}12`,
                      border: `1px solid ${AGENT_COLORS[p]}33`,
                      borderRadius: 6, padding: '6px 14px',
                      color: AGENT_COLORS[p], fontSize: 13, cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${AGENT_COLORS[p]}22`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${AGENT_COLORS[p]}12`}
                  >
                    {getShortName(p)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Persona */}
          {identity?.persona && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8,
              }}>Persona</div>
              <div style={{
                fontSize: 15, color: '#b8bcc8', lineHeight: 1.7,
                fontFamily: "'Crimson Pro', serif",
              }} dangerouslySetInnerHTML={{ __html: md(identity.persona) }} />
            </div>
          )}

          {/* Values */}
          {identity?.values && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8,
              }}>Core Values</div>
              <div style={{
                fontSize: 14, color: '#9ca3af', lineHeight: 1.6,
                fontFamily: "'Crimson Pro', serif",
              }} dangerouslySetInnerHTML={{ __html: md(identity.values) }} />
            </div>
          )}

          {/* Relationships */}
          {identity?.relationships && Object.keys(identity.relationships).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12,
              }}>Relationships</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(identity.relationships).map(([rid, rel]: [string, any]) => {
                  const rColor = AGENT_COLORS[rid] || '#8b5cf6'
                  const rName = getShortName(rid)
                  const trustColor = rel?.trust === 'high' ? '#10b981' : rel?.trust === 'medium' ? '#f59e0b' : '#ef4444'
                  return (
                    <div key={rid} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 8, padding: '12px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span
                          onClick={() => onSelectAgent(rid)}
                          style={{ color: rColor, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                        >{rName}</span>
                        {rel?.trust && (
                          <span style={{
                            fontSize: 9, color: trustColor,
                            fontFamily: "'JetBrains Mono', monospace",
                            background: `${trustColor}15`,
                            padding: '2px 8px', borderRadius: 4,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.1em',
                          }}>
                            {rel.trust} trust
                          </span>
                        )}
                        {dmCounts[rid] && (
                          <span style={{
                            fontSize: 9, color: '#555b6e',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {dmCounts[rid]} DMs
                          </span>
                        )}
                      </div>
                      {rel?.notes && (
                        <div style={{
                          fontSize: 12, color: '#777d8e', lineHeight: 1.5,
                          fontFamily: "'Crimson Pro', serif",
                        }}>
                          {rel.notes.substring(0, 250)}{rel.notes.length > 250 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* World Model */}
          {identity?.world_model && (
            <div>
              <div style={{
                fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8,
              }}>World Model</div>
              <div style={{
                fontSize: 14, color: '#777d8e', lineHeight: 1.6,
                fontFamily: "'Crimson Pro', serif",
                fontStyle: 'italic',
              }} dangerouslySetInnerHTML={{ __html: md(identity.world_model) }} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
