import { Series } from "@/data/allData";
import { FlatEvent } from "./seriesAnalysis";
import { start } from "repl";
import { extractGameSegments } from "./gameSegmentation";
import {
    PlayerValorantAnalysis,
    CombatStats,
    PlayerCombatEvent,
    PlayerSnapshot,
    RoundSnapshot,
    CombatEvents,
    PositioningStats,
    TeamStatePlayer,
    GameMap,
    RoundStartPlayer,
    RoundStartData,
    Position
} from "../grid/playerAnalysisTypes";


export function analysePlayerEvents(playerId: string, seriesData: { series: Series, events: FlatEvent[] }[]): PlayerValorantAnalysis {
    let startTime = 0;
    let endTime = 0;
    seriesData.forEach(({ series, events }) => {
        if (startTime === 0 || events[0].ts < startTime) {
            startTime = events[0].ts;
        }
        if (endTime === 0 || events[events.length - 1].ts > endTime) {
            endTime = events[events.length - 1].ts;
        }
        const segments = extractGameSegments(events)

        for (const segment of segments) {
            let startPosition = new Position(0, 0);
            let roundStartData: RoundStartData | null = null;
            let positionStats: PositioningStats | null = null;
            for (let i = 0; i < segment.rounds.length; i++) {
                if (i === 0) {
                    roundStartData = getRoundStartData(playerId, segment.rounds[i].startData);
                }
                const round = segment.rounds[i];
                const roundStartPos = round.startPos
                for (const event of round.roundEvents) {
                    const combatStats = extractCombatStats(event);
                    const eventPositionStats = extractPositioningStats(playerId, event, roundStartData, positionStats ?? undefined);
                    if (combatStats) {

                    }
                }
            }
        }
    });
    return {};

}

function extractCombatStats(event: FlatEvent): CombatStats | null {
    const combatEvent = extractPlayerCombatEvent(event);
    if (!combatEvent) return null;

    const delta: CombatStats = {
        weaponKills: {},
        weaponDamage: {},
        deaths: 0,
        assists: 0,
        kdr: 0,
        adr: 0,
        acs: 0,
        firstKills: 0,
        firstDeaths: 0,
        entrySuccessRate: 0,
        headshotPercentage: 0,
        multiKillRounds: {
            twoK: 0,
            threeK: 0,
            fourPlus: 0,
        },
    };

    switch (event.type) {
        case CombatEvents.PlayerKilledPlayer:
        case CombatEvents.GameKilledPlayer:
            // Player got a kill
            if (combatEvent.actor && combatEvent.target) {
                const weapon = event.payload?.weapon || 'other';
                const current = delta.weaponKills[weapon] || 0;
                delta.weaponKills[weapon] = current + 1;

                // Track first kills
                if (combatEvent.actor.roundStats.firstKill) {
                    delta.firstKills = (delta.firstKills || 0) + 1;
                }

                // Track headshots if available
                if (event.payload?.isHeadshot) {
                    delta.headshotPercentage = (delta.headshotPercentage || 0) + 1;
                }

                // Track multi-kills in this round
                const roundKills = combatEvent.actor.roundStats.kills;
                if (roundKills === 2) delta.multiKillRounds.twoK++;
                else if (roundKills === 3) delta.multiKillRounds.threeK++;
                else if (roundKills >= 4) delta.multiKillRounds.fourPlus++;
            }
            break;

        case CombatEvents.PlayerDamagedPlayer:
            // Player dealt damage
            if (combatEvent.actor) {
                const weapon = event.payload?.weapon || 'other';
                const damage = event.payload?.damage || 0;
                const current = delta.weaponDamage[weapon] || 0;
                delta.weaponDamage[weapon] = current + damage;
            }
            break;

        case CombatEvents.PlayerTeamDamagedPlayer:
            // Team damage
            if (combatEvent.actor) {
                const weapon = event.payload?.weapon || 'other';
                const damage = event.payload?.damage || 0;
                const current = delta.weaponDamage[weapon] || 0;
                delta.weaponDamage[weapon] = current + damage;
            }
            break;
    }

    return delta;
}

