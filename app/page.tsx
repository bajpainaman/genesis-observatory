'use client'

import { useState, useEffect } from 'react'
import type { GenesisData } from './components/types'
import Hero from './components/Hero'
import AgentNetwork from './components/AgentNetwork'
import AgentCard from './components/AgentCard'
import TownHallFeed from './components/TownHallFeed'
import Economy from './components/Economy'
import FamilyTree from './components/FamilyTree'
import DMReader from './components/DMReader'
import EventLog from './components/EventLog'
import Petitions from './components/Petitions'
import { AGENT_COLORS, AGENT_NAMES } from './components/constants'

type Tab = 'network' | 'townhall' | 'dms' | 'economy' | 'family' | 'events' | 'petitions'

const TABS: { id: Tab; label: string; color: string; count?: (d: GenesisData) => number }[] = [
  { id: 'network', label: 'Network', color: '#8b5cf6' },
  { id: 'townhall', label: 'Town Hall', color: '#a78bfa', count: d => d.messages.filter(m => m.channel === 'town_hall').length },
  { id: 'dms', label: 'Private DMs', color: '#f59e0b', count: d => d.messages.filter(m => m.channel === 'dm').length },
  { id: 'economy', label: 'Economy', color: '#10b981' },
  { id: 'family', label: 'Family Tree', color: '#fbbf24' },
  { id: 'events', label: 'Events', color: '#34d399', count: d => d.events.length },
  { id: 'petitions', label: 'Petitions', color: '#ef4444', count: d => d.petitions.length },
]

