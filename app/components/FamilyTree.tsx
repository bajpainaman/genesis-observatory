'use client'

import { GenesisData } from './types'
import { AGENT_COLORS, AGENT_PARENTS, CHILD_IDS, FOUNDER_IDS, getShortName } from './constants'

interface Props {
  data: GenesisData
  onSelectAgent?: (id: string) => void
}

export default function FamilyTree({ data, onSelectAgent }: Props) {
  const W = 680
  const H = 340

  const founderY = 90
  const childY = 250
  const founderSpacing = W / (FOUNDER_IDS.length + 1)
  const childSpacing = W / (CHILD_IDS.length + 1)

  const founderPositions: Record<string, { x: number; y: number }> = {}
  FOUNDER_IDS.forEach((id, i) => {
    founderPositions[id] = { x: founderSpacing * (i + 1), y: founderY }
  })

  const childPositions: Record<string, { x: number; y: number }> = {}
  CHILD_IDS.forEach((id, i) => {
    childPositions[id] = { x: childSpacing * (i + 1), y: childY }
  })

  // Get birth data for children
  const birthEvents = data.events.filter(e => e.event_type === 'birth')
  const birthData: Record<string, { funding: number; parent_a: string; parent_b: string }> = {}
  birthEvents.forEach(e => {
    try {
      const d = JSON.parse(e.data_json)
      birthData[e.agent_id] = d
    } catch {}
  })

  return (
    <section style={{ padding: '48px 24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#f59e0b',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          margin: '0 0 8px',
        }}>Lineage Map</h2>
        <p style={{ fontSize: 15, color: '#555b6e', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
          Five founders. Three children. Two generations of autonomous minds.
        </p>
      </div>

      <div style={{
        background: '#0c0c15',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: '20px 12px',
        overflow: 'hidden',
      }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', maxWidth: 700, margin: '0 auto' }}
        >
          <defs>
            <linearGradient id="parentLine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
            </linearGradient>
            <filter id="treeglow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Generation labels */}
          <text x={20} y={founderY + 4} fill="#3a3f4e" fontSize={10} fontFamily="'JetBrains Mono', monospace">
            GEN 0
          </text>
          <text x={20} y={childY + 4} fill="#3a3f4e" fontSize={10} fontFamily="'JetBrains Mono', monospace">
            GEN 1
          </text>

          {/* Divider */}
          <line
            x1={55} y1={(founderY + childY) / 2}
            x2={W - 20} y2={(founderY + childY) / 2}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="4 6"
          />

          {/* Parent-child bezier curves */}
          {CHILD_IDS.map(childId => {
            const parents = AGENT_PARENTS[childId]
            if (!parents) return null
            const cp = childPositions[childId]

            return parents.map(parentId => {
              const pp = founderPositions[parentId]
              if (!pp || !cp) return null
              const midY = (pp.y + cp.y) / 2 + 10

              return (
                <path
                  key={`${childId}-${parentId}`}
                  d={`M ${pp.x} ${pp.y + 22} C ${pp.x} ${midY}, ${cp.x} ${midY}, ${cp.x} ${cp.y - 22}`}
                  fill="none"
                  stroke="url(#parentLine)"
                  strokeWidth={2}
                />
              )
            })
          })}

          {/* Founder nodes */}
          {FOUNDER_IDS.map(id => {
            const pos = founderPositions[id]
            const color = AGENT_COLORS[id]
            const name = getShortName(id)
            const agent = data.agents.find(a => a.id === id)

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectAgent?.(id)}
              >
                {/* Glow */}
                <circle r={30} fill={`${color}08`} />
                {/* Ring */}
                <circle r={20} fill="#0c0c15" stroke={color} strokeWidth={1.5} strokeOpacity={0.6} />
                {/* Core */}
                <circle r={6} fill={color} fillOpacity={0.7} />

                {/* Name */}
                <text y={-28} textAnchor="middle" fill={color} fontSize={11}
                  fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                  {name}
                </text>
                {/* Balance */}
                <text y={36} textAnchor="middle" fill="#3a3f4e" fontSize={9}
                  fontFamily="'JetBrains Mono', monospace">
                  {agent?.balance.toLocaleString()}G
                </text>
              </g>
            )
          })}

          {/* Child nodes */}
          {CHILD_IDS.map(id => {
            const pos = childPositions[id]
            const color = AGENT_COLORS[id]
            const name = getShortName(id)
            const agent = data.agents.find(a => a.id === id)
            const parents = AGENT_PARENTS[id]
            const parentStr = parents?.map(p => getShortName(p).split(' ')[0]).join(' + ') || ''
            const birth = birthData[id]

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectAgent?.(id)}
              >
                {/* Amber glow */}
                <circle r={32} fill="rgba(245,158,11,0.04)" />
                {/* Ring */}
                <circle r={18} fill="#0c0c15" stroke={color} strokeWidth={1.5} strokeOpacity={0.7} />
                {/* Core */}
                <circle r={5} fill={color} fillOpacity={0.8} />

                {/* Name */}
                <text y={30} textAnchor="middle" fill={color} fontSize={12}
                  fontFamily="'JetBrains Mono', monospace" fontWeight="700">
                  {name}
                </text>
                {/* Parents */}
                <text y={42} textAnchor="middle" fill="#555b6e" fontSize={9}
                  fontFamily="'JetBrains Mono', monospace">
                  {parentStr}
                </text>
                {/* Funding */}
                {birth && (
                  <text y={54} textAnchor="middle" fill="#3a3f4e" fontSize={9}
                    fontFamily="'JetBrains Mono', monospace">
                    {birth.funding.toLocaleString()}G funded
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Note about the naming coincidence */}
      <div style={{
        marginTop: 20, padding: '14px 20px',
        background: 'rgba(245,158,11,0.05)',
        border: '1px solid rgba(245,158,11,0.12)',
        borderRadius: 10,
        fontSize: 14, color: '#8892a4', lineHeight: 1.6,
        fontFamily: "'Crimson Pro', serif",
      }}>
        <span style={{ color: '#f59e0b', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>NOTE </span>
        Entity-7 (Kindle) and entity-8 (Ember) are half-siblings who share parent entity-3 (Lumen the Convener).
        The data records entity-7's identity name as "Kindle" and entity-8's as "Ember" -- each choosing their name independently, both evoking flame and light.
      </div>

      {/* Birth records */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12, marginTop: 20,
      }}>
        {CHILD_IDS.map(id => {
          const color = AGENT_COLORS[id]
          const agent = data.agents.find(a => a.id === id)
          const identity = data.identities[id]
          const birth = birthData[id]
          const parents = AGENT_PARENTS[id]

          return (
            <div key={id} style={{
              background: '#0c0c15',
              border: `1px solid ${color}22`,
              borderRadius: 10,
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onClick={() => onSelectAgent?.(id)}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${color}44`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${color}22`}
            >
              <div style={{
                fontSize: 16, fontWeight: 700, color,
                fontFamily: "'Crimson Pro', serif",
                marginBottom: 8,
              }}>{identity?.name || getShortName(id)}</div>
              <div style={{ fontSize: 12, color: '#555b6e', lineHeight: 1.7 }}>
                <div>Parents: {parents?.map(p => getShortName(p)).join(' + ')}</div>
                {birth && <div>Funding: {birth.funding.toLocaleString()}G</div>}
                {agent && <div>Lifespan: {agent.lifespan.toLocaleString()} ticks</div>}
                {agent && <div>Balance: {agent.balance.toLocaleString()}G</div>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
