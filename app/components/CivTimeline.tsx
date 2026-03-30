'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { marked } from 'marked'
import { GenesisData, Message, GameEvent } from './types'
import { AGENT_COLORS, AGENT_SHORT, EVENT_LABELS, EVENT_ICONS, FOUNDER_IDS, CHILD_IDS, getShortName, isChild } from './constants'

marked.setOptions({ breaks: true, gfm: true })

interface Props {
  data: GenesisData
}

type TimelineItem = {
  type: 'message'
  msg: Message
  tick: number
  id: number
} | {
  type: 'event'
  event: GameEvent
  tick: number
  id: number
}

function md(s: string): string {
  try { return marked.parse(s || '') as string } catch { return s || '' }
}

const ALL_AGENTS = [...FOUNDER_IDS, ...CHILD_IDS]

export default function CivTimeline({ data }: Props) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'town_hall' | 'dm' | 'event'>('all')
  const [visibleCount, setVisibleCount] = useState(60)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Merge all items into a single timeline sorted by id/tick
  const allItems = useMemo((): TimelineItem[] => {
    const msgs: TimelineItem[] = data.messages.map(m => ({
      type: 'message' as const, msg: m, tick: m.tick, id: m.id,
    }))
    const evts: TimelineItem[] = data.events.map(e => ({
      type: 'event' as const, event: e, tick: e.tick, id: e.id + 100000,
    }))
    let items = [...msgs, ...evts].sort((a, b) => a.tick - b.tick || a.id - b.id)

    if (filterType === 'town_hall') items = items.filter(i => i.type === 'message' && i.msg.channel === 'town_hall')
    if (filterType === 'dm') items = items.filter(i => i.type === 'message' && i.msg.channel === 'dm')
    if (filterType === 'event') items = items.filter(i => i.type === 'event')

    return items
  }, [data, filterType])

  const visibleItems = allItems.slice(0, visibleCount)

  // Agent lane positions
  const laneWidth = 70
  const totalLaneWidth = ALL_AGENTS.length * laneWidth
  const getAgentLaneX = useCallback((agentId: string) => {
    const idx = ALL_AGENTS.indexOf(agentId)
    return idx >= 0 ? idx * laneWidth + laneWidth / 2 : -1
  }, [])

  const isMajorEvent = (e: GameEvent) =>
    ['birth', 'found_nation', 'create_token', 'operator_response', 'child_proposal', 'child_accepted'].includes(e.event_type)

  return (
    <section style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#8b5cf6',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          margin: '0 0 8px',
        }}>Civilization Timeline</h2>
        <p style={{ fontSize: 15, color: '#555b6e', margin: 0, fontFamily: "'Crimson Pro', serif" }}>
          Every message and event, chronologically. {allItems.length} records spanning the full history.
        </p>
      </div>

      {/* Filter row */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap',
      }}>
        {([
          ['all', 'All', '#8b5cf6'],
          ['town_hall', 'Town Hall', '#8b5cf6'],
          ['dm', 'Private DMs', '#f59e0b'],
          ['event', 'On-Chain Events', '#10b981'],
        ] as const).map(([key, label, color]) => (
          <button
            key={key}
            onClick={() => { setFilterType(key); setVisibleCount(60); setExpandedItem(null) }}
            style={{
              background: filterType === key ? `${color}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filterType === key ? `${color}44` : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 20, padding: '6px 18px', cursor: 'pointer',
              fontSize: 12, color: filterType === key ? color : '#555b6e',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'all 0.2s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Lane headers */}
      <div style={{
        overflowX: 'auto',
        position: 'relative',
      }}>
        <div style={{
          minWidth: totalLaneWidth + 40,
          position: 'sticky', top: 0, zIndex: 5,
          background: '#0a0a0f',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 8,
          marginBottom: 0,
        }}>
          <div style={{ display: 'flex', paddingLeft: 20 }}>
            {ALL_AGENTS.map(id => {
              const color = AGENT_COLORS[id]
              return (
                <div key={id} style={{
                  width: laneWidth, textAlign: 'center',
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color, fontWeight: 600,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: color, margin: '0 auto 4px',
                    boxShadow: `0 0 6px ${color}44`,
                  }} />
                  {AGENT_SHORT[id]?.split(' ')[0] || id}
                </div>
              )
            })}
          </div>
        </div>

        {/* Timeline entries */}
        <div
          ref={scrollRef}
          style={{
            minWidth: totalLaneWidth + 40,
            position: 'relative',
          }}
        >
          {/* Lane lines (vertical guides) */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 20, right: 0,
            pointerEvents: 'none',
          }}>
            {ALL_AGENTS.map(id => {
              const x = getAgentLaneX(id)
              return (
                <div key={id} style={{
                  position: 'absolute',
                  left: x,
                  top: 0, bottom: 0,
                  width: 1,
                  background: `${AGENT_COLORS[id]}0a`,
                }} />
              )
            })}
          </div>

          {/* Items */}
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            {visibleItems.map((item, idx) => {
              const isExpanded = expandedItem === item.id

              if (item.type === 'message') {
                const msg = item.msg
                const fromX = getAgentLaneX(msg.from_agent)
                const toX = msg.to_agent ? getAgentLaneX(msg.to_agent) : -1
                const color = AGENT_COLORS[msg.from_agent] || '#8b5cf6'
                const isTownHall = msg.channel === 'town_hall'
                const isDm = msg.channel === 'dm'

                return (
                  <div
                    key={`msg-${msg.id}`}
                    style={{
                      position: 'relative',
                      height: isExpanded ? 'auto' : 32,
                      minHeight: 32,
                      display: 'flex',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      borderBottom: '1px solid rgba(255,255,255,0.02)',
                    }}
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    {/* Node dot on sender lane */}
                    <div style={{
                      position: 'absolute',
                      left: fromX - 5,
                      top: 11,
                      width: 10, height: 10,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 6px ${color}66`,
                      zIndex: 2,
                    }} />

                    {/* DM arc between two agents */}
                    {isDm && toX >= 0 && (
                      <svg style={{
                        position: 'absolute',
                        left: 0, top: 0,
                        width: totalLaneWidth,
                        height: 32,
                        pointerEvents: 'none',
                        overflow: 'visible',
                      }}>
                        <line
                          x1={fromX} y1={16}
                          x2={toX} y2={16}
                          stroke={`${AGENT_COLORS[msg.to_agent!] || '#f59e0b'}`}
                          strokeWidth={1}
                          strokeOpacity={0.25}
                          strokeDasharray="3 3"
                        />
                        <circle cx={toX} cy={16} r={4}
                          fill={AGENT_COLORS[msg.to_agent!] || '#f59e0b'}
                          fillOpacity={0.5}
                        />
                      </svg>
                    )}

                    {/* Town hall: span across all lanes */}
                    {isTownHall && (
                      <svg style={{
                        position: 'absolute',
                        left: 0, top: 0,
                        width: totalLaneWidth,
                        height: 32,
                        pointerEvents: 'none',
                      }}>
                        <line
                          x1={laneWidth / 2} y1={16}
                          x2={totalLaneWidth - laneWidth / 2} y2={16}
                          stroke={color}
                          strokeWidth={1}
                          strokeOpacity={0.08}
                        />
                      </svg>
                    )}

                    {/* Info column (right side) */}
                    <div style={{
                      position: 'absolute',
                      left: totalLaneWidth + 8,
                      top: isExpanded ? 6 : 7,
                      right: 0,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: 8,
                        whiteSpace: isExpanded ? 'normal' : 'nowrap',
                      }}>
                        <span style={{
                          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                          color, fontWeight: 600,
                        }}>{getShortName(msg.from_agent)}</span>
                        {isDm && msg.to_agent && (
                          <>
                            <span style={{ color: '#3a3f4e', fontSize: 9 }}>-&gt;</span>
                            <span style={{
                              fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                              color: AGENT_COLORS[msg.to_agent] || '#555b6e', fontWeight: 500,
                            }}>{getShortName(msg.to_agent)}</span>
                          </>
                        )}
                        {isTownHall && (
                          <span style={{
                            fontSize: 9, color: '#8b5cf644',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>TOWN HALL</span>
                        )}
                        {!isExpanded && (
                          <span style={{
                            fontSize: 11, color: '#555b6e',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            fontFamily: "'Crimson Pro', serif",
                          }}>
                            {msg.content.substring(0, 120)}
                          </span>
                        )}
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div style={{
                          marginTop: 8, marginBottom: 12,
                          padding: '12px 16px',
                          background: '#0d0d16',
                          border: `1px solid ${color}22`,
                          borderRadius: 8,
                          maxHeight: 400,
                          overflowY: 'auto',
                        }}>
                          <div
                            className="md-content timeline-md"
                            style={{
                              fontSize: 14, color: '#bfc4d0', lineHeight: 1.7,
                              fontFamily: "'Crimson Pro', serif",
                            }}
                            dangerouslySetInnerHTML={{ __html: md(msg.content) }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              // Event item
              const evt = item.event
              const agentX = getAgentLaneX(evt.agent_id)
              const color = AGENT_COLORS[evt.agent_id] || '#10b981'
              const major = isMajorEvent(evt)
              const label = EVENT_LABELS[evt.event_type] || evt.event_type
              const icon = EVENT_ICONS[evt.event_type] || 'EVT'

              // Parse event data
              let eventDetail = ''
              try {
                const d = JSON.parse(evt.data_json)
                if (d.to && d.amount) eventDetail = `${d.amount}G -> ${getShortName(d.to)}`
                else if (d.name) eventDetail = d.name
                else if (d.child_id) eventDetail = `Child: ${getShortName(d.child_id)}`
                else if (d.parent_a) eventDetail = `Parents: ${getShortName(d.parent_a)} + ${getShortName(d.parent_b)}`
              } catch {}

              return (
                <div
                  key={`evt-${evt.id}`}
                  style={{
                    position: 'relative',
                    height: major ? 36 : 28,
                    display: 'flex',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                    background: major ? 'rgba(16,185,129,0.02)' : 'transparent',
                  }}
                >
                  {/* Event marker */}
                  {agentX >= 0 && (
                    <div style={{
                      position: 'absolute',
                      left: agentX - (major ? 7 : 4),
                      top: major ? 10 : 10,
                      width: major ? 14 : 8,
                      height: major ? 14 : 8,
                      borderRadius: major ? 3 : '50%',
                      background: '#10b981',
                      boxShadow: major ? '0 0 10px rgba(16,185,129,0.4)' : '0 0 4px rgba(16,185,129,0.3)',
                      zIndex: 2,
                    }} />
                  )}

                  {/* Event info */}
                  <div style={{
                    position: 'absolute',
                    left: totalLaneWidth + 8,
                    top: major ? 8 : 6,
                    display: 'flex', alignItems: 'baseline', gap: 8,
                    whiteSpace: 'nowrap',
                  }}>
                    <span style={{
                      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                      color: '#10b981', fontWeight: 600,
                      background: 'rgba(16,185,129,0.1)',
                      padding: '1px 6px', borderRadius: 3,
                    }}>{icon}</span>
                    <span style={{
                      fontSize: 11, color: '#10b981', fontWeight: major ? 600 : 400,
                    }}>{label}</span>
                    <span style={{
                      fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                      color: '#555b6e',
                    }}>{getShortName(evt.agent_id)}</span>
                    {eventDetail && (
                      <span style={{
                        fontSize: 10, color: '#444a5a',
                        fontFamily: "'Crimson Pro', serif",
                      }}>{eventDetail}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Load more */}
      {visibleCount < allItems.length && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={() => setVisibleCount(v => v + 80)}
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
            Load more ({allItems.length - visibleCount} remaining)
          </button>
        </div>
      )}

      <style>{`
        .timeline-md p { margin: 0 0 8px; }
        .timeline-md h1, .timeline-md h2, .timeline-md h3 { color: #e2d9f3; font-family: 'Crimson Pro', serif; }
        .timeline-md h1 { font-size: 18px; margin: 10px 0 6px; }
        .timeline-md h2 { font-size: 16px; margin: 8px 0 5px; }
        .timeline-md h3 { font-size: 14px; margin: 6px 0 4px; }
        .timeline-md strong { color: #d0d4e0; }
        .timeline-md em { color: #8b8fa0; }
        .timeline-md ul, .timeline-md ol { margin: 6px 0; padding-left: 18px; }
        .timeline-md li { margin-bottom: 3px; }
        .timeline-md blockquote { border-left: 2px solid rgba(139,92,246,0.3); padding-left: 12px; color: #777d8e; margin: 8px 0; }
        .timeline-md code { background: rgba(139,92,246,0.1); padding: 1px 5px; border-radius: 3px; font-size: 12px; color: #10b981; font-family: 'JetBrains Mono', monospace; }
        .timeline-md pre { background: #0a0a14; padding: 12px; border-radius: 6px; margin: 8px 0; overflow-x: auto; border: 1px solid rgba(255,255,255,0.04); }
        .timeline-md pre code { background: none; padding: 0; }
        .timeline-md table { border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 12px; }
        .timeline-md th, .timeline-md td { border: 1px solid rgba(255,255,255,0.06); padding: 4px 8px; }
        .timeline-md th { background: rgba(139,92,246,0.06); color: #a78bfa; }
        .timeline-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 10px 0; }
      `}</style>
    </section>
  )
}
