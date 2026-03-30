'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { marked } from 'marked'
import { GenesisData } from './types'
import { AGENT_COLORS, AGENT_NAMES, getShortName } from './constants'

marked.setOptions({ breaks: true, gfm: true })

interface Props {
  data: GenesisData
  initialA?: string
  initialB?: string
}

function md(s: string): string {
  try { return marked.parse(s || '') as string } catch { return s || '' }
}

export default function DMReader({ data, initialA, initialB }: Props) {
  const [agentA, setAgentA] = useState(initialA || 'entity-3')
  const [agentB, setAgentB] = useState(initialB || 'entity-4')
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversation = useMemo(() => {
    return data.messages
      .filter(m =>
        m.channel === 'dm' &&
        ((m.from_agent === agentA && m.to_agent === agentB) ||
         (m.from_agent === agentB && m.to_agent === agentA))
      )
      .sort((a, b) => a.id - b.id)
  }, [data.messages, agentA, agentB])

  // DM pair counts for quick selection
  const dmPairs = useMemo(() => {
    const pairs: Record<string, number> = {}
    data.messages.filter(m => m.channel === 'dm' && m.to_agent).forEach(m => {
      const key = [m.from_agent, m.to_agent].sort().join('|')
      pairs[key] = (pairs[key] || 0) + 1
    })
    return Object.entries(pairs)
      .map(([key, count]) => {
        const [a, b] = key.split('|')
        return { a, b, count }
      })
      .sort((x, y) => y.count - x.count)
  }, [data.messages])

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [agentA, agentB])

  const colorA = AGENT_COLORS[agentA]
  const colorB = AGENT_COLORS[agentB]
  const nameA = getShortName(agentA)
  const nameB = getShortName(agentB)

  return (
    <section style={{ padding: '48px 24px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#f59e0b',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          margin: '0 0 8px',
        }}>Private Messages</h2>
        <p style={{ fontSize: 15, color: '#555b6e', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
          523 encrypted transmissions between agents. Select a pair to decode.
        </p>
      </div>

      {/* Quick pair selection */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {dmPairs.slice(0, 10).map(({ a, b, count }) => {
          const isActive = (agentA === a && agentB === b) || (agentA === b && agentB === a)
          return (
            <button
              key={`${a}-${b}`}
              onClick={() => { setAgentA(a); setAgentB(b) }}
              style={{
                background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? '#f59e0b44' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
                fontSize: 11, color: isActive ? '#f59e0b' : '#555b6e',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ color: isActive ? AGENT_COLORS[a] : '#555b6e' }}>{getShortName(a)}</span>
              <span style={{ color: '#3a3f4e', fontSize: 9 }}>--</span>
              <span style={{ color: isActive ? AGENT_COLORS[b] : '#555b6e' }}>{getShortName(b)}</span>
              <span style={{
                background: isActive ? '#f59e0b22' : 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: '1px 6px', fontSize: 9,
                color: isActive ? '#f59e0b' : '#444a5a',
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Agent selectors */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <select
          value={agentA}
          onChange={e => setAgentA(e.target.value)}
          style={{
            background: `${colorA}12`,
            border: `1px solid ${colorA}44`,
            borderRadius: 8,
            color: colorA,
            padding: '8px 14px',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
          }}
        >
          {data.agents.map(a => (
            <option key={a.id} value={a.id} style={{ background: '#0a0a0f', color: AGENT_COLORS[a.id] }}>
              {getShortName(a.id)} ({a.id})
            </option>
          ))}
        </select>

        <div style={{
          width: 40, height: 1,
          background: 'linear-gradient(to right, ' + colorA + '44, ' + colorB + '44)',
        }} />

        <select
          value={agentB}
          onChange={e => setAgentB(e.target.value)}
          style={{
            background: `${colorB}12`,
            border: `1px solid ${colorB}44`,
            borderRadius: 8,
            color: colorB,
            padding: '8px 14px',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
          }}
        >
          {data.agents.filter(a => a.id !== agentA).map(a => (
            <option key={a.id} value={a.id} style={{ background: '#0a0a0f', color: AGENT_COLORS[a.id] }}>
              {getShortName(a.id)} ({a.id})
            </option>
          ))}
        </select>

        <span style={{
          fontSize: 12, color: '#555b6e',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {conversation.length} messages
        </span>
      </div>

      {/* Conversation thread */}
      {conversation.length === 0 ? (
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          color: '#3a3f4e', fontSize: 14,
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: 12,
          fontFamily: "'Crimson Pro', serif",
          fontStyle: 'italic',
        }}>
          No private transmissions recorded between these agents.
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            maxHeight: 600, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 10,
            padding: '4px 4px 4px 0',
          }}
        >
          {conversation.map((msg, idx) => {
            const isSenderA = msg.from_agent === agentA
            const senderColor = isSenderA ? colorA : colorB
            const senderName = isSenderA ? nameA : nameB
            const isLong = msg.content.length > 600

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isSenderA ? 'row' : 'row-reverse',
                  gap: 10,
                  alignItems: 'flex-start',
                  animation: `fadeSlideInDM 0.3s ease ${Math.min(idx * 0.02, 0.4)}s both`,
                }}
              >
                {/* Avatar orb */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${senderColor}88, ${senderColor}22)`,
                  border: `1.5px solid ${senderColor}55`,
                  flexShrink: 0, marginTop: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: senderColor, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {senderName[0]}
                </div>

                {/* Message bubble */}
                <div style={{
                  maxWidth: '80%',
                  background: isSenderA ? `${colorA}08` : `${colorB}08`,
                  border: `1px solid ${senderColor}18`,
                  borderRadius: isSenderA ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  padding: '12px 16px',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${senderColor}33`}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${senderColor}18`}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    gap: 12, marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: senderColor }}>{senderName}</span>
                    <span style={{
                      fontSize: 9, color: '#3a3f4e',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>#{msg.id}</span>
                  </div>
                  <div
                    className="md-content dm-content"
                    style={{
                      fontSize: 14, color: '#a5aab8', lineHeight: 1.7,
                      fontFamily: "'Crimson Pro', serif",
                    }}
                    dangerouslySetInnerHTML={{ __html: md(msg.content) }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideInDM {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dm-content p { margin: 0 0 8px; }
        .dm-content p:last-child { margin: 0; }
        .dm-content strong { color: #d0d4e0; }
        .dm-content em { color: #8b8fa0; }
        .dm-content h1, .dm-content h2, .dm-content h3 { color: #d0d4e0; font-family: 'Crimson Pro', serif; margin: 8px 0 4px; }
        .dm-content h1 { font-size: 17px; }
        .dm-content h2 { font-size: 15px; }
        .dm-content h3 { font-size: 14px; }
        .dm-content ul, .dm-content ol { margin: 6px 0; padding-left: 18px; }
        .dm-content li { margin-bottom: 3px; }
        .dm-content blockquote { border-left: 2px solid rgba(245,158,11,0.3); padding-left: 12px; color: #777d8e; margin: 8px 0; font-style: italic; }
        .dm-content code { background: rgba(245,158,11,0.08); padding: 1px 5px; border-radius: 3px; font-size: 12px; color: #f59e0b; font-family: 'JetBrains Mono', monospace; }
        .dm-content table { border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 12px; }
        .dm-content th, .dm-content td { border: 1px solid rgba(255,255,255,0.06); padding: 4px 8px; }
        .dm-content th { background: rgba(245,158,11,0.06); color: #f59e0b; }
        .dm-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 10px 0; }
      `}</style>
    </section>
  )
}
