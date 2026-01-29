export interface EventActor {
    type: string
    id: string
    stateDelta: StateDelta
    state: State
}

export interface StateDelta {
    id: string
    series: Series
    game: Game
}

export interface Series {
    id: string
    kills: number
    killAssistsReceived: number
    killAssistsReceivedFromPlayer: KillAssistsReceivedFromPlayer[]
    weaponKills: WeaponKills
}

export interface KillAssistsReceivedFromPlayer {
    id: string
    playerId: string
    killAssistsReceived: number
}

export interface WeaponKills { }

export interface Game {
    id: string
    kills: number
    killAssistsReceived: number
    killAssistsReceivedFromPlayer: KillAssistsReceivedFromPlayer[]
    weaponKills: WeaponKills
}

export interface State {
    id: string
    name: string
    teamId: string
    side: string
    series: Series
    game: Game
}


export interface Position {
    x: number
    y: number
}
