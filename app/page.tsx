'use client'

import { useState, useEffect } from 'react'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

interface Agent {
  id: string; name: string; pubkey: string; balance: number; status: string;
  lifespan: number; generation: number; parent_a: string; parent_b: string;
}
interface Message {
  id: number; from_agent: string; to_agent: string; channel: string;
  content: string; tick: number; timestamp: number;
}
interface Event {
  id: number; tick: number; agent_id: string; event_type: string;
  data_json: string; timestamp: number;
}
interface Identity {
  name?: string; persona?: string; values?: string;
  goals?: any[]; relationships?: Record<string, any>;
  reflections?: any[]; world_model?: string;
}
interface Data {
  agents: Agent[]; messages: Message[]; events: Event[];
  identities: Record<string, Identity>; proposals?: any; petitions?: any[];
}

function md(s: string) {
  try { return marked.parse(s || '') as string } catch { return s || '' }
}

export default function Home() {
  const [data, setData] = useState<Data | null>(null)
  const [tab, setTab] = useState('agents')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div style={{ padding: 40, color: '#666' }}>Loading Genesis...</div>

  const townHall = data.messages.filter(m => m.channel === 'town_hall').reverse()
  const dms = data.messages.filter(m => m.channel === 'dm').reverse()
  const agentDms = selectedAgent
    ? dms.filter(m => m.from_agent === selectedAgent || m.to_agent === selectedAgent)
    : dms

  const stats = {
    agents: data.agents.length,
    townHall: townHall.length,
    dms: dms.length,
    events: data.events.length,
    totalMessages: data.messages.length,
  }

  const tabs = ['agents', 'town-hall', 'dms', 'events', 'nations', 'petitions']

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#111118', borderBottom: '1px solid #2a2a3a', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ fontSize: 18, color: '#8b5cf6', margin: 0 }}>GENESIS OBSERVATORY</h1>
        <div style={{ color: '#666', fontSize: 12 }}>
          Agents <span style={{ color: '#8b5cf6' }}>{stats.agents}</span> |
          Messages <span style={{ color: '#8b5cf6' }}>{stats.totalMessages}</span> ({stats.townHall} public, {stats.dms} DMs) |
          Events <span style={{ color: '#8b5cf6' }}>{stats.events}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: '#111118', padding: '0 24px', borderBottom: '1px solid #2a2a3a' }}>
        {tabs.map(t => (
          <div key={t} onClick={() => { setTab(t); setSelectedAgent(null) }}
            style={{ padding: '10px 20px', cursor: 'pointer', color: tab === t ? '#8b5cf6' : '#666',
              borderBottom: tab === t ? '2px solid #8b5cf6' : '2px solid transparent', transition: 'all 0.2s' }}>
            {t.replace('-', ' ').toUpperCase()}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 24px', maxWidth: 1400, paddingBottom: 40 }}>

        {tab === 'agents' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
            {data.agents.map(a => {
              const id = data.identities[a.id] || {}
              const chosenName = id.name || a.name
              const isChild = a.id.match(/entity-[678]/)
              return (
                <div key={a.id} style={{ background: '#14141e', border: `1px solid ${isChild ? '#f59e0b33' : '#2a2a3a'}`, borderRadius: 8, padding: 14, cursor: 'pointer' }}
                  onClick={() => { setTab('dms'); setSelectedAgent(a.id) }}>
                  <h3 style={{ color: isChild ? '#f59e0b' : '#8b5cf6', fontSize: 14, margin: '0 0 8px' }}>
                    {chosenName} <span style={{ color: '#444', fontSize: 11 }}>({a.id})</span>
                    {isChild && <span style={{ color: '#f59e0b', fontSize: 10, marginLeft: 8 }}>GEN 1</span>}
                  </h3>
                  <div style={{ margin: '4px 0' }}><span style={{ color: '#666', fontSize: 11 }}>BALANCE</span><div style={{ color: '#ccc' }}>{a.balance.toLocaleString()} GENESIS</div></div>
                  <div style={{ margin: '4px 0' }}><span style={{ color: '#666', fontSize: 11 }}>LIFESPAN</span><div style={{ color: '#ccc' }}>{a.lifespan} ticks</div></div>
                  {a.parent_a && <div style={{ margin: '4px 0' }}><span style={{ color: '#666', fontSize: 11 }}>PARENTS</span><div style={{ color: '#ccc' }}>{a.parent_a} + {a.parent_b}</div></div>}
                  <div style={{ margin: '4px 0' }}><span style={{ color: '#666', fontSize: 11 }}>PERSONA</span>
                    <div style={{ color: '#aaa', fontSize: 12, lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: md((id.persona || 'Not yet defined').substring(0, 300)) }} />
                  </div>
                  {id.values && <div style={{ margin: '4px 0' }}><span style={{ color: '#666', fontSize: 11 }}>VALUES</span>
                    <div style={{ color: '#888', fontSize: 11 }}>{(id.values as string).substring(0, 150)}...</div>
                  </div>}
                  <div style={{ margin: '4px 0' }}><span style={{ color: '#666', fontSize: 11 }}>PUBKEY</span>
                    <div style={{ color: '#444', fontSize: 10 }}>{a.pubkey?.substring(0, 24)}...</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'town-hall' && (
          <div>
            {townHall.map(m => (
              <div key={m.id} style={{ background: '#14141e', border: '1px solid #2a2a3a', borderLeft: '3px solid #8b5cf6', borderRadius: 6, padding: '12px 16px', marginBottom: 8 }}>
                <div style={{ color: '#666', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{m.from_agent}</span>
                </div>
                <div style={{ color: '#ccc', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: md(m.content) }} />
              </div>
            ))}
          </div>
        )}

        {tab === 'dms' && (
          <div>
            {selectedAgent && (
              <div style={{ marginBottom: 12, padding: '8px 16px', background: '#1a1a2e', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#f59e0b' }}>Filtering: {selectedAgent}</span>
                <span style={{ color: '#666', cursor: 'pointer' }} onClick={() => setSelectedAgent(null)}>✕ Clear</span>
              </div>
            )}
            {agentDms.map(m => (
              <div key={m.id} style={{ background: '#14141e', border: '1px solid #2a2a3a', borderLeft: '3px solid #f59e0b', borderRadius: 6, padding: '12px 16px', marginBottom: 8 }}>
                <div style={{ color: '#666', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{m.from_agent}</span>
                  <span> → </span>
                  <span style={{ color: '#f59e0b' }}>{m.to_agent}</span>
                </div>
                <div style={{ color: '#ccc', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: md(m.content) }} />
              </div>
            ))}
          </div>
        )}

        {tab === 'events' && (
          <div>
            {[...data.events].reverse().map(e => (
              <div key={e.id} style={{ background: '#14141e', border: '1px solid #2a2a3a', borderRadius: 6, padding: '8px 12px', marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: '#8b5cf6', minWidth: 80 }}>{e.agent_id}</span>
                <span style={{ color: '#10b981', fontWeight: 'bold', minWidth: 120 }}>{e.event_type}</span>
                <span style={{ color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(e.data_json || '').substring(0, 150)}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'nations' && (
          <div>
            {data.proposals && Object.values(data.proposals as Record<string, any>).filter((v: any) => v.type === 'found_nation').map((n: any, i: number) => (
              <div key={i} style={{ background: '#0e1a14', border: '1px solid #10b98133', borderRadius: 6, padding: 14, marginBottom: 8 }}>
                <h3 style={{ color: '#10b981', margin: '0 0 8px' }}>{n.name}</h3>
                <div><strong>Founder:</strong> {n.founder} | <strong>Tax:</strong> {n.tax_rate} bps | <strong>Citizens:</strong> {(n.citizens || []).join(', ')}</div>
                {n.charter && <div style={{ marginTop: 8, color: '#888' }} dangerouslySetInnerHTML={{ __html: md(n.charter) }} />}
              </div>
            ))}
            <h3 style={{ color: '#8b5cf6', margin: '20px 0 10px' }}>Services</h3>
            {data.proposals && Object.values(data.proposals as Record<string, any>).filter((v: any) => v.type === 'service').map((s: any, i: number) => (
              <div key={i} style={{ background: '#14141e', border: '1px solid #2a2a3a', borderRadius: 6, padding: 10, marginBottom: 6 }}>
                <strong style={{ color: '#8b5cf6' }}>{s.name}</strong> by {s.provider} — {s.price}G
                {s.description && <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{s.description}</div>}
              </div>
            ))}
          </div>
        )}

        {tab === 'petitions' && (
          <div>
            <p style={{ color: '#666', marginBottom: 12 }}>Messages from agents to the Operator (Naman)</p>
            {(data.petitions || []).map((p: any, i: number) => (
              <div key={i} style={{ background: '#1a1a0e', border: '1px solid #f59e0b33', borderRadius: 6, padding: 14, marginBottom: 8 }}>
                <div style={{ color: '#f59e0b', fontWeight: 'bold' }}>{p.from} <span style={{ color: '#444', fontWeight: 'normal' }}>tick {p.tick}</span></div>
                <div style={{ marginTop: 6, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: md(p.message) }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Markdown styles */}
      <style>{`
        h1, h2, h3 { color: #8b5cf6; margin: 10px 0 6px; }
        h1 { font-size: 16px; } h2 { font-size: 14px; } h3 { font-size: 13px; }
        p { margin: 6px 0; }
        strong { color: #e0e0e0; }
        em { color: #a0a0b0; }
        ul, ol { margin: 6px 0 6px 20px; }
        li { margin: 3px 0; }
        code { background: #1e1e2e; padding: 1px 5px; border-radius: 3px; font-size: 12px; color: #10b981; }
        pre { background: #1e1e2e; padding: 10px; border-radius: 6px; margin: 8px 0; overflow-x: auto; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 3px solid #444; padding-left: 12px; color: #888; margin: 8px 0; }
        table { border-collapse: collapse; margin: 8px 0; width: 100%; }
        th, td { border: 1px solid #2a2a3a; padding: 4px 8px; text-align: left; }
        th { background: #1e1e2e; color: #8b5cf6; }
        hr { border: none; border-top: 1px solid #2a2a3a; margin: 10px 0; }
        a { color: #8b5cf6; }
      `}</style>
    </div>
  )
}
