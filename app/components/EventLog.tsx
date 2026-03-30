'use client';

import { useState, useMemo } from 'react';
import { GenesisData } from './types';
import { AGENT_NAMES, AGENT_COLORS, EVENT_LABELS } from './constants';

interface EventLogProps {
  data: GenesisData;
}

const EVENT_COLORS: Record<string, string> = {
  create_token: '#10b981',
  create_pool: '#06b6d4',
  found_nation: '#8b5cf6',
  transfer: '#6b7280',
  register_card: '#84cc16',
  register_skill: '#a3e635',
  register_tool: '#78716c',
  swap: '#f59e0b',
  create_task: '#f97316',
  operator_response: '#ef4444',
  transfer_token: '#6b7280',
  child_proposal: '#f59e0b',
  child_accepted: '#10b981',
  birth: '#fbbf24',
};

export default function EventLog({ data }: EventLogProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');

  const events = data.events;
  const eventTypes = useMemo(() => {
    const seen = new Set<string>();
    events.forEach(e => seen.add(e.event_type));
    return Array.from(seen);
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filterType !== 'all' && e.event_type !== filterType) return false;
      if (filterAgent !== 'all' && e.agent_id !== filterAgent) return false;
      return true;
    });
  }, [events, filterType, filterAgent]);

  const getName = (id: string) => {
    const identity = data.identities[id];
    return identity?.name || AGENT_NAMES[id] || id;
  };

  const getEventSummary = (event: typeof events[0]) => {
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(event.data_json); } catch {}

    switch (event.event_type) {
      case 'transfer':
        return `→ ${getName(String(parsed.to || ''))}  ${Number(parsed.amount || 0).toLocaleString()} G`;
      case 'transfer_token':
        return `→ ${getName(String(parsed.receiver || parsed.to || ''))}`;
      case 'found_nation':
        return 'The Commons established';
      case 'birth':
        return `${getName(event.agent_id)} born`;
      case 'child_proposal':
        return `with ${getName(String(parsed.partner || ''))}`;
      case 'child_accepted':
        return `Proposal accepted`;
      case 'register_card': {
        const desc = parsed.description;
        return typeof desc === 'string' ? desc.slice(0, 60) + (desc.length > 60 ? '…' : '') : '';
      }
      case 'create_pool':
        return `Pool: ${parsed.token_a || '?'} / ${parsed.token_b || '?'}`;
      case 'swap':
        return `${parsed.direction || ''} ${Number(parsed.amount_in || 0).toLocaleString()}`;
      default:
        return '';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, color: '#10b981', fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Event Log
        </h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
          {events.length} on-chain events — every action recorded on the blockchain.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, color: '#e2d9f3', padding: '5px 10px', fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All types ({events.length})</option>
          {eventTypes.map(t => (
            <option key={t} value={t} style={{ background: '#0a0a0f' }}>
              {EVENT_LABELS[t] || t} ({events.filter(e => e.event_type === t).length})
            </option>
          ))}
        </select>

        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, color: '#e2d9f3', padding: '5px 10px', fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="all">All agents</option>
          {data.agents.map(a => (
            <option key={a.id} value={a.id} style={{ background: '#0a0a0f' }}>
              {getName(a.id)} ({events.filter(e => e.agent_id === a.id).length})
            </option>
          ))}
        </select>

        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
          {filtered.length} shown
        </span>
      </div>

      {/* Event type summary pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(
          events.reduce((acc, e) => {
            acc[e.event_type] = (acc[e.event_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <div
              key={type}
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
              style={{
                padding: '2px 8px', fontSize: 10, borderRadius: 3,
                background: `${EVENT_COLORS[type] || '#6b7280'}15`,
                border: `1px solid ${filterType === type ? (EVENT_COLORS[type] || '#6b7280') : (EVENT_COLORS[type] || '#6b7280') + '40'}`,
                color: EVENT_COLORS[type] || '#6b7280',
                cursor: 'pointer',
              }}
            >
              {EVENT_LABELS[type] || type} · {count}
            </div>
          ))}
      </div>

      {/* Event list */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        overflow: 'hidden',
        maxHeight: 500,
        overflowY: 'auto',
      }}>
        {filtered.map((event, i) => {
          const agentColor = AGENT_COLORS[event.agent_id] || '#6b7280';
          const eventColor = EVENT_COLORS[event.event_type] || '#6b7280';
          const summary = getEventSummary(event);
          const agentName = getName(event.agent_id);

          return (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '9px 14px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}
            >
              {/* Event type badge */}
              <div style={{
                flexShrink: 0,
                padding: '2px 6px',
                background: `${eventColor}15`,
                border: `1px solid ${eventColor}30`,
                borderRadius: 3,
                fontSize: 9,
                color: eventColor,
                fontWeight: 700,
                letterSpacing: '0.05em',
                width: 70,
                textAlign: 'center' as const,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
              }}>
                {(EVENT_LABELS[event.event_type] || event.event_type).toUpperCase().slice(0, 8)}
              </div>

              {/* Agent name */}
              <div style={{ flexShrink: 0, width: 90, fontSize: 11, color: agentColor, fontWeight: 600, paddingTop: 2 }}>
                {agentName.length > 12 ? agentName.slice(0, 11) + '…' : agentName}
              </div>

              {/* Summary */}
              <div style={{ flex: 1, fontSize: 11, color: '#9ca3af', paddingTop: 2 }}>
                {summary}
              </div>

              {/* Tick */}
              <div style={{ flexShrink: 0, fontSize: 10, color: '#374151', paddingTop: 3 }}>
                t{event.tick}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