function extractPositioningStats(playerId: string, event: FlatEvent, roundStartData?: RoundStartData, oldStats?: PositioningStats): PositioningStats | null {
    const playersByTeam = getPlayersByTeam(event);
    if (!playersByTeam) return null;
    let avgDistanceToTeammates = 0;
    let velocity: Position = new Position(0, 0);
    let position: Position | null = null;
    let attackerSideAggression = 0;
    let defenderSideHold = 0;
    for (const teamId in playersByTeam) {
        if (playersByTeam[teamId].some(player => player.id === playerId)) {
            const thisPlayer = playersByTeam[teamId].find(player => player.id === playerId);
            if (thisPlayer) {
                position = thisPlayer.position || null;
                const dt = oldStats?.ts ? (event.ts - oldStats.ts) / 1000 : 0;
                velocity = thisPlayer.position && oldStats?.position
                    ? getVelocity(oldStats.position, thisPlayer.position, dt)
                    : new Position(0, 0);

                if (roundStartData && roundStartData.map) {
                    const mapBounds = roundStartData.map.bounds;

                    if (position) {
                        if (getPlayZone(position, roundStartData!) === 'attack') {
                            attackerSideAggression += 1;
                        } else {
                            defenderSideHold += 1;
                        }
                        position = new Position(
                            (position.x - mapBounds.min.x) / (mapBounds.max.x - mapBounds.min.x),
                            (position.y - mapBounds.min.y) / (mapBounds.max.y - mapBounds.min.y)
                        );
                    }
                }
            };
            const teammates = playersByTeam[teamId].filter(player => player.id !== playerId);
            const actor = event.payload?.actor;
            if (actor && actor.state && actor.state.game && actor.state.game.position) {
                const actorPos = actor.state.game.position;
                let totalDistance = 0;
                let count = 0;

                for (const mate of teammates) {
                    const matePos = mate.position;
                    if (!matePos) continue;
                    const dist = Math.sqrt(
                        Math.pow(actorPos.x - matePos.x, 2) +
                        Math.pow(actorPos.y - matePos.y, 2)
                    );
                    totalDistance += dist;
                    count++;
                }

                avgDistanceToTeammates = count > 0 ? totalDistance / count : 0;
                return null;
            }
        }
    }
    let positioningStats: PositioningStats = {
        ts: event.ts,
        position: position ?? undefined,
        avgVelocity: oldStats?.avgVelocity?.add(velocity) ?? velocity,
        avgDistanceToTeammates: (oldStats?.avgDistanceToTeammates ?? 0) + avgDistanceToTeammates,
        attackerSideAggression: (oldStats?.attackerSideAggression ?? 0) + attackerSideAggression,
        defenderSideHold: (oldStats?.defenderSideHold ?? 0) + defenderSideHold,
    }

    return positioningStats;
}

function getVelocity(oldPosition: Position, newPosition: Position, timeDelta: number): Position {
    if (timeDelta <= 0) {
        return new Position(0, 0);
    }
    return new Position(
        (newPosition.x - oldPosition.x) / timeDelta,
        (newPosition.y - oldPosition.y) / timeDelta,
    );
}


function getRoundStartData(playerId: string, event: FlatEvent): RoundStartData | null {
    const roundState = event.payload.target?.state;
    const teams = roundState.teams;

    if (!roundState || !teams) return null;

    const map: GameMap = roundState.map
    const initialPlayers = Object.fromEntries(
        teams.map((team: any) => [team.id, team.players.map((player: any) => player as RoundStartPlayer)])
    );
    return {
        ts: event.ts,
        map,
        players: initialPlayers,
    };
}

/**
 * Aggregate a combat stats delta into the existing PlayerValorantAnalysis
 */
export function aggregateCombatDelta(
    analysis: PlayerValorantAnalysis,
    delta: CombatStats
): void {
    // Aggregate weapon kills (Map)
    for (const [weapon, count] of Object.entries(delta.weaponKills)) {
        const current = analysis.combat.weaponKills.get(weapon) || 0;
        analysis.combat.weaponKills.set(weapon, current + count);
    }

    // Aggregate weapon damage (Map)
    for (const [weapon, damage] of Object.entries(delta.weaponDamage)) {
        const current = analysis.combat.weaponDamage.get(weapon) || 0;
        analysis.combat.weaponDamage.set(weapon, current + damage);
    }

    // Aggregate counters
    analysis.combat.deaths += delta.deaths;
    analysis.combat.assists += delta.assists;
    analysis.combat.kdr += delta.kdr;
    analysis.combat.adr += delta.adr;
    analysis.combat.acs += delta.acs;
    analysis.combat.firstKills += delta.firstKills;
    analysis.combat.firstDeaths += delta.firstDeaths;
    analysis.combat.entrySuccessRate += delta.entrySuccessRate;
    analysis.combat.headshotPercentage += delta.headshotPercentage;

    // Aggregate multi-kill rounds
    analysis.combat.multiKillRounds.twoK += delta.multiKillRounds.twoK;
    analysis.combat.multiKillRounds.threeK += delta.multiKillRounds.threeK;
    analysis.combat.multiKillRounds.fourPlus += delta.multiKillRounds.fourPlus;
}

