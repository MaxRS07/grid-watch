export interface SeriesState {
    valid: boolean
    updatedAt: string
    format: string
    started: boolean
    finished: boolean
    teams: Team[]
    games: Game[]
}

export interface Team {
    id: string
    name: string
    won: boolean
}

export interface Game {
    sequenceNumber: number
    teams: GameTeam[]
}

export interface GameTeam {
    id: string
    name: string
    players: Player[]
}

export interface Player {
    id: string
    name: string
    kills: number
    deaths: number
    netWorth: number
    money: number
    abilities: Ability[]
    teamkills: number
    selfkills: number
    unitKills: any[]
    multikills: any[]
    weaponKills: WeaponKill[]
    loadoutValue: number
    weaponTeamkills: any[]
    killAssistsGiven: number
    teamkillAssistsReceived: number
    killAssistsReceivedFromPlayer: KillAssistsReceivedFromPlayer[]
    teamkillAssistsReceivedFromPlayer: any[]
    inventory: Inventory
    character: Character
    position: Position
}

export interface Ability {
    id: string
    name: string
    ready: boolean
}

export interface WeaponKill {
    id: string
    count: number
    weaponName: string
}

export interface KillAssistsReceivedFromPlayer {
    id: string
    playerId: string
    killAssistsReceived: number
}

export interface Inventory {
    items: Item[]
}

export interface Item {
    id: string
    name: string
    stashed: number
    quantity: number
    equipped: number
}

export interface Character {
    id: string
    name: string
}

export interface Position {
    x: number
    y: number
}
