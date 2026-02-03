import { Series } from "@/data/allData";
import { FlatEvent } from "./seriesAnalysis";
import { start } from "repl";
import { extractGameSegments } from "./gameSegmentation";
import {
    PlayerValorantAnalysis,
    PlayerCombatEvent,
    PlayerSnapshot,
    RoundSnapshot,
    CombatEvents,
    PositioningStats,
    TeamStatePlayer,
    GameMap,
    RoundStartPlayer,
    RoundStartData,
    Position,
    Side,
    PlayerRoundCombatStats,
    RoundTrendData,
    GameTrendData,
    SeriesTrendData,
    PositioningTrendData
} from "../grid/playerAnalysisTypes";


export function analysePlayerEvents(playerId: string, seriesData: { series: Series, events: FlatEvent[] }[]): PlayerValorantAnalysis {
    let startTime = 0;
    let endTime = 0;
    let playerName = "";

    const roundTrends: RoundTrendData[] = [];
    const gameTrends: GameTrendData[] = [];
    const allGameKills: number[] = [];
    const allGameDeaths: number[] = [];
    const allGameDamage: number[] = [];

    // Positioning tracking
    const allDistancesToTeammates: number[] = [];
    const allAttackerAggressions: number[] = [];
    const allDefenderHolds: number[] = [];
    const allVelocities: Position[] = [];

    let gameNumber = 0;

    seriesData.forEach(({ series, events }) => {
        if (startTime === 0 || events[0].ts < startTime) {
            startTime = events[0].ts;
        }
        if (endTime === 0 || events[events.length - 1].ts > endTime) {
            endTime = events[events.length - 1].ts;
        }
        const segments = extractGameSegments(events);

        for (const segment of segments) {
            gameNumber++;
            let roundStartData: RoundStartData | null = null;
            let positionStats: PositioningStats | null = null;
            let eorCombatStats: PlayerRoundCombatStats[] = [];
            const gameRoundStats: RoundTrendData[] = [];
            let gameWins = 0;
            let gameLosses = 0;

            for (let i = 0; i < segment.rounds.length; i++) {
                let roundAlivePercent = 0;
                let playerAlive = true;

                const round = segment.rounds[i];

                if (i === 0) {
                    roundStartData = getRoundStartData(playerId, segment.rounds[i].roundEvents[0]);
                }
                if (!roundStartData) continue;

                positionStats = null; // Reset for each round

                for (const event of round.roundEvents) {
                    positionStats = extractPositioningStats(playerId, event, roundStartData, positionStats ?? undefined);

                    if (playerAlive && !isPlayerAlive(playerId, event)) {
                        const roundLength = round.endTime - round.startTime;
                        roundAlivePercent = (event.ts - round.startTime) / roundLength;
                        playerAlive = false;
                    }
                }
                if (positionStats && round.roundEvents.length > 0) {
                    positionStats.avgVelocity = positionStats.avgVelocity.divide(round.roundEvents.length);
                    positionStats.avgDistanceToTeammates = positionStats.avgDistanceToTeammates / round.roundEvents.length;
                    positionStats.attackerSideAggression = positionStats.attackerSideAggression / round.roundEvents.length;
                    positionStats.defenderSideHold = positionStats.defenderSideHold / round.roundEvents.length;
                }

                // Track positioning stats
                if (positionStats) {
                    allDistancesToTeammates.push(positionStats.avgDistanceToTeammates);
                    allAttackerAggressions.push(positionStats.attackerSideAggression);
                    allDefenderHolds.push(positionStats.defenderSideHold);
                    allVelocities.push(positionStats.avgVelocity);
                }

                // Extract combat stats for this round
                const roundCombatStats = extractPlayerRoundCombatStats(playerId, round.roundEvents[round.roundEvents.length - 1].payload?.target?.state);
                if (roundCombatStats) {
                    playerName = roundCombatStats.playerName;
                    eorCombatStats.push(roundCombatStats);

                    const roundTrend: RoundTrendData = {
                        roundNumber: i + 1,
                        gameNumber,
                        combatStats: roundCombatStats,
                        alivePercent: roundAlivePercent
                    };
                    gameRoundStats.push(roundTrend);
                    roundTrends.push(roundTrend);

                    if (roundCombatStats.won) {
                        gameWins++;
                    } else {
                        gameLosses++;
                    }
                }
            }

            // Calculate game-level trends
            if (gameRoundStats.length > 0) {
                const gameTotalKills = gameRoundStats.reduce((sum, r) => sum + r.combatStats.kills, 0);
                const gameTotalDeaths = gameRoundStats.reduce((sum, r) => sum + r.combatStats.deaths, 0);
                const gameTotalDamage = gameRoundStats.reduce((sum, r) => sum + r.combatStats.damageDealt, 0);

                const gameTrend: GameTrendData = {
                    gameNumber,
                    roundsPlayed: gameRoundStats.length,
                    totalKills: gameTotalKills,
                    totalDeaths: gameTotalDeaths,
                    totalDamageDealt: gameTotalDamage,
                    totalDamageTaken: gameRoundStats.reduce((sum, r) => sum + r.combatStats.damageTaken, 0),
                    avgKillsPerRound: gameTotalKills / gameRoundStats.length,
                    avgDeathsPerRound: gameTotalDeaths / gameRoundStats.length,
                    avgDamagePerRound: gameTotalDamage / gameRoundStats.length,
                    winsInGame: gameWins,
                    won: gameWins > gameLosses
                };

                gameTrends.push(gameTrend);
                allGameKills.push(gameTrend.avgKillsPerRound);
                allGameDeaths.push(gameTrend.avgDeathsPerRound);
                allGameDamage.push(gameTrend.avgDamagePerRound);
            }
        }
    });

    // Calculate series-level trends
    const seriesTrends: SeriesTrendData = {
        gamesPlayed: gameTrends.length,
        totalKills: gameTrends.reduce((sum, g) => sum + g.totalKills, 0),
        totalDeaths: gameTrends.reduce((sum, g) => sum + g.totalDeaths, 0),
        totalDamageDealt: gameTrends.reduce((sum, g) => sum + g.totalDamageDealt, 0),
        totalDamageTaken: gameTrends.reduce((sum, g) => sum + g.totalDamageTaken, 0),
        avgKillsPerGame: allGameKills.length > 0 ? allGameKills.reduce((a, b) => a + b, 0) / allGameKills.length : 0,
        avgDeathsPerGame: allGameDeaths.length > 0 ? allGameDeaths.reduce((a, b) => a + b, 0) / allGameDeaths.length : 0,
        avgDamagePerGame: allGameDamage.length > 0 ? allGameDamage.reduce((a, b) => a + b, 0) / allGameDamage.length : 0,
        gamesWon: gameTrends.filter(g => g.won).length,
        winRate: gameTrends.length > 0 ? gameTrends.filter(g => g.won).length / gameTrends.length : 0
    };

    // Calculate positioning trends
    const positioningTrends: PositioningTrendData = {
        avgDistanceToTeammates: allDistancesToTeammates.length > 0
            ? allDistancesToTeammates.reduce((a, b) => a + b, 0) / allDistancesToTeammates.length
            : 0,
        attackerSideAggressionRate: allAttackerAggressions.length > 0
            ? allAttackerAggressions.reduce((a, b) => a + b, 0) / allAttackerAggressions.length
            : 0,
        defenderSideHoldRate: allDefenderHolds.length > 0
            ? allDefenderHolds.reduce((a, b) => a + b, 0) / allDefenderHolds.length
            : 0,
        avgVelocity: allVelocities.length > 0
            ? {
                x: allVelocities.reduce((sum, v) => sum + v.x, 0) / allVelocities.length,
                y: allVelocities.reduce((sum, v) => sum + v.y, 0) / allVelocities.length,
            }
            : { x: 0, y: 0 }
    };

    // Calculate trend directions and consistency
    const roundPerformanceTrend = calculateLinearTrend(roundTrends.map(r => r.combatStats.kills + (r.combatStats.damageDealt / 10)));
    const gamePerformanceTrend = calculateLinearTrend(allGameKills);
    const consistencyScore = calculateConsistency([...allGameKills, ...allGameDeaths, ...allGameDamage]);

    // Calculate positioning trends
    const aggressionTrend = calculateLinearTrend(allAttackerAggressions);
    const defenseTrend = calculateLinearTrend(allDefenderHolds);
    const teamDistanceTrend = calculateLinearTrend(allDistancesToTeammates);
    const velocityTrend = calculateLinearTrend(allVelocities.map(v => Math.sqrt(v.x * v.x + v.y * v.y)));

    return {
        playerId,
        playerName,
        timeWindow: {
            start: startTime,
            end: endTime
        },
        roundTrends,
        gameTrends,
        seriesTrends,
        positioningTrends,
        trends: {
            roundPerformanceTrend: roundPerformanceTrend.direction,
            roundPerformanceTrendValue: roundPerformanceTrend.correlation,
            gamePerformanceTrend: gamePerformanceTrend.direction,
            gamePerformanceTrendValue: gamePerformanceTrend.correlation,
            consistencyScore,
            aggressionTrend: aggressionTrend.direction,
            aggressionTrendValue: aggressionTrend.correlation,
            defenseTrend: defenseTrend.direction,
            defenseTrendValue: defenseTrend.correlation,
            teamDistanceTrend: teamDistanceTrend.direction,
            teamDistanceTrendValue: teamDistanceTrend.correlation,
            velocityTrend: velocityTrend.direction,
            velocityTrendValue: velocityTrend.correlation
        }
    };
}

