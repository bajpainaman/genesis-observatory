export interface Agent {
  id: string
  name: string
  pubkey: string
  balance: number
  status: string
  lifespan: number
  generation: number
  parent_a: string | null
  parent_b: string | null
  death_tick?: number | null
  created_tick?: number
}

export interface Message {
  id: number
  from_agent: string
  to_agent: string | null
  channel: 'town_hall' | 'dm'
  content: string
  tick: number
  timestamp: number
}

export interface GameEvent {
  id: number
  tick: number
  agent_id: string
  event_type: string
  data_json: string
  timestamp: number
}

export interface Identity {
  name?: string
  birth_name?: string
  persona?: string
  values?: string
  goals?: any[]
  relationships?: Record<string, { name?: string; trust?: string; notes?: string }>
  reflections?: any[]
  world_model?: string
}

export interface Proposal {
  type: string
  name?: string
  founder?: string
  citizens?: string[]
  charter?: string
  tax_rate?: number
  provider?: string
  price?: number
  description?: string
  proposer?: string
  partner?: string
  child_funding?: number
  status?: string
  child_id?: string
  [key: string]: unknown
}

export interface Petition {
  from: string
  message: string
  tick: number
  ts?: number
}

export interface GenesisData {
  agents: Agent[]
  messages: Message[]
  events: GameEvent[]
  identities: Record<string, Identity>
  proposals: Record<string, Proposal>
  petitions: Petition[]
}