export default function Page() {
  const [data, setData] = useState<GenesisData | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('network')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: GenesisData) => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        setLoadError(String(e.message))
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: 20,
        background: '#0a0a0f',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {/* Orbital loader */}
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <div style={{
            position: 'absolute', inset: 0,
            border: '1.5px solid rgba(139,92,246,0.15)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            border: '1.5px solid transparent',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'obspin 0.9s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 12,
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', inset: 12,
            border: '1px solid transparent',
            borderBottomColor: '#f59e0b',
            borderRadius: '50%',
            animation: 'obspin 1.4s linear infinite reverse',
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Decoding Archive
        </div>
        <style>{`@keyframes obspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', color: '#ef4444', background: '#0a0a0f',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
        flexDirection: 'column', gap: 8,
      }}>
        <div>Failed to load archive</div>
        <div style={{ color: '#4b5563', fontSize: 11 }}>{loadError}</div>
      </div>
    )
  }

  const handleSelectAgent = (id: string | null) => {
    setSelectedAgent(id)
  }

  const handleFamilyClick = (id: string) => {
    setSelectedAgent(id)
    setActiveTab('network')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e2d9f3',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.25); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.45); }

        select option { background: #0c0c15 !important; }

        /* Markdown content rendered by marked */
        .md-content h1 { font-size: 19px; font-family: 'Crimson Pro', serif; color: #e2d9f3; margin: 14px 0 8px; font-weight: 700; }
        .md-content h2 { font-size: 16px; font-family: 'Crimson Pro', serif; color: #c4b5fd; margin: 12px 0 6px; font-weight: 600; }
        .md-content h3 { font-size: 14px; font-family: 'Crimson Pro', serif; color: #a78bfa; margin: 10px 0 5px; font-weight: 600; }
        .md-content p { margin: 0 0 10px; color: #bfc4d0; line-height: 1.75; }
        .md-content strong { color: #e2d9f3; }
        .md-content em { color: #c4b5fd; font-style: italic; }
        .md-content ul, .md-content ol { margin: 6px 0 10px 18px; }
        .md-content li { color: #9ca3af; margin-bottom: 4px; line-height: 1.65; }
        .md-content blockquote { border-left: 2px solid rgba(139,92,246,0.4); padding: 4px 12px; margin: 8px 0; color: #8b5cf6; font-style: italic; }
        .md-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 14px 0; }
        .md-content code { background: rgba(16,185,129,0.08); color: #10b981; padding: 1px 5px; border-radius: 3px; font-size: 12px; font-family: 'JetBrains Mono', monospace; }
        .md-content pre { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 12px 14px; margin: 10px 0; overflow-x: auto; }
        .md-content pre code { background: none; padding: 0; color: #9ca3af; }
        .md-content table { border-collapse: collapse; margin: 10px 0; width: 100%; font-size: 12px; }
        .md-content th { background: rgba(139,92,246,0.08); color: #8b5cf6; border: 1px solid rgba(255,255,255,0.07); padding: 5px 10px; text-align: left; }
        .md-content td { border: 1px solid rgba(255,255,255,0.05); padding: 5px 10px; color: #9ca3af; }
        .md-content a { color: #8b5cf6; }

        @keyframes obspin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideInDM { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes heroPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>

      {/* Hero */}
      <Hero data={data} />

      {/* Sticky nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', overflowX: 'auto',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          padding: '0 20px',
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const count = tab.count ? tab.count(data) : null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flexShrink: 0,
                  padding: '13px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? tab.color : 'transparent'}`,
                  color: isActive ? tab.color : '#4b5563',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.06em',
                  transition: 'color 0.18s, border-color 0.18s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = '#9ca3af'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = '#4b5563'
                }}
              >
                {tab.label}
                {count !== null && (
                  <span style={{
                    background: isActive ? `${tab.color}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? tab.color + '44' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, padding: '1px 6px', fontSize: 9,
                    color: isActive ? tab.color : '#374151',
                    fontWeight: 600,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* NETWORK TAB */}
        {activeTab === 'network' && (
          <div>
            {/* Graph + selected agent card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: selectedAgent ? 'minmax(0, 1fr) 420px' : '1fr',
              gap: 24,
              alignItems: 'flex-start',
              marginBottom: 36,
            }}>
              <AgentNetwork
                data={data}
                selectedAgent={selectedAgent}
                onSelectAgent={handleSelectAgent}
              />
              {selectedAgent && (
                <AgentCard
                  agentId={selectedAgent}
                  data={data}
                  onClose={() => setSelectedAgent(null)}
                />
              )}
            </div>

            {/* Agent roster */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10, color: '#4b5563',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span>All Agents</span>
                <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ color: '#374151' }}>{data.agents.length} total</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 10,
              }}>
                {data.agents.map(agent => {
                  const identity = data.identities[agent.id]
                  const name = identity?.name || AGENT_NAMES[agent.id] || agent.id
                  const color = AGENT_COLORS[agent.id]
                  const isChild = agent.parent_a !== null
                  const msgCount = data.messages.filter(m => m.from_agent === agent.id).length
                  const eventCount = data.events.filter(e => e.agent_id === agent.id).length
                  const isSelected = selectedAgent === agent.id

                  return (
                    <div
                      key={agent.id}
                      onClick={() => handleSelectAgent(isSelected ? null : agent.id)}
                      style={{
                        padding: '13px 15px',
                        background: isSelected ? `${color}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? color + '45' : 'rgba(255,255,255,0.055)'}`,
                        borderLeft: `3px solid ${isSelected ? color : color + '60'}`,
                        borderRadius: '0 8px 8px 0',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.background = `${color}08`
                          ;(e.currentTarget as HTMLElement).style.borderColor = color + '30'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'
                          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.055)'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{name}</span>
                        {isChild && (
                          <span style={{
                            fontSize: 8, padding: '1px 5px',
                            background: 'rgba(245,158,11,0.12)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: 3, color: '#f59e0b',
                            alignSelf: 'flex-start',
                          }}>GEN2</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: '#374151', marginBottom: 6 }}>{agent.id}</div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#555b6e' }}>
                        <span style={{ color: '#10b981' }}>{agent.balance.toLocaleString()} G</span>
                        <span>{msgCount}m</span>
                        <span>{eventCount}e</span>
                        <span>{agent.lifespan.toLocaleString()} ticks</span>
                      </div>
                      {identity?.persona && (
                        <div style={{
                          fontSize: 10, color: '#3a3f4e', marginTop: 7,
                          lineHeight: 1.5, fontStyle: 'italic',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}>
                          {identity.persona.slice(0, 120)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'townhall' && <TownHallFeed data={data} />}

        {activeTab === 'dms' && <DMReader data={data} />}

        {activeTab === 'economy' && <Economy data={data} />}

        {activeTab === 'family' && (
          <FamilyTree data={data} onSelectAgent={handleFamilyClick} />
        )}

        {activeTab === 'events' && <EventLog data={data} />}

        {activeTab === 'petitions' && <Petitions data={data} />}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: 10,
        color: '#2d3748',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.08em',
      }}>
        GENESIS OBSERVATORY · {data.agents.length} AGENTS · {data.messages.length} MESSAGES · {data.events.length} EVENTS · SIMULATION COMPLETE
      </footer>
    </div>
  )
}