/**
 * Merges two PlayerValorantAnalysis objects incrementally.
 * This allows processing series one at a time to avoid memory issues.
 */
export function mergePlayerAnalysis(
    existing: PlayerValorantAnalysis,
    newAnalysis: PlayerValorantAnalysis
): PlayerValorantAnalysis {
    // Merge time windows
    const mergedTimeWindow = {
        start: Math.min(existing.timeWindow.start, newAnalysis.timeWindow.start),
        end: Math.max(existing.timeWindow.end, newAnalysis.timeWindow.end)
    };

    // Merge trends (append new data)
    const mergedRoundTrends = [...existing.roundTrends, ...newAnalysis.roundTrends];
    const mergedGameTrends = [...existing.gameTrends, ...newAnalysis.gameTrends];

    // Merge series trends (aggregate totals)
    const mergedSeriesTrends: SeriesTrendData = {
        gamesPlayed: existing.seriesTrends.gamesPlayed + newAnalysis.seriesTrends.gamesPlayed,
        totalKills: existing.seriesTrends.totalKills + newAnalysis.seriesTrends.totalKills,
        totalDeaths: existing.seriesTrends.totalDeaths + newAnalysis.seriesTrends.totalDeaths,
        totalDamageDealt: existing.seriesTrends.totalDamageDealt + newAnalysis.seriesTrends.totalDamageDealt,
        totalDamageTaken: existing.seriesTrends.totalDamageTaken + newAnalysis.seriesTrends.totalDamageTaken,
        avgKillsPerGame: 0, // Will recalculate below
        avgDeathsPerGame: 0,
        avgDamagePerGame: 0,
        gamesWon: existing.seriesTrends.gamesWon + newAnalysis.seriesTrends.gamesWon,
        winRate: 0 // Will recalculate below
    };

    // Recalculate averages
    if (mergedSeriesTrends.gamesPlayed > 0) {
        mergedSeriesTrends.avgKillsPerGame = mergedSeriesTrends.totalKills / mergedSeriesTrends.gamesPlayed;
        mergedSeriesTrends.avgDeathsPerGame = mergedSeriesTrends.totalDeaths / mergedSeriesTrends.gamesPlayed;
        mergedSeriesTrends.avgDamagePerGame = mergedSeriesTrends.totalDamageDealt / mergedSeriesTrends.gamesPlayed;
        mergedSeriesTrends.winRate = mergedSeriesTrends.gamesWon / mergedSeriesTrends.gamesPlayed;
    }

    // Merge positioning trends (weighted average based on round count)
    const existingRounds = existing.roundTrends.length;
    const newRounds = newAnalysis.roundTrends.length;
    const totalRounds = existingRounds + newRounds;

    const mergedPositioningTrends: PositioningTrendData = totalRounds > 0 ? {
        avgDistanceToTeammates:
            (existing.positioningTrends.avgDistanceToTeammates * existingRounds +
                newAnalysis.positioningTrends.avgDistanceToTeammates * newRounds) / totalRounds,
        attackerSideAggressionRate:
            (existing.positioningTrends.attackerSideAggressionRate * existingRounds +
                newAnalysis.positioningTrends.attackerSideAggressionRate * newRounds) / totalRounds,
        defenderSideHoldRate:
            (existing.positioningTrends.defenderSideHoldRate * existingRounds +
                newAnalysis.positioningTrends.defenderSideHoldRate * newRounds) / totalRounds,
        avgVelocity: {
            x: (existing.positioningTrends.avgVelocity.x * existingRounds +
                newAnalysis.positioningTrends.avgVelocity.x * newRounds) / totalRounds,
            y: (existing.positioningTrends.avgVelocity.y * existingRounds +
                newAnalysis.positioningTrends.avgVelocity.y * newRounds) / totalRounds
        }
    } : existing.positioningTrends;

    // Recalculate trend directions based on merged data
    const allGameKills = mergedGameTrends.map(g => g.avgKillsPerRound);
    const allGameDeaths = mergedGameTrends.map(g => g.avgDeathsPerRound);
    const allGameDamage = mergedGameTrends.map(g => g.avgDamagePerRound);

    const roundPerformanceTrend = calculateLinearTrend(
        mergedRoundTrends.map(r => r.combatStats.kills + (r.combatStats.damageDealt / 10))
    );
    const gamePerformanceTrend = calculateLinearTrend(allGameKills);
    const consistencyScore = calculateConsistency([...allGameKills, ...allGameDeaths, ...allGameDamage]);

    // Calculate positioning trends for merged data
    const aggressionTrend = calculateLinearTrend(
        mergedRoundTrends.map(r => r.combatStats.side === 'attacker' ? 1 : 0).filter((_, i) => i % 10 === 0) // Sample for efficiency
    );
    const defenseTrend = calculateLinearTrend(
        mergedRoundTrends.map(r => r.combatStats.side === 'defender' ? 1 : 0).filter((_, i) => i % 10 === 0)
    );

    return {
        playerId: existing.playerId,
        playerName: existing.playerName || newAnalysis.playerName,
        timeWindow: mergedTimeWindow,
        roundTrends: mergedRoundTrends,
        gameTrends: mergedGameTrends,
        seriesTrends: mergedSeriesTrends,
        positioningTrends: mergedPositioningTrends,
        trends: {
            roundPerformanceTrend: roundPerformanceTrend.direction,
            roundPerformanceTrendValue: roundPerformanceTrend.correlation,
            gamePerformanceTrend: gamePerformanceTrend.direction,
            gamePerformanceTrendValue: gamePerformanceTrend.correlation,
            consistencyScore,
            aggressionTrend: aggressionTrend.direction,
            aggressionTrendValue: aggressionTrend.correlation,
            defenseTrend: defenseTrend.direction,
            defenseTrendValue: defenseTrend.correlation,
            teamDistanceTrend: 'stable',
            teamDistanceTrendValue: 0,
            velocityTrend: 'stable',
            velocityTrendValue: 0
        }
    };
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
                        if (getPlayZone(position, roundStartData!) === roundStartData.sides[teamId]) {
                            defenderSideHold += 1;
                        } else {
                            attackerSideAggression += 1;
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


function getRoundStartData(playerId: string, payload: FlatEvent): RoundStartData | null {
    const roundState = payload.payload.target?.state;
    const teams = roundState.teams;

    if (!roundState || !teams) return null;

    const map: GameMap = roundState.map
    const initialPlayers = Object.fromEntries(
        teams.map((team: any) => [team.id, team.players.map((player: any) => player as RoundStartPlayer)])
    );
    const sides = teams.map((team: any) => { return [team.id, team.side as Side] })
    return {
        ts: payload.ts,
        map,
        players: initialPlayers,
        sides: Object.fromEntries(sides)
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

function getPlayZone(playerPosition: Position, roundStartData: RoundStartData): Side | null {
    let attackCenter = new Position(0, 0);
    let defendCenter = new Position(0, 0);

    for (const teamId in roundStartData.players) {
        const players = roundStartData.players[teamId];

        const aggCenter = players.reduce((acc, player) => acc.add(player.position), new Position(0, 0));
        const center = aggCenter.divide(players.length);

        if (roundStartData.sides[teamId] === Side.Attacker) {
            attackCenter = center;
        } else {
            defendCenter = center;
        }
    }

    const mapCenter = attackCenter.add(defendCenter).divide(2);
    const mapDirection = defendCenter.subtract(attackCenter).normalize();
    const perpendicularDirection = new Position(-mapDirection.y, mapDirection.x);

    const centerLine = {
        start: mapCenter.subtract(perpendicularDirection),
        end: mapCenter.add(perpendicularDirection),
    };
    const lineVec = centerLine.end.subtract(centerLine.start);
    const pointVec = playerPosition.subtract(centerLine.start);
    const crossProduct = lineVec.x * pointVec.y - lineVec.y * pointVec.x;

    return crossProduct > 0 ? Side.Attacker : Side.Defender;
}

function isPlayerAlive(playerId: string, event: FlatEvent): boolean {
    const payload = event.payload;
    const thisGame = payload?.seriesState?.games[-1];
    const teams = thisGame?.teams || [];

    for (const team of teams) {
        const player = team.players.find((p: any) => p.id === playerId);
        if (player) {
            return player.alive ?? false;
        }
    }
    return false;
}

/**
 * Extract a single player's combat stats from a round state
 */
export function extractPlayerRoundCombatStats(playerId: string, roundState: any): PlayerRoundCombatStats | null {
    if (!roundState || !roundState.teams) return null;

    for (const team of roundState.teams) {
        const player = team.players?.find((p: any) => p.id === playerId);

        if (player) {
            return {
                playerId: player.id,
                playerName: player.name,
                teamId: team.id,
                side: team.side as Side,
                won: team.won,
                kills: player.kills ?? 0,
                deaths: player.deaths ?? 0,
                killAssistsGiven: player.killAssistsGiven ?? 0,
                killAssistsReceived: player.killAssistsReceived ?? 0,
                headshots: player.headshots ?? 0,
                weaponKills: player.weaponKills ?? {},
                damageDealt: player.damageDealt ?? 0,
                damageTaken: player.damageTaken ?? 0,
                firstKill: player.firstKill ?? false,
                alive: player.alive ?? false,
                currentHealth: player.currentHealth ?? 0,
                currentArmor: player.currentArmor ?? 0,
                maxHealth: player.maxHealth ?? 100,
                objectives: (player.objectives ?? []).map((obj: any) => ({
                    id: obj.id,
                    type: obj.type,
                    completionCount: obj.completionCount ?? 0,
                    completedFirst: obj.completedFirst ?? false,
                })),
            };
        }
    }

    return null;
}

/**
 * Calculate linear trend correlation to identify if performance is improving or declining
 */
function calculateLinearTrend(values: number[]): { direction: 'improving' | 'declining' | 'stable'; correlation: number } {
    if (values.length < 2) return { direction: 'stable', correlation: 0 };

    // Calculate Pearson correlation coefficient between index and value
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i + 1);

    const meanIndex = indices.reduce((a, b) => a + b, 0) / n;
    const meanValue = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominatorIndex = 0;
    let denominatorValue = 0;

    for (let i = 0; i < n; i++) {
        const diffIndex = indices[i] - meanIndex;
        const diffValue = values[i] - meanValue;
        numerator += diffIndex * diffValue;
        denominatorIndex += diffIndex * diffIndex;
        denominatorValue += diffValue * diffValue;
    }

    const denominator = Math.sqrt(denominatorIndex * denominatorValue);
    const correlation = denominator === 0 ? 0 : numerator / denominator;

    // Determine direction based on correlation coefficient
    const threshold = 0.1;
    let direction: 'improving' | 'declining' | 'stable';

    if (correlation > threshold) {
        direction = 'improving';
    } else if (correlation < -threshold) {
        direction = 'declining';
    } else {
        direction = 'stable';
    }

    return { direction, correlation };
}

/**
 * Calculate consistency score based on coefficient of variation across all metrics
 * Returns 0-1 where 1 is perfectly consistent and 0 is highly variable
 */
function calculateConsistency(allMetrics: number[]): number {
    if (allMetrics.length === 0) return 0;

    const mean = allMetrics.reduce((a, b) => a + b, 0) / allMetrics.length;
    if (mean === 0) return 0;

    const variance = allMetrics.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allMetrics.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Convert to 0-1 scale where 1 is consistent (low CV)
    // Using inverse relationship: consistency = 1 / (1 + CV)
    return 1 / (1 + coefficientOfVariation);
}
/**
 * Convert player analysis data into a compact format optimized for LLM consumption
 * Omits detailed round-by-round data to keep payload size manageable
 */
export function formatPlayerAnalysisForLLMCompact(analysis: PlayerValorantAnalysis): string {
    const { seriesTrends, gameTrends, trends, playerName, playerId, positioningTrends } = analysis;

    const summary = `
PLAYER PERFORMANCE ANALYSIS REPORT
==================================
Player: ${playerName} (ID: ${playerId})

SERIES-LEVEL STATISTICS
-----------------------
Games Played: ${seriesTrends.gamesPlayed}
Games Won: ${seriesTrends.gamesWon}
Win Rate: ${(seriesTrends.winRate * 100).toFixed(1)}%

Combat Statistics:
- Total Kills: ${seriesTrends.totalKills}
- Total Deaths: ${seriesTrends.totalDeaths}
- Kill/Death Ratio: ${(seriesTrends.totalKills / (seriesTrends.totalDeaths || 1)).toFixed(2)}
- Total Damage Dealt: ${seriesTrends.totalDamageDealt.toFixed(0)}
- Total Damage Taken: ${seriesTrends.totalDamageTaken.toFixed(0)}

Per-Game Averages:
- Kills/Game: ${seriesTrends.avgKillsPerGame.toFixed(2)}
- Deaths/Game: ${seriesTrends.avgDeathsPerGame.toFixed(2)}
- Damage/Game: ${seriesTrends.avgDamagePerGame.toFixed(0)}

POSITIONING & MAP AWARENESS
---------------------------
Team Coordination:
- Average Distance to Teammates: ${positioningTrends.avgDistanceToTeammates.toFixed(1)} units
- Interpretation: ${interpretTeamDistance(positioningTrends.avgDistanceToTeammates)}

Positioning Tendencies:
- Attacker Side Aggression Rate: ${(positioningTrends.attackerSideAggressionRate * 100).toFixed(1)}%
- Defender Side Hold Rate: ${(positioningTrends.defenderSideHoldRate * 100).toFixed(1)}%
- Interpretation: ${interpretPositioningStyle(positioningTrends.attackerSideAggressionRate, positioningTrends.defenderSideHoldRate)}

PERFORMANCE TRENDS
------------------
Within-Game Performance: ${trends.roundPerformanceTrend.toUpperCase()}
- Direction: ${getTrendEmoji(trends.roundPerformanceTrend)} ${trends.roundPerformanceTrend}
- Correlation: ${trends.roundPerformanceTrendValue.toFixed(3)}
- Interpretation: ${interpretRoundTrend(trends.roundPerformanceTrend, trends.roundPerformanceTrendValue)}

Series Performance: ${trends.gamePerformanceTrend.toUpperCase()}
- Direction: ${getTrendEmoji(trends.gamePerformanceTrend)} ${trends.gamePerformanceTrend}
- Correlation: ${trends.gamePerformanceTrendValue.toFixed(3)}
- Interpretation: ${interpretGameTrend(trends.gamePerformanceTrend, trends.gamePerformanceTrendValue)}

Consistency Score: ${(trends.consistencyScore * 100).toFixed(1)}%
- Interpretation: ${interpretConsistency(trends.consistencyScore)}

KEY OBSERVATIONS
----------------
${generateKeyObservations(analysis).join('\n')}
    `.trim();

    return summary;
}

/**
 * Convert player analysis data into a structured format optimized for LLM consumption
 */
export function formatPlayerAnalysisForLLM(analysis: PlayerValorantAnalysis): string {
    const { seriesTrends, gameTrends, roundTrends, trends, playerName, playerId } = analysis;

    const summary = `
PLAYER PERFORMANCE ANALYSIS REPORT
==================================
Player: ${playerName} (ID: ${playerId})
Analysis Period: ${new Date(analysis.timeWindow.start).toLocaleDateString()} - ${new Date(analysis.timeWindow.end).toLocaleDateString()}

SERIES-LEVEL STATISTICS
-----------------------
Games Played: ${seriesTrends.gamesPlayed}
Games Won: ${seriesTrends.gamesWon}
Win Rate: ${(seriesTrends.winRate * 100).toFixed(1)}%

Combat Statistics:
- Total Kills: ${seriesTrends.totalKills}
- Total Deaths: ${seriesTrends.totalDeaths}
- Kill/Death Ratio: ${(seriesTrends.totalKills / (seriesTrends.totalDeaths || 1)).toFixed(2)}
- Total Damage Dealt: ${seriesTrends.totalDamageDealt.toFixed(0)}
- Total Damage Taken: ${seriesTrends.totalDamageTaken.toFixed(0)}

Per-Game Averages:
- Kills/Game: ${seriesTrends.avgKillsPerGame.toFixed(2)}
- Deaths/Game: ${seriesTrends.avgDeathsPerGame.toFixed(2)}
- Damage/Game: ${seriesTrends.avgDamagePerGame.toFixed(0)}

POSITIONING & MAP AWARENESS
---------------------------
Team Coordination:
- Average Distance to Teammates: ${analysis.positioningTrends.avgDistanceToTeammates.toFixed(1)} units
- Interpretation: ${interpretTeamDistance(analysis.positioningTrends.avgDistanceToTeammates)}

Positioning Tendencies:
- Attacker Side Aggression Rate: ${(analysis.positioningTrends.attackerSideAggressionRate * 100).toFixed(1)}%
- Defender Side Hold Rate: ${(analysis.positioningTrends.defenderSideHoldRate * 100).toFixed(1)}%
- Interpretation: ${interpretPositioningStyle(analysis.positioningTrends.attackerSideAggressionRate, analysis.positioningTrends.defenderSideHoldRate)}

Movement & Velocity:
- Average Velocity: ${(Math.sqrt(Math.pow(analysis.positioningTrends.avgVelocity.x, 2) + Math.pow(analysis.positioningTrends.avgVelocity.y, 2))).toFixed(2)} units/s
- Interpretation: ${interpretVelocity(Math.sqrt(Math.pow(analysis.positioningTrends.avgVelocity.x, 2) + Math.pow(analysis.positioningTrends.avgVelocity.y, 2)))}

TREND ANALYSIS
--------------
Within-Game Performance: ${trends.roundPerformanceTrend.toUpperCase()}
- Direction: ${getTrendEmoji(trends.roundPerformanceTrend)} ${trends.roundPerformanceTrend}
- Correlation: ${trends.roundPerformanceTrendValue.toFixed(3)}
- Interpretation: ${interpretRoundTrend(trends.roundPerformanceTrend, trends.roundPerformanceTrendValue)}

Series Performance: ${trends.gamePerformanceTrend.toUpperCase()}
- Direction: ${getTrendEmoji(trends.gamePerformanceTrend)} ${trends.gamePerformanceTrend}
- Correlation: ${trends.gamePerformanceTrendValue.toFixed(3)}
- Interpretation: ${interpretGameTrend(trends.gamePerformanceTrend, trends.gamePerformanceTrendValue)}

Consistency Score: ${(trends.consistencyScore * 100).toFixed(1)}%
- Interpretation: ${interpretConsistency(trends.consistencyScore)}

GAME-BY-GAME BREAKDOWN
----------------------
${gameTrends.map((game, idx) => `
Game ${game.gameNumber}:
  Rounds Played: ${game.roundsPlayed}
  Result: ${game.won ? 'WIN' : 'LOSS'} (${game.winsInGame}W-${game.roundsPlayed - game.winsInGame}L)
  Kills: ${game.totalKills} (${game.avgKillsPerRound.toFixed(2)}/round)
  Deaths: ${game.totalDeaths} (${game.avgDeathsPerRound.toFixed(2)}/round)
  Damage: ${game.totalDamageDealt.toFixed(0)} dealt / ${game.totalDamageTaken.toFixed(0)} taken
  K/D: ${(game.totalKills / (game.totalDeaths || 1)).toFixed(2)}
`).join('\n')}

ROUND-BY-ROUND PERFORMANCE METRICS
-----------------------------------
Total Rounds: ${roundTrends.length}
Rounds Won: ${roundTrends.filter(r => r.combatStats.won).length}
Win Rate: ${((roundTrends.filter(r => r.combatStats.won).length / roundTrends.length) * 100).toFixed(1)}%

Performance Distribution:
- Highest Kill Round: ${Math.max(...roundTrends.map(r => r.combatStats.kills))} kills
- Lowest Kill Round: ${Math.min(...roundTrends.map(r => r.combatStats.kills))} kills
- Highest Damage Round: ${Math.max(...roundTrends.map(r => r.combatStats.damageDealt)).toFixed(0)} damage
- Most Deaths in a Round: ${Math.max(...roundTrends.map(r => r.combatStats.deaths))} deaths

Combat Effectiveness:
- Headshot Rate: ${calculateHeadshotRate(roundTrends)}%
- Average Time Alive: ${calculateAvgAlivePercent(roundTrends)}%
- First Kill Percentage: ${calculateFirstKillRate(roundTrends)}%

KEY OBSERVATIONS
----------------
${generateKeyObservations(analysis).join('\n')}
    `.trim();

    return summary;
}

/**
 * Interpret team distance for positioning analysis
 */
function interpretTeamDistance(distance: number): string {
    if (distance < 20) {
        return 'Very close to teammates - suggests supportive playstyle and high coordination.';
    } else if (distance < 50) {
        return 'Close to teammates - good team cohesion with balanced individual plays.';
    } else if (distance < 100) {
        return 'Moderate distance - maintains individual space while staying connected to team.';
    } else {
        return 'High distance from teammates - suggests independent playstyle or split strategy usage.';
    }
}

/**
 * Interpret positioning style (aggression vs defense)
 */
function interpretPositioningStyle(aggressionRate: number, holdRate: number): string {
    if (aggressionRate > 0.6) {
        return 'Aggressive playstyle - frequently takes up forward positions on attack, pushing timings and entry fragging.';
    } else if (holdRate > 0.6) {
        return 'Defensive playstyle - often holds back positions or anchors defense, prioritizing information and retake setup.';
    } else {
        return 'Balanced playstyle - flexibly adjusts between aggressive and defensive positioning based on round needs.';
    }
}

/**
 * Interpret movement velocity
 */
function interpretVelocity(velocity: number): string {
    if (velocity > 5) {
        return 'High mobility - constantly repositioning and maintaining map presence. Suggests active playstyle.';
    } else if (velocity > 2) {
        return 'Moderate mobility - regular repositioning with measured map rotations.';
    } else {
        return 'Low mobility - tends to hold positions and limit unnecessary movement. Suggests strategic positioning.';
    }
}

/**
 * Helper function to get emoji representation of trend
 */
function getTrendEmoji(trend: string): string {
    switch (trend) {
        case 'improving':
            return '📈';
        case 'declining':
            return '📉';
        case 'stable':
            return '➡️';
        default:
            return '❓';
    }
}

/**
 * Interpret round-level trend for LLM
 */
function interpretRoundTrend(trend: string, correlation: number): string {
    if (trend === 'improving') {
        return `Player is getting stronger as games progress (correlation: ${correlation.toFixed(2)}). Performance tends to improve from early to late rounds.`;
    } else if (trend === 'declining') {
        return `Player's performance weakens as games progress (correlation: ${correlation.toFixed(2)}). May indicate fatigue or diminishing focus over longer matches.`;
    } else {
        return `Player maintains consistent performance throughout rounds. No significant improvement or decline pattern detected.`;
    }
}

/**
 * Interpret game-level trend for LLM
 */
function interpretGameTrend(trend: string, correlation: number): string {
    if (trend === 'improving') {
        return `Player is improving across the series (correlation: ${correlation.toFixed(2)}). Performance gets better with each successive game.`;
    } else if (trend === 'declining') {
        return `Player's performance is declining across the series (correlation: ${correlation.toFixed(2)}). May indicate adaptation issues or decreasing confidence.`;
    } else {
        return `Player maintains stable performance across all games in the series.`;
    }
}

/**
 * Interpret consistency score
 */
function interpretConsistency(score: number): string {
    if (score > 0.75) {
        return 'Highly consistent performer - maintains reliable output across all games and rounds.';
    } else if (score > 0.5) {
        return 'Moderately consistent - shows good stability with occasional variance in performance.';
    } else if (score > 0.25) {
        return 'Variable performer - significant fluctuations between games, indicating inconsistency.';
    } else {
        return 'Highly inconsistent - major performance swings, suggesting reliability issues.';
    }
}

/**
 * Calculate headshot rate from round trends
 */
function calculateHeadshotRate(roundTrends: RoundTrendData[]): string {
    const totalKills = roundTrends.reduce((sum, r) => sum + r.combatStats.kills, 0);
    const totalHeadshots = roundTrends.reduce((sum, r) => sum + r.combatStats.headshots, 0);
    return totalKills > 0 ? ((totalHeadshots / totalKills) * 100).toFixed(1) : '0.0';
}

/**
 * Calculate average time alive percentage
 */
function calculateAvgAlivePercent(roundTrends: RoundTrendData[]): string {
    const avg = roundTrends.reduce((sum, r) => sum + r.alivePercent, 0) / roundTrends.length;
    return (avg * 100).toFixed(1);
}

/**
 * Calculate first kill rate
 */
function calculateFirstKillRate(roundTrends: RoundTrendData[]): string {
    const firstKills = roundTrends.filter(r => r.combatStats.firstKill).length;
    return ((firstKills / roundTrends.length) * 100).toFixed(1);
}

/**
 * Generate key observations from the data
 */
function generateKeyObservations(analysis: PlayerValorantAnalysis): string[] {
    const observations: string[] = [];
    const { seriesTrends, gameTrends, roundTrends, trends } = analysis;

    // Win rate observation
    if (seriesTrends.winRate > 0.6) {
        observations.push(`✓ Strong Win Rate: Player wins ${(seriesTrends.winRate * 100).toFixed(0)}% of games, indicating high consistency and skill.`);
    } else if (seriesTrends.winRate < 0.4) {
        observations.push(`⚠ Low Win Rate: Player only wins ${(seriesTrends.winRate * 100).toFixed(0)}% of games. May need to focus on decision-making and team coordination.`);
    }

    // K/D ratio observation
    const kdRatio = seriesTrends.totalKills / (seriesTrends.totalDeaths || 1);
    if (kdRatio > 1.5) {
        observations.push(`✓ Excellent K/D Ratio: ${kdRatio.toFixed(2)} indicates strong fragging ability and positioning.`);
    } else if (kdRatio < 0.8) {
        observations.push(`⚠ Low K/D Ratio: ${kdRatio.toFixed(2)} suggests positioning or engagement issues. Player may be overextending.`);
    }

    // Trend observation
    if (trends.roundPerformanceTrend === 'improving') {
        observations.push(`✓ Strong Mid-Game: Player improves as rounds progress, suggesting good adaptability and momentum building.`);
    } else if (trends.roundPerformanceTrend === 'declining') {
        observations.push(`⚠ Fatigue Pattern: Performance declines as rounds progress. May need stamina or mental resilience training.`);
    }

    // Consistency observation
    if (trends.consistencyScore > 0.7) {
        observations.push(`✓ Reliable Performer: High consistency score (${(trends.consistencyScore * 100).toFixed(0)}%) makes this player dependable in crucial matches.`);
    } else if (trends.consistencyScore < 0.4) {
        observations.push(`⚠ Inconsistency Issues: Low consistency (${(trends.consistencyScore * 100).toFixed(0)}%) creates unpredictability. Focus needed on mental game.`);
    }

    // Game performance trend
    if (trends.gamePerformanceTrend === 'improving') {
        observations.push(`✓ Series Momentum: Player is improving across successive games, showing strong learning and adaptation.`);
    } else if (trends.gamePerformanceTrend === 'declining') {
        observations.push(`⚠ Series Fatigue: Performance drops across games. Consider rest and recovery between matches.`);
    }

    return observations;
}