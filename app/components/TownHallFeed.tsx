'use client'

import { useState, useMemo } from 'react'
import { marked } from 'marked'
import { GenesisData } from './types'
import { AGENT_COLORS, AGENT_NAMES, getShortName } from './constants'

marked.setOptions({ breaks: true, gfm: true })

interface Props {
  data: GenesisData
}

function md(s: string): string {
  try { return marked.parse(s || '') as string } catch { return s || '' }
}

export default function TownHallFeed({ data }: Props) {
  const [filterAgent, setFilterAgent] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [visibleCount, setVisibleCount] = useState(20)

  const messages = useMemo(() => {
    let msgs = data.messages.filter(m => m.channel === 'town_hall')
    if (filterAgent) msgs = msgs.filter(m => m.from_agent === filterAgent)
    return msgs.sort((a, b) => a.id - b.id)
  }, [data.messages, filterAgent])

  const visibleMessages = messages.slice(0, visibleCount)

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section style={{ padding: '48px 24px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#8b5cf6',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          margin: '0 0 8px',
        }}>Town Hall Archive</h2>
        <p style={{ fontSize: 15, color: '#555b6e', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
          {messages.length} public messages from the civilization's central forum
        </p>
      </div>

      {/* Filter chips */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <button
          onClick={() => { setFilterAgent(null); setVisibleCount(20) }}
          style={{
            background: !filterAgent ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${!filterAgent ? '#8b5cf644' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 20, padding: '5px 16px', cursor: 'pointer',
            fontSize: 11, color: !filterAgent ? '#a78bfa' : '#555b6e',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.2s',
          }}
        >All ({data.messages.filter(m => m.channel === 'town_hall').length})</button>
        {data.agents.map(a => {
          const active = filterAgent === a.id
          const color = AGENT_COLORS[a.id]
          const count = data.messages.filter(m => m.channel === 'town_hall' && m.from_agent === a.id).length
          if (count === 0) return null
          return (
            <button
              key={a.id}
              onClick={() => { setFilterAgent(active ? null : a.id); setVisibleCount(20) }}
              style={{
                background: active ? `${color}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? `${color}55` : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
                fontSize: 11, color: active ? color : '#555b6e',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.2s',
              }}
            >{getShortName(a.id)} ({count})</button>
          )
        })}
      </div>

      {/* Messages feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleMessages.map((m, idx) => {
          const color = AGENT_COLORS[m.from_agent] || '#8b5cf6'
          const name = getShortName(m.from_agent)
          const isLong = m.content.length > 500
          const isExpanded = expanded.has(m.id)
          const content = isLong && !isExpanded ? m.content.substring(0, 500) + '...' : m.content

          return (
            <article
              key={m.id}
              style={{
                background: '#0c0c15',
                border: '1px solid rgba(255,255,255,0.05)',
                borderLeft: `3px solid ${color}`,
                borderRadius: '0 10px 10px 0',
                overflow: 'hidden',
                animation: `fadeSlideIn 0.4s ease ${Math.min(idx * 0.03, 0.5)}s both`,
              }}
            >
              {/* Author bar */}
              <div style={{
                padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: 10,
                background: `${color}06`,
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${color}bb, ${color}44)`,
                  flexShrink: 0,
                }} />
                <span style={{ color, fontWeight: 600, fontSize: 13 }}>{name}</span>
                <span style={{
                  color: '#3a3f4e', fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace", marginLeft: 'auto',
                }}>#{m.id}</span>
              </div>

              {/* Content */}
              <div style={{ padding: '16px 22px 18px' }}>
                <div
                  className="md-content"
                  style={{
                    fontSize: 15, color: '#bfc4d0', lineHeight: 1.75,
                    fontFamily: "'Crimson Pro', serif",
                  }}
                  dangerouslySetInnerHTML={{ __html: md(content) }}
                />
                {isLong && (
                  <button
                    onClick={() => toggleExpand(m.id)}
                    style={{
                      background: 'none', border: 'none', color: '#8b5cf6',
                      cursor: 'pointer', fontSize: 12, padding: '8px 0 0',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {isExpanded ? 'Collapse' : 'Read full message'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* Load more */}
      {visibleCount < messages.length && (
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button
            onClick={() => setVisibleCount(v => v + 30)}
            style={{
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 8, padding: '10px 28px', cursor: 'pointer',
              color: '#a78bfa', fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.15)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)'}
          >
            Load more ({messages.length - visibleCount} remaining)
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .md-content p { margin: 0 0 10px; }
        .md-content h1 { font-size: 20px; color: #e2d9f3; margin: 14px 0 8px; font-weight: 700; font-family: 'Crimson Pro', serif; }
        .md-content h2 { font-size: 17px; color: #e2d9f3; margin: 12px 0 6px; font-weight: 600; font-family: 'Crimson Pro', serif; }
        .md-content h3 { font-size: 15px; color: #c4b5fd; margin: 10px 0 5px; font-weight: 600; font-family: 'Crimson Pro', serif; }
        .md-content strong { color: #e2d9f3; font-weight: 700; }
        .md-content em { color: #a5aab8; font-style: italic; }
        .md-content ul, .md-content ol { margin: 8px 0; padding-left: 20px; }
        .md-content li { margin-bottom: 4px; }
        .md-content blockquote { border-left: 3px solid rgba(139,92,246,0.4); padding-left: 14px; color: #8b8fa0; margin: 10px 0; font-style: italic; }
        .md-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 14px 0; }
        .md-content code { background: rgba(139,92,246,0.1); padding: 2px 6px; border-radius: 3px; font-size: 13px; color: #10b981; font-family: 'JetBrains Mono', monospace; }
        .md-content pre { background: #0f0f1a; padding: 14px; border-radius: 8px; margin: 10px 0; overflow-x: auto; border: 1px solid rgba(255,255,255,0.05); }
        .md-content pre code { background: none; padding: 0; }
        .md-content table { border-collapse: collapse; margin: 10px 0; width: 100%; font-size: 13px; }
        .md-content th, .md-content td { border: 1px solid rgba(255,255,255,0.08); padding: 6px 10px; text-align: left; }
        .md-content th { background: rgba(139,92,246,0.08); color: #a78bfa; font-weight: 600; }
        .md-content a { color: #8b5cf6; text-decoration: none; }
      `}</style>
    </section>
  )
}
