'use client'

import { useState, useEffect, useRef } from 'react'
import { GenesisData } from './components/types'
import Hero from './components/Hero'
import ConstellationGraph from './components/ConstellationGraph'
import AgentCards from './components/AgentCards'
import CivTimeline from './components/CivTimeline'
import TownHallFeed from './components/TownHallFeed'
import DMReader from './components/DMReader'
import Economy from './components/Economy'
import FamilyTree from './components/FamilyTree'
import Nations from './components/Nations'
import Petitions from './components/Petitions'
import EconomicGraph from './components/EconomicGraph'

type Tab = 'overview' | 'graph' | 'timeline' | 'town-hall' | 'dms' | 'economy' | 'family' | 'governance' | 'petitions'

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'overview', label: 'Overview', color: '#8b5cf6' },
  { id: 'graph', label: '3D Graph', color: '#888' },
  { id: 'timeline', label: 'Timeline', color: '#8b5cf6' },
  { id: 'town-hall', label: 'Town Hall', color: '#8b5cf6' },
  { id: 'dms', label: 'DMs', color: '#f59e0b' },
  { id: 'economy', label: 'Economy', color: '#10b981' },
  { id: 'family', label: 'Lineage', color: '#f59e0b' },
  { id: 'governance', label: 'Governance', color: '#10b981' },
  { id: 'petitions', label: 'Petitions', color: '#ef4444' },
]

export default function Home() {
  const [data, setData] = useState<GenesisData | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/data.json')
      .then(r => r.json())
      .then(d => setData(d))
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setSelectedAgent(null)
    if (contentRef.current) {
      const y = contentRef.current.getBoundingClientRect().top + window.scrollY - 60
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
  }

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 20,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '2px solid #8b5cf622',
          borderTopColor: '#8b5cf6',
          animation: 'loadSpin 1s linear infinite',
        }} />
        <div style={{
          fontSize: 14, color: '#555b6e',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.1em',
        }}>
          DECODING SIGNAL...
        </div>
        <style>{`
          @keyframes loadSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Deep space background */}
      <div style={{
        position: 'fixed', inset: 0,
        background: `
          radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.04) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(245,158,11,0.02) 0%, transparent 40%),
          radial-gradient(circle at 80% 60%, rgba(16,185,129,0.02) 0%, transparent 40%),
          #0a0a0f
        `,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Sticky navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled ? 'rgba(10,10,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          height: 52,
          gap: 4,
          overflowX: 'auto',
        }}>
          <div
            style={{
              fontSize: 13, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#8b5cf6',
              marginRight: 20,
              flexShrink: 0,
              cursor: 'pointer',
              letterSpacing: '-0.02em',
            }}
            onClick={() => { setActiveTab('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          >
            GENESIS
          </div>

          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: active ? tab.color : '#555b6e',
                  borderBottom: `2px solid ${active ? tab.color : 'transparent'}`,
                  transition: 'color 0.2s, border-color 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = tab.color + '88'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#555b6e'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        {activeTab === 'overview' && (
          <>
            <Hero data={data} />

            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <ConstellationGraph
                data={data}
                onSelectAgent={(id) => setSelectedAgent(id === selectedAgent ? null : id)}
                selectedAgent={selectedAgent}
              />
            </div>

            <AgentCards
              data={data}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
            />

            {/* Quick navigation cards */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
              padding: '40px 24px',
            }}>
              <div style={{
                maxWidth: 900, margin: '0 auto',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}>
                {[
                  { label: 'Explore the full timeline', desc: 'Every message and event in order', tab: 'timeline' as Tab, color: '#8b5cf6' },
                  { label: 'Read town hall speeches', desc: '185 public addresses', tab: 'town-hall' as Tab, color: '#8b5cf6' },
                  { label: 'Decode private DMs', desc: '523 encrypted transmissions', tab: 'dms' as Tab, color: '#f59e0b' },
                  { label: 'Study the economy', desc: 'Balances, transfers, pools', tab: 'economy' as Tab, color: '#10b981' },
                  { label: 'Trace the lineage', desc: '5 founders, 3 children', tab: 'family' as Tab, color: '#f59e0b' },
                  { label: 'Read the Charter', desc: 'The Commons constitution', tab: 'governance' as Tab, color: '#10b981' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => switchTab(item.tab)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 10,
                      padding: '18px 20px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.3s, transform 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${item.color}33`
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{
                      fontSize: 14, color: item.color, fontWeight: 600, marginBottom: 4,
                    }}>{item.label}</div>
                    <div style={{
                      fontSize: 12, color: '#555b6e',
                      fontFamily: "'Crimson Pro', serif",
                    }}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div ref={contentRef}>
          {activeTab === 'graph' && (
            <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
              <EconomicGraph data={data} />
            </div>
          )}
          {activeTab === 'timeline' && <CivTimeline data={data} />}
          {activeTab === 'town-hall' && <TownHallFeed data={data} />}
          {activeTab === 'dms' && <DMReader data={data} />}
          {activeTab === 'economy' && <Economy data={data} />}
          {activeTab === 'family' && (
            <FamilyTree data={data} onSelectAgent={(id) => {
              setSelectedAgent(id)
              setActiveTab('overview')
            }} />
          )}
          {activeTab === 'governance' && <Nations data={data} />}
          {activeTab === 'petitions' && <Petitions data={data} />}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 12, color: '#3a3f4e',
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1.8,
        }}>
          <div>Genesis Observatory -- Archive of the First Autonomous Civilization</div>
          <div>{data.agents.length} agents / {data.messages.length} messages / {data.events.length} events</div>
        </div>
      </footer>

      {/* Global styles */}
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.35); }
        ::selection { background: rgba(139,92,246,0.3); }
        html { scroll-behavior: smooth; }

        @media (max-width: 768px) {
          nav { padding: 0 12px !important; }
          nav > div { gap: 0 !important; }
          nav button { padding: 8px 10px !important; font-size: 11px !important; }
        }
      `}</style>
    </div>
  )
}
