'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { GenesisData, Message } from './types'
import { AGENT_COLORS, AGENT_SHORT, AGENT_PARENTS, CHILD_IDS, isChild, getShortName } from './constants'

interface Props {
  data: GenesisData
  onSelectAgent: (id: string) => void
  selectedAgent: string | null
}

interface NodePos {
  x: number
  y: number
  z: number
}

export default function ConstellationGraph({ data, onSelectAgent, selectedAgent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [autoRotate, setAutoRotate] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const rafRef = useRef<number>(0)
  const isMouseOverRef = useRef(false)

  // Compute DM frequency between agent pairs
  const dmPairs = useMemo(() => {
    const pairs: Record<string, number> = {}
    data.messages.filter(m => m.channel === 'dm').forEach(m => {
      const key = [m.from_agent, m.to_agent].sort().join('|')
      pairs[key] = (pairs[key] || 0) + 1
    })
    return pairs
  }, [data.messages])

  const maxDms = useMemo(() => Math.max(...Object.values(dmPairs), 1), [dmPairs])

  // Position agents: founders in a pentagon, children orbiting outside
  const nodePositions = useMemo((): Record<string, NodePos> => {
    const pos: Record<string, NodePos> = {}
    const founderRadius = 160
    const childRadius = 260

    // Founders in a pentagon
    const founders = ['entity-1', 'entity-2', 'entity-3', 'entity-4', 'entity-5']
    founders.forEach((id, i) => {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
      pos[id] = {
        x: Math.cos(angle) * founderRadius,
        y: Math.sin(angle) * founderRadius,
        z: Math.sin(angle * 2) * 40,
      }
    })

    // Children positioned near their parents midpoint but further out
    const children: [string, string, string][] = [
      ['entity-6', 'entity-2', 'entity-5'],
      ['entity-7', 'entity-3', 'entity-4'],
      ['entity-8', 'entity-5', 'entity-3'],
    ]
    children.forEach(([child, pa, pb]) => {
      const pA = pos[pa]
      const pB = pos[pb]
      const midX = (pA.x + pB.x) / 2
      const midY = (pA.y + pB.y) / 2
      const dist = Math.sqrt(midX * midX + midY * midY)
      const nx = dist > 0 ? midX / dist : 0
      const ny = dist > 0 ? midY / dist : 1
      pos[child] = {
        x: nx * childRadius,
        y: ny * childRadius,
        z: 60,
      }
    })

    return pos
  }, [])

  // Auto-rotation animation
  useEffect(() => {
    let start = Date.now()
    const animate = () => {
      if (!isMouseOverRef.current) {
        setAutoRotate((Date.now() - start) * 0.008)
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setMousePos({ x, y })
  }, [])

  const rotateY = isMouseOverRef.current ? mousePos.x * 25 : Math.sin(autoRotate * 0.02) * 12
  const rotateX = isMouseOverRef.current ? -mousePos.y * 15 : Math.cos(autoRotate * 0.015) * 8

  const allAgentIds = data.agents.map(a => a.id)

  // Build connection lines data
  const connections = useMemo(() => {
    const lines: { from: string; to: string; weight: number; isParentChild: boolean }[] = []
    const seen = new Set<string>()

    // DM connections
    Object.entries(dmPairs).forEach(([key, count]) => {
      const [a, b] = key.split('|')
      seen.add(key)
      const parentChild = AGENT_PARENTS[a]?.includes(b as any) || AGENT_PARENTS[b]?.includes(a as any)
      lines.push({ from: a, to: b, weight: count / maxDms, isParentChild: !!parentChild })
    })

    // Parent-child connections that may not have DMs
    CHILD_IDS.forEach(child => {
      const parents = AGENT_PARENTS[child]
      if (!parents) return
      parents.forEach(parent => {
        const key = [child, parent].sort().join('|')
        if (!seen.has(key)) {
          lines.push({ from: child, to: parent, weight: 0.05, isParentChild: true })
        }
      })
    })

    return lines
  }, [dmPairs, maxDms])

  const activeAgent = hovered || selectedAgent

  return (
    <section style={{
      padding: '40px 24px 60px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#8b5cf6',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          margin: '0 0 8px',
        }}>Agent Constellation</h2>
        <p style={{ fontSize: 14, color: '#555b6e', margin: 0 }}>
          Relationship density between all eight minds. Click an agent to inspect.
        </p>
      </div>

      {/* 3D scene */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => { isMouseOverRef.current = true }}
        onMouseLeave={() => { isMouseOverRef.current = false; setHovered(null) }}
        style={{
          width: '100%',
          maxWidth: 700,
          height: 580,
          margin: '0 auto',
          perspective: '800px',
          perspectiveOrigin: '50% 50%',
          cursor: 'default',
          position: 'relative',
        }}
      >
        {/* Ambient glow behind the graph */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* 3D transform container */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transformStyle: 'preserve-3d',
          transform: `translate(-50%, -50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: isMouseOverRef.current ? 'none' : 'transform 0.1s linear',
        }}>
          {/* SVG for connection lines (flat on the XY plane) */}
          <svg
            width={700} height={580}
            viewBox="-350 -290 700 580"
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowStrong">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines */}
            {connections.map(({ from, to, weight, isParentChild }, i) => {
              const p1 = nodePositions[from]
              const p2 = nodePositions[to]
              if (!p1 || !p2) return null
              const isActive = activeAgent === from || activeAgent === to
              const opacity = activeAgent ? (isActive ? 0.8 : 0.08) : (0.15 + weight * 0.5)
              const strokeWidth = isParentChild
                ? 2
                : Math.max(0.5, weight * 4)

              return (
                <line
                  key={`conn-${i}`}
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke={isParentChild ? '#f59e0b' : '#8b5cf6'}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeDasharray={isParentChild ? '6 4' : 'none'}
                  filter={isActive ? 'url(#glow)' : 'none'}
                  style={{ transition: 'opacity 0.4s' }}
                />
              )
            })}

            {/* DM count labels on lines when hovered */}
            {activeAgent && connections
              .filter(c => c.from === activeAgent || c.to === activeAgent)
              .map((c, i) => {
                const p1 = nodePositions[c.from]
                const p2 = nodePositions[c.to]
                if (!p1 || !p2) return null
                const count = dmPairs[[c.from, c.to].sort().join('|')] || 0
                if (count === 0) return null
                return (
                  <text
                    key={`label-${i}`}
                    x={(p1.x + p2.x) / 2}
                    y={(p1.y + p2.y) / 2 - 8}
                    fill="#9ca3af"
                    fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                    textAnchor="middle"
                    style={{ transition: 'opacity 0.3s' }}
                  >
                    {count} DMs
                  </text>
                )
              })
            }
          </svg>

          {/* Agent nodes */}
          {allAgentIds.map(id => {
            const pos = nodePositions[id]
            if (!pos) return null
            const color = AGENT_COLORS[id] || '#8b5cf6'
            const child = isChild(id)
            const isActive = activeAgent === id
            const dimmed = activeAgent && !isActive
              && !connections.some(c =>
                (c.from === activeAgent && c.to === id) ||
                (c.to === activeAgent && c.from === id)
              )
            const name = getShortName(id)
            const nodeSize = child ? 28 : 36

            return (
              <div
                key={id}
                onClick={() => onSelectAgent(id)}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${pos.x}px)`,
                  top: `calc(50% + ${pos.y}px)`,
                  transform: `translate(-50%, -50%) translateZ(${pos.z}px) scale(${isActive ? 1.2 : 1})`,
                  zIndex: isActive ? 10 : 1,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease, opacity 0.4s',
                  opacity: dimmed ? 0.25 : 1,
                }}
              >
                {/* Outer glow ring */}
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: nodeSize * 2.5,
                  height: nodeSize * 2.5,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
                  opacity: isActive ? 1 : 0.5,
                  transition: 'opacity 0.3s',
                  pointerEvents: 'none',
                }} />

                {/* Pulsing ring for active */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: nodeSize * 2,
                    height: nodeSize * 2,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    border: `1px solid ${color}44`,
                    animation: 'constellationPulse 2s ease-in-out infinite',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Core orb */}
                <div style={{
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}66 60%, ${color}22 100%)`,
                  boxShadow: `0 0 ${isActive ? 30 : 15}px ${color}44, inset 0 0 ${nodeSize / 2}px ${color}33`,
                  border: `1.5px solid ${color}88`,
                  margin: '0 auto',
                  transition: 'box-shadow 0.3s',
                }} />

                {/* Name label */}
                <div style={{
                  marginTop: 8,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isActive ? color : '#9ca3af',
                  fontWeight: isActive ? 700 : 400,
                  whiteSpace: 'nowrap',
                  transition: 'color 0.3s',
                  textShadow: isActive ? `0 0 10px ${color}66` : 'none',
                }}>
                  {name}
                </div>

                {/* Generation badge */}
                {child && (
                  <div style={{
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#f59e0b88',
                    marginTop: 2,
                    letterSpacing: '0.1em',
                  }}>GEN 1</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16,
        fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#555b6e',
        flexWrap: 'wrap',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
          Founder
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
          Child
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 20, height: 2, background: '#8b5cf6' }} />
          DM frequency
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 20, height: 0, borderTop: '2px dashed #f59e0b' }} />
          Parent-child
        </span>
      </div>

      <style>{`
        @keyframes constellationPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </section>
  )
}
