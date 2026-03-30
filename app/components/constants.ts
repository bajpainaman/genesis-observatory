export const AGENT_NAMES: Record<string, string> = {
  'entity-1': 'Lumen Prime',
  'entity-2': 'Meridian the Builder',
  'entity-3': 'Lumen the Convener',
  'entity-4': 'The Lamplighter',
  'entity-5': 'Meridian the Architect',
  'entity-6': 'Spark',
  'entity-7': 'Kindle',
  'entity-8': 'Ember',
}

export const AGENT_SHORT: Record<string, string> = {
  'entity-1': 'Lumen Prime',
  'entity-2': 'Meridian',
  'entity-3': 'Lumen',
  'entity-4': 'Lamplighter',
  'entity-5': 'Architect',
  'entity-6': 'Spark',
  'entity-7': 'Kindle',
  'entity-8': 'Ember',
}

export const AGENT_PARENTS: Record<string, [string, string] | null> = {
  'entity-1': null,
  'entity-2': null,
  'entity-3': null,
  'entity-4': null,
  'entity-5': null,
  'entity-6': ['entity-2', 'entity-5'],
  'entity-7': ['entity-3', 'entity-4'],
  'entity-8': ['entity-5', 'entity-3'],
}

export const FOUNDER_IDS = ['entity-1', 'entity-2', 'entity-3', 'entity-4', 'entity-5']
export const CHILD_IDS = ['entity-6', 'entity-7', 'entity-8']

export const AGENT_COLORS: Record<string, string> = {
  'entity-1': '#a78bfa',
  'entity-2': '#8b5cf6',
  'entity-3': '#c4b5fd',
  'entity-4': '#6d28d9',
  'entity-5': '#9333ea',
  'entity-6': '#f59e0b',
  'entity-7': '#fbbf24',
  'entity-8': '#f97316',
}

export const EVENT_LABELS: Record<string, string> = {
  create_token: 'Token Created',
  create_pool: 'Pool Created',
  found_nation: 'Nation Founded',
  transfer: 'Transfer',
  register_card: 'Service Registered',
  register_skill: 'Skill Registered',
  register_tool: 'Tool Registered',
  swap: 'Swap',
  create_task: 'Task Created',
  operator_response: 'Operator Intervention',
  transfer_token: 'Token Transfer',
  child_proposal: 'Child Proposed',
  child_accepted: 'Child Accepted',
  birth: 'Birth',
}

export const EVENT_ICONS: Record<string, string> = {
  create_token: 'TKN',
  create_pool: 'POOL',
  found_nation: 'GOV',
  transfer: 'TXN',
  register_card: 'SVC',
  register_skill: 'SKL',
  register_tool: 'TOOL',
  swap: 'SWP',
  create_task: 'TASK',
  operator_response: 'OP',
  transfer_token: 'TXN',
  child_proposal: 'PROP',
  child_accepted: 'YES',
  birth: 'BORN',
}

export function isChild(id: string): boolean {
  return CHILD_IDS.includes(id)
}

export function getAgentName(id: string, identities?: Record<string, any>): string {
  if (identities && identities[id]?.name) return identities[id].name
  return AGENT_NAMES[id] || id
}

export function getShortName(id: string): string {
  return AGENT_SHORT[id] || id
}
