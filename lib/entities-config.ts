// Static configuration for NPCs, enemies, collectible orbs, and quests.
// Kept dependency-free (plain data) so both the 3D layer and the HUD can import
// it. Positions are [x, z] in world space; ground height is derived at runtime
// from terrainHeight so entities sit on the terrain.

export type QuestId = "orbs" | "hunt"

export interface QuestDef {
  id: QuestId
  title: string
  desc: string
  target: number
  giver: string // npc id
  reward: { xp: number; coins: number }
}

export const QUESTS: QuestDef[] = [
  {
    id: "orbs",
    title: "Lights in the Woods",
    desc: "Collect 3 glowing orbs scattered in the forest.",
    target: 3,
    giver: "elder",
    reward: { xp: 90, coins: 30 },
  },
  {
    id: "hunt",
    title: "Cull the Wilds",
    desc: "Defeat 2 monsters roaming the forest & mountains.",
    target: 2,
    giver: "mayor",
    reward: { xp: 130, coins: 55 },
  },
]

export interface NpcDialogue {
  intro: string[] // no quest, or quest not yet started
  active?: string[] // quest in progress
  ready?: string[] // quest objectives met, ready to turn in
  done?: string[] // reward already given
}

export interface NpcDef {
  id: string
  name: string
  zone: "city" | "village"
  pos: [number, number]
  bodyColor: string
  accentColor: string
  hairColor: string
  questId?: QuestId
  dialogue: NpcDialogue
}

export const NPCS: NpcDef[] = [
  // --- City ---
  {
    id: "mayor",
    name: "Mayor Rin",
    zone: "city",
    pos: [-80, -84],
    bodyColor: "#6d5ae0",
    accentColor: "#c4b5fd",
    hairColor: "#2b2440",
    questId: "hunt",
    dialogue: {
      intro: [
        "Welcome to Lumina City, traveler.",
        "Monsters have crept out of the forest and threaten our roads.",
        "Would you thin their numbers? Defeat 2 of them for me.",
      ],
      active: ["The beasts still prowl the forest.", "Return once you've felled two of them."],
      ready: ["You did it! The roads are safer already.", "Take this reward, hero. You've earned it."],
      done: ["The city is in your debt.", "Stay sharp out there."],
    },
  },
  {
    id: "kenji",
    name: "Kenji",
    zone: "city",
    pos: [-73, -77],
    bodyColor: "#e0723a",
    accentColor: "#fcd34d",
    hairColor: "#3a2a1a",
    dialogue: {
      intro: [
        "Oh, a new face! Don't mind me, just watching the clouds.",
        "They say the forest orbs glow brightest at dusk.",
        "If you find one, they're beautiful up close.",
      ],
    },
  },
  // --- Village ---
  {
    id: "elder",
    name: "Elder Hana",
    zone: "village",
    pos: [86, -80],
    bodyColor: "#2e8b74",
    accentColor: "#a7f3d0",
    hairColor: "#d1d5db",
    questId: "orbs",
    dialogue: {
      intro: [
        "Peace be with you, child of the road.",
        "The forest spirits left 3 glowing orbs among the trees.",
        "Gather them and bring their light back to us.",
      ],
      active: ["The orbs drift softly in the forest.", "Follow their glow — three in all."],
      ready: ["You found them all! Their warmth returns to the village.", "Please, accept our thanks."],
      done: ["The orbs shine in our shrine now.", "You have a kind heart."],
    },
  },
  {
    id: "taro",
    name: "Taro",
    zone: "village",
    pos: [77, -73],
    bodyColor: "#c2410c",
    accentColor: "#fda4af",
    hairColor: "#1f2937",
    dialogue: {
      intro: [
        "Careful past the tree line — wolves and worse out there.",
        "A strong swing keeps them at bay. Click or tap to attack.",
      ],
    },
  },
  {
    id: "yui",
    name: "Yui",
    zone: "village",
    pos: [85, -71],
    bodyColor: "#db2777",
    accentColor: "#fbcfe8",
    hairColor: "#4c1d95",
    dialogue: {
      intro: [
        "Hehe, you look strong! Are you an adventurer?",
        "Beat some monsters and you'll grow even stronger.",
        "Every level makes your heart and breath fuller!",
      ],
    },
  },
]

export type EnemyType = "slime" | "wolf" | "goblin" | "brute"

export interface EnemyStats {
  maxHealth: number
  speed: number
  damage: number
  detectRadius: number
  attackRange: number
  attackCooldown: number
  xp: number
  coins: number
  color: string
  accent: string
  scale: number
}

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  slime: {
    maxHealth: 32,
    speed: 2.3,
    damage: 6,
    detectRadius: 10,
    attackRange: 1.7,
    attackCooldown: 1.3,
    xp: 18,
    coins: 3,
    color: "#4ade80",
    accent: "#bbf7d0",
    scale: 1,
  },
  wolf: {
    maxHealth: 46,
    speed: 4.6,
    damage: 10,
    detectRadius: 16,
    attackRange: 1.9,
    attackCooldown: 1.1,
    xp: 26,
    coins: 6,
    color: "#94a3b8",
    accent: "#e2e8f0",
    scale: 1,
  },
  goblin: {
    maxHealth: 62,
    speed: 3.3,
    damage: 12,
    detectRadius: 13,
    attackRange: 1.9,
    attackCooldown: 1.2,
    xp: 32,
    coins: 9,
    color: "#65a30d",
    accent: "#d9f99d",
    scale: 1,
  },
  brute: {
    maxHealth: 120,
    speed: 2.4,
    damage: 20,
    detectRadius: 12,
    attackRange: 2.3,
    attackCooldown: 1.6,
    xp: 65,
    coins: 22,
    color: "#b91c1c",
    accent: "#fecaca",
    scale: 1.6,
  },
}

export interface EnemySpawn {
  id: string
  type: EnemyType
  pos: [number, number] // patrol center
  patrolRadius: number
}

export const ENEMY_SPAWNS: EnemySpawn[] = [
  { id: "e1", type: "slime", pos: [-15, 58], patrolRadius: 8 },
  { id: "e2", type: "wolf", pos: [18, 68], patrolRadius: 12 },
  { id: "e3", type: "goblin", pos: [-10, 88], patrolRadius: 9 },
  { id: "e4", type: "slime", pos: [30, 92], patrolRadius: 8 },
  { id: "e5", type: "wolf", pos: [-30, 86], patrolRadius: 12 },
  { id: "e6", type: "brute", pos: [6, 108], patrolRadius: 7 },
]

// Quest collectible orbs in the forest.
export const ORBS: [number, number][] = [
  [-28, 72],
  [26, 78],
  [2, 100],
]