/**
 * Extract important player data from a combat event
 * Handles actor and target player snapshots with their stats across different scopes (round, game, series)
 */
export function extractPlayerCombatEvent(event: FlatEvent): PlayerCombatEvent | null {
    const actor = event.payload?.actor;
    const target = event.payload?.target;

    if (!actor) return null;

    const actorSnapshot = extractPlayerSnapshot(actor);
    const targetSnapshot = target ? extractPlayerSnapshot(target) : null;

    return {
        timestamp: event.ts,
        eventType: event.type,
        action: event.payload?.action || '',
        actor: {
            ...actorSnapshot,
            roundStats: extractStatsSnapshot(actor.state?.round),
            gameStats: extractStatsSnapshot(actor.state?.game),
            seriesStats: extractStatsSnapshot(actor.state?.series),
        },
        target: targetSnapshot ? {
            ...targetSnapshot,
            roundStats: extractStatsSnapshot(target.state?.round),
            gameStats: extractStatsSnapshot(target.state?.game),
            seriesStats: extractStatsSnapshot(target.state?.series),
        } : null,
    };
}

/**
 * Extract basic player information and state
 */
function extractPlayerSnapshot(actor: any): PlayerSnapshot | null {
    if (actor && actor.type === "player" && actor.state) {
        const state = actor.state || {};
        const gameState = state.game || {};
        const position = gameState.position || null;

        return {
            playerId: state.id || '',
            playerName: state.name || '',
            teamId: state.teamId || '',
            side: state.side || null,
            money: gameState.money || 0,
            loadoutValue: gameState.loadoutValue || 0,
            netWorth: gameState.netWorth || 0,
            position,
            alive: gameState.alive !== false,
            currentHealth: gameState.currentHealth ?? 100,
            currentArmor: gameState.currentArmor ?? 0,
        };
    }
    return null;
}

/**
 * Extract round/game/series statistics snapshot
 */
function extractStatsSnapshot(segment: any): RoundSnapshot {
    if (!segment) {
        return {
            kills: 0,
            deaths: 0,
            weaponKills: {},
            firstKill: false,
        };
    }

    return {
        kills: segment.kills || 0,
        deaths: segment.deaths || 0,
        weaponKills: segment.weaponKills || {},
        firstKill: segment.firstKill || false,
    };
}

function getPlayersByTeam(event: FlatEvent): Record<string, TeamStatePlayer[]> | null {
    const playersByTeam: Record<string, TeamStatePlayer[]> = {};
    const payload = event.payload;
    const thisGame = payload?.seriesState?.games[-1];
    const teams = thisGame?.teams || [];

    if (!teams) return null;

    for (const team of teams) {
        const teamId = team.id;
        playersByTeam[teamId] = team.players.map((player: any) => player as TeamStatePlayer);
    }

    return playersByTeam;
}

function getPlayZone(playerPosition: Position, roundStartData: RoundStartData): "attack" | "defend" | null {
    const attackCenter = new Position(0, 0);
    const defendCenter = new Position(0, 0);

    for (const teamId in roundStartData.players) {
        const players = roundStartData.players[teamId];

        const aggCenter = players.reduce((acc, player) => acc.add(player.position), new Position(0, 0));
        const center = aggCenter.divide(players.length);

        if (roundStartData.attacker === teamId) {
            Object.assign(attackCenter, center);
        } else {
            Object.assign(defendCenter, center);
        }
    }

    const mapCenter = attackCenter.add(defendCenter).divide(2);
    const mapDirection = defendCenter.subtract(attackCenter).normalize();
    const perpendicularDirection = new Position(-mapDirection.y, mapDirection.x);

    const centerLine = {
        start: mapCenter.subtract(perpendicularDirection),
        end: mapCenter.add(perpendicularDirection),
    };

    // Determine which side of the centerLine the player is on
    const lineVec = centerLine.end.subtract(centerLine.start);
    const pointVec = playerPosition.subtract(centerLine.start);
    const crossProduct = lineVec.x * pointVec.y - lineVec.y * pointVec.x;

    // Determine zone based on which side of the line the player is on
    // mapDirection points from defend to attack
    // If cross product is positive, player is on the attack side
    return crossProduct > 0 ? "attack" : "defend";
}