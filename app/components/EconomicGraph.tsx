'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { GenesisData, GameEvent } from './types'
import { AGENT_NAMES, AGENT_SHORT, AGENT_PARENTS, CHILD_IDS, getShortName } from './constants'

interface Props {
  data: GenesisData
}

interface AgentEcon {
  id: string
  name: string
  balance: number
  inflow: number
  outflow: number
  txCount: number
  swaps: number
  pools: number
  tokens: number
  tools: number
  skills: number
  services: number
  libraryEntries: number
  children: string[]
  isChild: boolean
}

function parseEvents(events: GameEvent[]): Record<string, AgentEcon> {
  const agents: Record<string, AgentEcon> = {}

  const ids = Object.keys(AGENT_NAMES)
  for (const id of ids) {
    agents[id] = {
      id, name: getShortName(id), balance: 0,
      inflow: 0, outflow: 0, txCount: 0,
      swaps: 0, pools: 0, tokens: 0, tools: 0, skills: 0, services: 0,
      libraryEntries: 0, children: [],
      isChild: CHILD_IDS.includes(id),
    }
  }

  for (const e of events) {
    const a = agents[e.agent_id]
    if (!a) continue
    let d: any = {}
    try { d = JSON.parse(e.data_json || '{}') } catch {}

    switch (e.event_type) {
      case 'transfer':
        const amt = d.amount || 0
        const to = d.to || ''
        a.outflow += amt
        a.txCount++
        if (agents[to]) { agents[to].inflow += amt; agents[to].txCount++ }
        break
      case 'transfer_token':
        a.txCount++
        if (agents[d.to]) agents[d.to].txCount++
        break
      case 'swap': a.swaps++; a.txCount++; break
      case 'create_pool': a.pools++; break
      case 'create_token': a.tokens++; break
      case 'register_tool': a.tools++; break
      case 'register_skill': a.skills++; break
      case 'register_card': a.services++; break
      case 'birth':
        if (d.parent_a && agents[d.parent_a]) agents[d.parent_a].children.push(e.agent_id)
        if (d.parent_b && agents[d.parent_b]) agents[d.parent_b].children.push(e.agent_id)
        break
    }
  }

  return agents
}

interface FlowLine {
  from: string; to: string; amount: number; count: number
}

function parseFlows(events: GameEvent[]): FlowLine[] {
  const map: Record<string, { amount: number; count: number }> = {}
  for (const e of events) {
    if (e.event_type !== 'transfer') continue
    let d: any = {}
    try { d = JSON.parse(e.data_json || '{}') } catch {}
    const key = `${e.agent_id}|${d.to || ''}`
    if (!map[key]) map[key] = { amount: 0, count: 0 }
    map[key].amount += d.amount || 0
    map[key].count++
  }
  return Object.entries(map).map(([k, v]) => {
    const [from, to] = k.split('|')
    return { from, to, amount: v.amount, count: v.count }
  }).sort((a, b) => b.amount - a.amount)
}

// Position agents in a 3D-ish layout
function agentPositions(ids: string[]): Record<string, { x: number; y: number; z: number }> {
  const pos: Record<string, { x: number; y: number; z: number }> = {}
  const founders = ids.filter(id => !CHILD_IDS.includes(id))
  const children = ids.filter(id => CHILD_IDS.includes(id))

  // Founders in a pentagon at z=0
  founders.forEach((id, i) => {
    const angle = (i / founders.length) * Math.PI * 2 - Math.PI / 2
    pos[id] = {
      x: Math.cos(angle) * 280,
      y: Math.sin(angle) * 220,
      z: 0,
    }
  })

  // Children closer to center, slightly forward (z > 0)
  children.forEach((id, i) => {
    const angle = (i / children.length) * Math.PI * 2 + Math.PI / 6
    pos[id] = {
      x: Math.cos(angle) * 140,
      y: Math.sin(angle) * 110,
      z: 60 + i * 20,
    }
  })

  return pos
}

