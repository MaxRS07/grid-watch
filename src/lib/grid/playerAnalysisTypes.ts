export interface PlayerSnapshot {
    playerId: string;
    playerName: string;
    teamId: string;
    side: 'attacker' | 'defender' | null;
    money: number;
    loadoutValue: number;
    netWorth: number;
    position: Position | null;
    alive: boolean;
    currentHealth: number;
    currentArmor: number;
}

export interface TeamStatePlayer {
    id: string;
    name: string;
    money: number;
    loadoutValue: number;
    netWorth: number;
    position: Position | null;
}

export interface GameMap {
    id: string;
    name: string;
    bounds: {
        min: Position;
        max: Position;
    };
}

export interface RoundSnapshot {
    kills: number;
    deaths: number;
    weaponKills: Record<string, number>;
    firstKill: boolean;
}

export interface GameSnapshot extends RoundSnapshot {
    // Game-level snapshot includes round stats plus game aggregations
}

export interface SeriesSnapshot extends RoundSnapshot {
    // Series-level snapshot includes round stats plus series aggregations
}

export interface PlayerCombatEvent {
    timestamp: number;
    eventType: string;
    action: string;
    actor: PlayerSnapshot & {
        roundStats: RoundSnapshot;
        gameStats: GameSnapshot;
        seriesStats: SeriesSnapshot;
    };
    target: PlayerSnapshot & {
        roundStats: RoundSnapshot;
        gameStats: GameSnapshot;
        seriesStats: SeriesSnapshot;
    } | null;
}

export interface PlayerValorantAnalysis {
    playerId: string;
    timeWindow: {
        start: number;
        end: number;
    };

    volume: VolumeStats;
    combat: CombatStats;
    economy: EconomyStats;
    positioning: PositioningStats;
    clutch: ClutchStats;
    consistency: ConsistencyStats;
    teamImpact: TeamImpactStats;
    context: ContextStats;
}

export interface VolumeStats {
    seriesPlayed: number;
    mapsPlayed: number;
    roundsPlayed: number;

    roundsPerMap: number;
    eventsPerRound: number;
}
export interface NamedStat {
    name: string,
    value: number,
}
export interface CombatStats {
    weaponKills: Record<string, number>; // weapon name -> kills
    weaponDamage: Record<string, number>; // weapon name -> damage
    deaths: number;
    assists: number;

    kdr: number;
    adr: number;          // average damage per round
    acs: number;

    firstKills: number;
    firstDeaths: number;
    entrySuccessRate: number;

    headshotPercentage: number;
    multiKillRounds: {
        twoK: number;
        threeK: number;
        fourPlus: number;
    };
}

export interface PositioningStats {
    ts: number;
    position?: Position;
    avgVelocity: Position;

    avgDistanceToTeammates: number;
    // soloEngagementRate: number;

    attackerSideAggression: number;
    defenderSideHold: number;

    // siteEntryRate: number;
    // rotationSpeed: number;
}

export enum EnvironmentEvents {
    GridStartedFeed = "grid-started-feed",
    GridSampledFeed = "grid-sampled-feed",
    GridSampledTournament = "grid-sampled-tournament",
    GridSampledSeries = "grid-sampled-series",
    GridInvalidatedSeries = "grid-invalidated-series",
    GridValidatedSeries = "grid-validated-series",
    GridEndedFeed = "grid-ended-feed",
    PlayerLeftSeries = "player-left-series",
    PlayerRejoinedSeries = "player-rejoined-series",
    TournamentStartedSeries = "tournament-started-series",
    SeriesStartedGame = "series-started-game",
    GameSetGameClock = "game-set-gameClock",
    GameStartedGameClock = "game-started-gameClock",
    GameStoppedGameClock = "game-stopped-gameClock",
    TeamWonGame = "team-won-game",
    SeriesEndedGame = "series-ended-game",
    TeamWonSeries = "team-won-series",
    TournamentEndedSeries = "tournament-ended-series",
    GameStartedRound = "game-started-round",
    GameEndedRound = "game-ended-round",
    TeamWonRound = "team-won-round",
    RoundStartedFreezetime = "round-started-freezetime",
    RoundEndedFreezetime = "round-ended-freezetime",
    FreezetimeStartedTimeout = "freezetime-started-timeout",
    FreezetimeEndedTimeout = "freezetime-ended-timeout"
};

export enum CombatEvents {
    GameKilledPlayer = "game-killed-player",
    PlayerKilledPlayer = "player-killed-player",
    PlayerSelfKilledPlayer = "player-selfkilled-player",
    PlayerTeamKilledPlayer = "player-teamkilled-player",
    PlayerDamagedPlayer = "player-damaged-player",
    PlayerTeamDamagedPlayer = "player-teamdamaged-player",
    PlayerSelfDamagedPlayer = "player-selfdamaged-player"
};

export enum SupportEvents {
    PlayerRevivedPlayer = "player-revived-player",
    PlayerSelfRevivedPlayer = "player-selfrevived-player",
    PlayerCompletedPlantBomb = "player-completed-plantBomb",
    TeamCompletedPlantBomb = "team-completed-plantBomb",
    TeamCompletedDefuseBomb = "team-completed-defuseBomb",
    PlayerCompletedDefuseBomb = "player-completed-defuseBomb",
    PlayerCompletedBeginDefuseBomb = "player-completed-beginDefuseBomb",
    PlayerCompletedReachDefuseBombCheckpoint = "player-completed-reachDefuseBombCheckpoint",
    PlayerCompletedStopDefuseBomb = "player-completed-stopDefuseBomb",
    PlayerCompletedExplodeBomb = "player-completed-explodeBomb",
    TeamCompletedExplodeBomb = "team-completed-explodeBomb",
    PlayerPickedUpItem = "player-pickedUp-item",
    PlayerDroppedItem = "player-dropped-item",
    PlayerUsedAbility = "player-used-ability"
};

export interface RoundStartData {
    ts: number;
    attacker: string;
    defender: string;
    players: Record<string, RoundStartPlayer[]>;
    map: GameMap;
}
export interface RoundStartPlayer {
    id: string
    name: string
    character: Character
    roles: any[]
    money: number
    loadoutValue: number
    netWorth: number
    inventory: Inventory
    abilities: Ability[]
    position: Position
}

export interface Character {
    name: string
    id: string
}

export interface Inventory {
    items: Item[]
}

export interface Item {
    id: string
    statePath: StatePath[]
    name: string
    quantity: number
    equipped: number
    stashed: number
}

export interface StatePath {
    id: string
}

export interface Ability {
    id: string
    statePath: StatePath2[]
    name: string
    charges: number
    ready: boolean
}

export interface StatePath2 {
    id: string
}

export class Position {
    constructor(public x: number = 0, public y: number = 0) { }

    add(other: Position): Position {
        return new Position(this.x + other.x, this.y + other.y);
    }

    subtract(other: Position): Position {
        return new Position(this.x - other.x, this.y - other.y);
    }

    divide(scalar: number): Position {
        return new Position(this.x / scalar, this.y / scalar);
    }

    multiply(scalar: number): Position {
        return new Position(this.x * scalar, this.y * scalar);
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Position {
        const len = this.length();
        return len === 0 ? new Position(0, 0) : this.divide(len);
    }

    clone(): Position {
        return new Position(this.x, this.y);
    }

    static zero(): Position {
        return new Position(0, 0);
    }
}
