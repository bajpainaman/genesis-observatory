'use client';

import { useState, useMemo } from 'react';
import { GenesisData, Agent } from './types';
import { AGENT_NAMES, AGENT_SHORT, AGENT_COLORS, AGENT_PARENTS, FOUNDER_IDS, CHILD_IDS } from './constants';

interface AgentNetworkProps {
  data: GenesisData;
  selectedAgent: string | null;
  onSelectAgent: (id: string | null) => void;
}

export default function AgentNetwork({ data, selectedAgent, onSelectAgent }: AgentNetworkProps) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // Calculate DM counts between pairs
  const dmCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.messages.filter(m => m.channel === 'dm').forEach(m => {
      if (m.to_agent) {
        const key = [m.from_agent, m.to_agent].sort().join(':');
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [data.messages]);

  const maxDMs = Math.max(...Object.values(dmCounts));

  // Layout: founders in a pentagon, children in outer arc
  const W = 520;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2 - 10;

  // Founder positions (pentagon)
  const founderR = 140;
  const founderPos: Record<string, { x: number; y: number }> = {};
  FOUNDER_IDS.forEach((id, i) => {
    const angle = (i * 2 * Math.PI) / FOUNDER_IDS.length - Math.PI / 2;
    founderPos[id] = {
      x: cx + founderR * Math.cos(angle),
      y: cy + founderR * Math.sin(angle),
    };
  });

  // Children positioned near their parents
  const childPositions: Record<string, { x: number; y: number }> = {};
  // entity-6: parents entity-2, entity-5
  const p6a = founderPos['entity-2'];
  const p6b = founderPos['entity-5'];
  childPositions['entity-6'] = {
    x: (p6a.x + p6b.x) / 2 + 70,
    y: (p6a.y + p6b.y) / 2 + 60,
  };
  // entity-7: parents entity-3, entity-4
  const p7a = founderPos['entity-3'];
  const p7b = founderPos['entity-4'];
  childPositions['entity-7'] = {
    x: (p7a.x + p7b.x) / 2 - 70,
    y: (p7a.y + p7b.y) / 2 + 55,
  };
  // entity-8: parents entity-5, entity-3
  const p8a = founderPos['entity-5'];
  const p8b = founderPos['entity-3'];
  childPositions['entity-8'] = {
    x: (p8a.x + p8b.x) / 2 + 20,
    y: (p8a.y + p8b.y) / 2 - 90,
  };

  const allPositions = { ...founderPos, ...childPositions };

  // Get all DM edges (pairs with at least 1 message)
  const edges = Object.entries(dmCounts).map(([key, count]) => {
    const [a, b] = key.split(':');
    return { a, b, count };
  });

  const nodeR = (id: string) => CHILD_IDS.includes(id) ? 16 : 20;

  const isHighlighted = (id: string) => {
    if (!selectedAgent && !hoveredAgent) return true;
    const target = selectedAgent || hoveredAgent;
    if (id === target) return true;
    // Connected agents
    const key1 = [id, target!].sort().join(':');
    return key1 in dmCounts || AGENT_PARENTS[id]?.includes(target!) || AGENT_PARENTS[target!]?.includes(id);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, color: '#8b5cf6', fontWeight: 600, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Agent Network
        </h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
          Click an agent to view their profile. Line thickness = DM frequency.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* SVG Graph */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: 'block', maxWidth: '100%' }}
          >
            {/* Background subtlety */}
            <defs>
              <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(139,92,246,0.08)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              {data.agents.map(a => (
                <radialGradient key={a.id} id={`glow-${a.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={AGENT_COLORS[a.id]} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={AGENT_COLORS[a.id]} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            <rect width={W} height={H} fill="url(#bgGlow)" />

            {/* Parent-child connection lines */}
            {CHILD_IDS.map(childId => {
              const parents = AGENT_PARENTS[childId];
              if (!parents) return null;
              return parents.map(parentId => {
                const cp = allPositions[childId];
                const pp = allPositions[parentId];
                if (!cp || !pp) return null;
                const highlighted = isHighlighted(childId) || isHighlighted(parentId);
                return (
                  <line
                    key={`parent-${childId}-${parentId}`}
                    x1={pp.x} y1={pp.y}
                    x2={cp.x} y2={cp.y}
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="5,4"
                    strokeOpacity={highlighted ? 0.5 : 0.1}
                  />
                );
              });
            })}

            {/* DM edges */}
            {edges.map(({ a, b, count }) => {
              const posA = allPositions[a];
              const posB = allPositions[b];
              if (!posA || !posB) return null;
              const thickness = 0.5 + (count / maxDMs) * 4;
              const active = selectedAgent || hoveredAgent;
              const isActive = !active || a === active || b === active;
              return (
                <line
                  key={`${a}-${b}`}
                  x1={posA.x} y1={posA.y}
                  x2={posB.x} y2={posB.y}
                  stroke="#8b5cf6"
                  strokeWidth={thickness}
                  strokeOpacity={isActive ? Math.max(0.15, count / maxDMs * 0.7) : 0.04}
                  style={{ transition: 'stroke-opacity 0.2s' }}
                />
              );
            })}

            {/* Agent nodes */}
            {data.agents.map(agent => {
              const pos = allPositions[agent.id];
              if (!pos) return null;
              const r = nodeR(agent.id);
              const isChild = CHILD_IDS.includes(agent.id);
              const color = AGENT_COLORS[agent.id];
              const isSelected = selectedAgent === agent.id;
              const isHovered = hoveredAgent === agent.id;
              const highlighted = isHighlighted(agent.id);
              const glowR = r * 3;

              return (
                <g
                  key={agent.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectAgent(selectedAgent === agent.id ? null : agent.id)}
                  onMouseEnter={() => setHoveredAgent(agent.id)}
                  onMouseLeave={() => setHoveredAgent(null)}
                >
                  {/* Glow */}
                  {(isSelected || isHovered) && (
                    <circle r={glowR} fill={`url(#glow-${agent.id})`} />
                  )}

                  {/* Outer ring for selected */}
                  {isSelected && (
                    <circle r={r + 5} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.6} />
                  )}

                  {/* Main circle */}
                  <circle
                    r={r}
                    fill={isChild ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)'}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={highlighted ? 1 : 0.3}
                    style={{ transition: 'all 0.2s' }}
                  />

                  {/* Inner dot */}
                  <circle r={4} fill={color} fillOpacity={highlighted ? 0.9 : 0.3} />

                  {/* Label */}
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fill={color}
                    fontSize={isSelected || isHovered ? 11 : 10}
                    fontWeight={isSelected ? 700 : 500}
                    fillOpacity={highlighted ? 1 : 0.4}
                    style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {AGENT_SHORT[agent.id]}
                  </text>
                  {isChild && (
                    <text
                      y={r + 25}
                      textAnchor="middle"
                      fill="#f59e0b"
                      fontSize={9}
                      fillOpacity={highlighted ? 0.7 : 0.2}
                      style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      gen2
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ fontSize: 11, color: '#6b7280', minWidth: 140 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #8b5cf6', background: 'rgba(139,92,246,0.15)' }} />
              <span>Founder (Gen 1)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #f59e0b', background: 'rgba(245,158,11,0.15)' }} />
              <span>Child (Gen 2)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 2, background: '#8b5cf6', opacity: 0.6 }} />
              <span>DM channel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 1, background: '#f59e0b', borderTop: '1px dashed #f59e0b' }} />
              <span>Parent–child</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
            <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Top Pairs</div>
            {Object.entries(dmCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([key, count]) => {
                const [a, b] = key.split(':');
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
                    <span style={{ color: '#9ca3af', fontSize: 10 }}>
                      {AGENT_SHORT[a]} ↔ {AGENT_SHORT[b]}
                    </span>
                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
