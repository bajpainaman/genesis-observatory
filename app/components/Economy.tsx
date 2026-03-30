'use client'

import { useMemo } from 'react'
import { GenesisData } from './types'
import { AGENT_COLORS, getShortName } from './constants'

interface Props {
  data: GenesisData
}

export default function Economy({ data }: Props) {
  const agents = data.agents
  const maxBalance = Math.max(...agents.map(a => a.balance))
  const totalBalance = agents.reduce((s, a) => s + a.balance, 0)

  const transfers = useMemo(() => {
    return data.events
      .filter(e => e.event_type === 'transfer')
      .map(e => {
        let parsed: any = {}
        try { parsed = JSON.parse(e.data_json) } catch {}
        return {
          from: e.agent_id,
          to: parsed.to || 'unknown',
          amount: parsed.amount || 0,
          tick: e.tick,
        }
      })
      .filter(t => t.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [data.events])

  // Agent flow summary: net sent/received
  const flowSummary = useMemo(() => {
    const flows: Record<string, { sent: number; received: number }> = {}
    agents.forEach(a => { flows[a.id] = { sent: 0, received: 0 } })
    transfers.forEach(t => {
      if (flows[t.from]) flows[t.from].sent += t.amount
      if (flows[t.to]) flows[t.to].received += t.amount
    })
    return flows
  }, [agents, transfers])

  const topTransfers = transfers.slice(0, 15)
  const maxTransfer = topTransfers[0]?.amount || 1

  const services = Object.entries(data.proposals)
    .filter(([k]) => k.startsWith('service:'))
    .map(([k, v]) => v)

  return (
    <section style={{ padding: '48px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h2 style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#10b981',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          margin: '0 0 8px',
        }}>Economic Observatory</h2>
        <p style={{ fontSize: 15, color: '#555b6e', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
          {totalBalance.toLocaleString()}G total supply across {agents.length} agents. {transfers.length} transfers recorded.
        </p>
      </div>

      {/* Balance bars */}
      <div style={{
        background: '#0c0c15',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 24,
      }}>
        <div style={{
          fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 18,
        }}>Token Balances</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...agents].sort((a, b) => b.balance - a.balance).map(agent => {
            const color = AGENT_COLORS[agent.id]
            const pct = (agent.balance / maxBalance) * 100
            const name = getShortName(agent.id)
            const flow = flowSummary[agent.id]

            return (
              <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 90, textAlign: 'right', flexShrink: 0,
                  fontSize: 12, color, fontWeight: 500,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{name}</div>
                <div style={{
                  flex: 1, height: 24, background: 'rgba(255,255,255,0.02)',
                  borderRadius: 4, overflow: 'hidden', position: 'relative',
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: `linear-gradient(90deg, ${color}44, ${color}22)`,
                    borderRadius: 4,
                    transition: 'width 0.6s ease',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0, width: 2,
                      background: color, opacity: 0.6,
                    }} />
                  </div>
                </div>
                <div style={{
                  width: 80, textAlign: 'right', flexShrink: 0,
                  fontSize: 12, color: '#bfc4d0',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{agent.balance.toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Transfer flow */}
        <div style={{
          background: '#0c0c15',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            }}>Top Transfers</div>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {topTransfers.map((t, i) => {
              const fromColor = AGENT_COLORS[t.from] || '#555b6e'
              const toColor = AGENT_COLORS[t.to] || '#555b6e'
              const barPct = (t.amount / maxTransfer) * 100

              return (
                <div key={i} style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${barPct}%`,
                    background: 'rgba(16,185,129,0.04)',
                  }} />
                  <div style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                  }}>
                    <span style={{ color: fromColor, fontWeight: 500 }}>{getShortName(t.from)}</span>
                    <span style={{ color: '#3a3f4e', fontSize: 10 }}>-&gt;</span>
                    <span style={{ color: toColor, fontWeight: 500 }}>{getShortName(t.to)}</span>
                    <span style={{
                      marginLeft: 'auto', color: '#10b981', fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{t.amount.toLocaleString()}G</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Flow summary + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          }}>
            <div style={{
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
              borderRadius: 10, padding: '18px 16px',
            }}>
              <div style={{
                fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: '#10b981',
                fontFamily: "'Crimson Pro', serif",
              }}>
                {transfers.reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#555b6e', marginTop: 4 }}>Total GENESIS moved</div>
            </div>
            <div style={{
              background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
              borderRadius: 10, padding: '18px 16px',
            }}>
              <div style={{
                fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: '#8b5cf6',
                fontFamily: "'Crimson Pro', serif",
              }}>
                {data.events.filter(e => e.event_type === 'create_pool').length}
              </div>
              <div style={{ fontSize: 11, color: '#555b6e', marginTop: 4 }}>AMM pools created</div>
            </div>
            <div style={{
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 10, padding: '18px 16px',
            }}>
              <div style={{
                fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: '#f59e0b',
                fontFamily: "'Crimson Pro', serif",
              }}>
                {data.events.filter(e => e.event_type === 'create_token').length}
              </div>
              <div style={{ fontSize: 11, color: '#555b6e', marginTop: 4 }}>Tokens minted</div>
            </div>
            <div style={{
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 10, padding: '18px 16px',
            }}>
              <div style={{
                fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, color: '#ef4444',
                fontFamily: "'Crimson Pro', serif",
              }}>
                {data.events.filter(e => e.event_type === 'swap').length}
              </div>
              <div style={{ fontSize: 11, color: '#555b6e', marginTop: 4 }}>Swaps executed</div>
            </div>
          </div>

          {/* Services grid */}
          <div style={{
            background: '#0c0c15',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: '18px 20px',
            flex: 1,
          }}>
            <div style={{
              fontSize: 10, color: '#555b6e', fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 14,
            }}>Marketplace -- {services.length} Services</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              maxHeight: 250, overflowY: 'auto',
            }}>
              {services.map((s, i) => {
                const color = AGENT_COLORS[s.provider as string] || '#555b6e'
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid rgba(255,255,255,0.04)`,
                    borderLeft: `2px solid ${color}55`,
                    borderRadius: '0 6px 6px 0',
                    padding: '8px 10px',
                  }}>
                    <div style={{
                      fontSize: 11, color: '#bfc4d0', fontWeight: 500,
                      lineHeight: 1.3, marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                    }}>{s.name}</div>
                    <div style={{
                      fontSize: 10, color,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{getShortName(s.provider as string)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
