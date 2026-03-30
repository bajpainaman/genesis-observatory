'use client';

import { GenesisData, Agent, Identity } from './types';
import { AGENT_NAMES, AGENT_COLORS, AGENT_PARENTS, CHILD_IDS, FOUNDER_IDS } from './constants';

interface AgentCardProps {
  agentId: string;
  data: GenesisData;
  onClose: () => void;
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ color: color || '#e2d9f3', fontSize: 12, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

export default function AgentCard({ agentId, data, onClose }: AgentCardProps) {
  const agent = data.agents.find(a => a.id === agentId);
  if (!agent) return null;

  const identity = data.identities[agentId];
  const color = AGENT_COLORS[agentId];
  const isChild = CHILD_IDS.includes(agentId);
  const parents = AGENT_PARENTS[agentId];

  const msgCount = data.messages.filter(m => m.from_agent === agentId).length;
  const dmCount = data.messages.filter(m => m.channel === 'dm' && (m.from_agent === agentId || m.to_agent === agentId)).length;
  const eventCount = data.events.filter(e => e.agent_id === agentId).length;

  const displayName = identity?.name || AGENT_NAMES[agentId] || agentId;

  return (
    <div style={{
      background: 'rgba(10,10,15,0.98)',
      border: `1px solid ${color}40`,
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: `0 0 40px ${color}20`,
      width: '100%',
      maxWidth: 420,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${color}15 0%, transparent 60%)`,
        borderBottom: `1px solid ${color}30`,
        padding: '20px 20px 16px',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, color: '#9ca3af', fontSize: 12, cursor: 'pointer',
            padding: '2px 8px', fontFamily: 'inherit',
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `2px solid ${color}`,
            background: isChild ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color,
          }}>
            {isChild ? '◎' : '◉'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2d9f3' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              {agentId} · Gen {isChild ? 2 : 1} · {agent.status}
            </div>
          </div>
        </div>

        {isChild && parents && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: '#f59e0b',
          }}>
            Parents: {parents.map(p => data.identities[p]?.name || AGENT_NAMES[p]).join(' + ')}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px', maxHeight: 480, overflowY: 'auto' }}>
        {/* Stats */}
        <StatRow label="Balance" value={`${agent.balance.toLocaleString()} G`} color="#10b981" />
        <StatRow label="Lifespan" value={`${agent.lifespan.toLocaleString()} ticks`} />
        <StatRow label="Messages sent" value={msgCount} />
        <StatRow label="DM interactions" value={dmCount} />
        <StatRow label="On-chain events" value={eventCount} />

        {/* Persona */}
        {identity?.persona && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Persona</div>
            <div style={{
              fontSize: 12, color: '#d1d5db', lineHeight: 1.6,
              background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '10px 12px',
              borderLeft: `2px solid ${color}50`,
            }}>
              {identity.persona}
            </div>
          </div>
        )}

        {/* Values */}
        {identity?.values && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Values</div>
            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {identity.values}
            </div>
          </div>
        )}

        {/* First Reflection */}
        {identity?.reflections && identity.reflections.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              First Thought (tick {identity.reflections[0]?.tick ?? '?'})
            </div>
            <div style={{
              fontSize: 11, color: '#9ca3af', lineHeight: 1.6,
              background: 'rgba(255,255,255,0.02)', borderRadius: 6, padding: '10px 12px',
              fontStyle: 'italic',
              borderLeft: `2px solid ${color}30`,
            }}>
              "{identity.reflections[0]?.thought?.slice(0, 280)}
              {identity.reflections[0]?.thought && identity.reflections[0].thought.length > 280 ? '…' : ''}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