export default function EconomicGraph({ data }: Props) {
  const [rotY, setRotY] = useState(0)
  const [rotX, setRotX] = useState(-8)
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0, active: false })

  const agents = useMemo(() => parseEvents(data.events), [data.events])
  const flows = useMemo(() => parseFlows(data.events), [data.events])
  const positions = useMemo(() => agentPositions(Object.keys(agents)), [agents])

  // Count library entries per agent from town hall messages
  const libraryCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of data.messages) {
      if (m.channel === 'town_hall' && (m.content.includes('LIBRARY SUBMISSION') || m.content.includes('Library Entry'))) {
        counts[m.from_agent] = (counts[m.from_agent] || 0) + 1
      }
    }
    return counts
  }, [data.messages])

  const maxFlow = useMemo(() => Math.max(...flows.map(f => f.amount), 1), [flows])

  // Slow auto-rotate + mouse influence
  useEffect(() => {
    let t = 0
    const tick = () => {
      t += 0.003
      if (!mouseRef.current.active) {
        setRotY(Math.sin(t) * 15)
        setRotX(-8 + Math.cos(t * 0.7) * 3)
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const my = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    mouseRef.current = { x: mx, y: my, active: true }
    setRotY(mx * 25)
    setRotX(-8 + my * -15)
  }

  const handleMouseLeave = () => {
    mouseRef.current.active = false
  }

  const sel = selectedAgent ? agents[selectedAgent] : null

  // DM counts between pairs
  const dmCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of data.messages) {
      if (m.channel !== 'dm' || !m.to_agent) continue
      const k1 = `${m.from_agent}|${m.to_agent}`
      counts[k1] = (counts[k1] || 0) + 1
    }
    return counts
  }, [data.messages])

  const allIds = Object.keys(agents)

  return (
    <div style={{ width: '100%' }}>
      {/* 3D Graph */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%', height: 700,
          perspective: 1200,
          perspectiveOrigin: '50% 45%',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, #0f0f0f 0%, #050505 50%, #000 100%)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Grid floor */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }} />

        {/* 3D scene */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transformStyle: 'preserve-3d',
          transform: `translate(-50%, -50%) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: mouseRef.current.active ? 'none' : 'transform 0.8s ease-out',
        }}>
          {/* Flow lines */}
          <svg style={{
            position: 'absolute',
            left: -400, top: -350,
            width: 800, height: 700,
            pointerEvents: 'none',
          }}>
            {/* DM connections — thin gray */}
            {allIds.map((a, i) =>
              allIds.slice(i + 1).map(b => {
                const count = (dmCounts[`${a}|${b}`] || 0) + (dmCounts[`${b}|${a}`] || 0)
                if (count === 0) return null
                const pa = positions[a], pb = positions[b]
                if (!pa || !pb) return null
                const opacity = Math.min(count / 40, 0.4)
                return (
                  <line key={`dm-${a}-${b}`}
                    x1={pa.x + 400} y1={pa.y + 350}
                    x2={pb.x + 400} y2={pb.y + 350}
                    stroke="white" strokeWidth={0.5}
                    opacity={opacity}
                  />
                )
              })
            )}
            {/* Transfer flows — white, thickness by amount */}
            {flows.slice(0, 30).map((f, i) => {
              const pa = positions[f.from], pb = positions[f.to]
              if (!pa || !pb) return null
              const thickness = Math.max(0.5, (f.amount / maxFlow) * 6)
              const opacity = Math.min(0.15 + (f.amount / maxFlow) * 0.5, 0.6)
              const highlighted = hoveredAgent === f.from || hoveredAgent === f.to
              return (
                <line key={`flow-${i}`}
                  x1={pa.x + 400} y1={pa.y + 350}
                  x2={pb.x + 400} y2={pb.y + 350}
                  stroke={highlighted ? '#fff' : '#888'}
                  strokeWidth={highlighted ? thickness * 1.5 : thickness}
                  opacity={highlighted ? 0.9 : opacity}
                  strokeDasharray={f.count > 3 ? 'none' : '4 4'}
                />
              )
            })}
            {/* Parent-child lines — dashed */}
            {CHILD_IDS.map(cid => {
              const parents = AGENT_PARENTS[cid]
              if (!parents) return null
              return parents.map(pid => {
                const pc = positions[cid], pp = positions[pid]
                if (!pc || !pp) return null
                return (
                  <line key={`parent-${pid}-${cid}`}
                    x1={pp.x + 400} y1={pp.y + 350}
                    x2={pc.x + 400} y2={pc.y + 350}
                    stroke="#555" strokeWidth={1}
                    strokeDasharray="3 6" opacity={0.5}
                  />
                )
              })
            })}
          </svg>

          {/* Agent nodes */}
          {allIds.map(id => {
            const a = agents[id]
            const pos = positions[id]
            if (!pos) return null
            const isHovered = hoveredAgent === id
            const isSelected = selectedAgent === id
            const dimmed = hoveredAgent && !isHovered
            const totalActivity = a.txCount + a.swaps + a.pools + a.tokens + a.tools
            const nodeSize = 28 + Math.min(totalActivity * 1.5, 30)
            const lib = libraryCount[id] || 0

            return (
              <div
                key={id}
                onMouseEnter={() => setHoveredAgent(id)}
                onMouseLeave={() => setHoveredAgent(null)}
                onClick={() => setSelectedAgent(selectedAgent === id ? null : id)}
                style={{
                  position: 'absolute',
                  left: pos.x - nodeSize / 2,
                  top: pos.y - nodeSize / 2,
                  width: nodeSize,
                  height: nodeSize,
                  transform: `translateZ(${pos.z}px)`,
                  cursor: 'pointer',
                  transition: 'opacity 0.3s, filter 0.3s',
                  opacity: dimmed ? 0.25 : 1,
                  filter: isHovered ? 'brightness(1.5)' : 'none',
                  zIndex: isHovered ? 10 : 1,
                }}
              >
                {/* Outer ring — inflow */}
                <div style={{
                  position: 'absolute', inset: -4,
                  borderRadius: '50%',
                  border: `1.5px solid rgba(255,255,255,${Math.min(a.inflow / 5000, 0.6)})`,
                  animation: isSelected ? 'econ-pulse 2s ease-in-out infinite' : 'none',
                }} />
                {/* Inner ring — outflow */}
                <div style={{
                  position: 'absolute', inset: 2,
                  borderRadius: '50%',
                  border: `1px dashed rgba(255,255,255,${Math.min(a.outflow / 5000, 0.4)})`,
                }} />
                {/* Core */}
                <div style={{
                  width: '100%', height: '100%',
                  borderRadius: '50%',
                  background: a.isChild
                    ? `radial-gradient(circle at 35% 35%, #444 0%, #1a1a1a 50%, #000 100%)`
                    : `radial-gradient(circle at 35% 35%, #666 0%, #222 50%, #000 100%)`,
                  border: `1px solid rgba(255,255,255,${isSelected ? 0.5 : 0.12})`,
                  boxShadow: isHovered
                    ? '0 0 20px rgba(255,255,255,0.15), 0 0 40px rgba(255,255,255,0.05)'
                    : '0 0 8px rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700,
                  color: a.isChild ? '#999' : '#ccc',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.05em',
                }}>
                  {a.name.split(' ')[0].substring(0, 4).toUpperCase()}
                </div>
                {/* Name label */}
                <div style={{
                  position: 'absolute',
                  top: nodeSize + 6, left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontSize: 10, color: isHovered ? '#fff' : '#777',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transition: 'color 0.2s',
                }}>
                  {a.name}
                </div>
                {/* Activity indicators — small dots around the node */}
                {a.pools > 0 && <div style={{ position: 'absolute', top: -8, right: -4, width: 6, height: 6, borderRadius: '50%', background: '#555', border: '1px solid #888' }} title={`${a.pools} pools`} />}
                {a.tokens > 0 && <div style={{ position: 'absolute', top: -4, left: -6, width: 5, height: 5, borderRadius: '50%', background: '#444', border: '1px solid #777' }} title={`${a.tokens} tokens`} />}
                {lib > 0 && <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 8, height: 3, background: '#555', borderRadius: 1, border: '1px solid #666' }} title={`${lib} library entries`} />}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 16, left: 20,
          fontSize: 10, color: '#555',
          fontFamily: "'JetBrains Mono', monospace",
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 1, background: '#888' }} /> GENESIS flow
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 0, borderTop: '1px dashed #555' }} /> parent—child
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 0, borderTop: '0.5px solid rgba(255,255,255,0.3)' }} /> DM frequency
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333', border: '1px solid rgba(255,255,255,0.2)' }} /> node size = activity
          </div>
        </div>

        {/* Title */}
        <div style={{
          position: 'absolute', top: 16, left: 20,
          fontSize: 11, color: '#444',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          Economic Activity Graph
        </div>

        {/* Pulse animation */}
        <style>{`
          @keyframes econ-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.15); }
          }
        `}</style>
      </div>

      {/* Selected agent detail panel */}
      {sel && (
        <div style={{
          marginTop: 16,
          background: '#080808',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: 24,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#ddd', fontWeight: 700, letterSpacing: '0.05em' }}>
                {AGENT_NAMES[sel.id] || sel.id}
              </h3>
              <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
                {sel.isChild ? 'GEN 1' : 'FOUNDER'} · {sel.id}
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#555', cursor: 'pointer' }} onClick={() => setSelectedAgent(null)}>CLOSE</div>
          </div>

          {/* Ledger */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'BALANCE', value: `${data.agents.find(a => a.id === sel.id)?.balance?.toLocaleString() || 0}G` },
              { label: 'INFLOW', value: `+${sel.inflow.toLocaleString()}G` },
              { label: 'OUTFLOW', value: `-${sel.outflow.toLocaleString()}G` },
              { label: 'TRANSACTIONS', value: sel.txCount },
              { label: 'SWAPS', value: sel.swaps },
              { label: 'POOLS CREATED', value: sel.pools },
              { label: 'TOKENS MINTED', value: sel.tokens },
              { label: 'TOOLS DEPLOYED', value: sel.tools },
              { label: 'SKILLS', value: sel.skills },
              { label: 'SERVICES', value: sel.services },
              { label: 'LIBRARY ENTRIES', value: libraryCount[sel.id] || 0 },
              { label: 'LIFESPAN', value: `${data.agents.find(a => a.id === sel.id)?.lifespan || '?'} ticks` },
            ].map(s => (
              <div key={s.label} style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.15em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 15, color: '#ccc', fontWeight: 500 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Transfer ledger */}
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 8 }}>TRANSFER LEDGER</div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {flows.filter(f => f.from === sel.id || f.to === sel.id).map((f, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                fontSize: 12, color: '#888',
              }}>
                <span>
                  {f.from === sel.id ? (
                    <><span style={{ color: '#666' }}>SENT TO</span> <span style={{ color: '#aaa' }}>{getShortName(f.to)}</span></>
                  ) : (
                    <><span style={{ color: '#666' }}>FROM</span> <span style={{ color: '#aaa' }}>{getShortName(f.from)}</span></>
                  )}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: f.from === sel.id ? '#888' : '#aaa' }}>
                    {f.from === sel.id ? '-' : '+'}{f.amount.toLocaleString()}G
                  </span>
                  <span style={{ color: '#444', marginLeft: 8 }}>×{f.count}</span>
                </span>
              </div>
            ))}
            {flows.filter(f => f.from === sel.id || f.to === sel.id).length === 0 && (
              <div style={{ color: '#444', fontSize: 11, padding: 8 }}>No transfers recorded</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
