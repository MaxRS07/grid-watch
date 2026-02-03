import { FlatEvent, getEventActor, getEventTarget, getWinningTeam } from './seriesAnalysis';

export interface RoundEventInfo {
    timeStamp: number;
    position: number;
    name: string;
}

export interface Team {
    id: string;
    name: string;
}

export interface RoundSegment {
    winningTeam?: Team;
    startPos: number;
    endPos: number;
    startTime: number;
    endTime: number;
    roundEvents: FlatEvent[];
}

export interface GameSegment {
    winningTeam?: Team;
    startPos: number;
    endPos: number;
    startTime: number;
    endTime: number;
    rounds: RoundSegment[];
    gameEvents?: FlatEvent[]; // Events for games without rounds (e.g., LoL)
}

/**
 * Extracts game and round segments from a flat event stream.
 * Intelligently handles both round-based games (CS:GO) and non-round games (League of Legends).
 *
 * @param events - The flattened event stream
 * @returns An array of game segments with nested rounds and events
 */
export function extractGameSegments(events: FlatEvent[]): GameSegment[] {
    if (!events || events.length === 0) {
        return [];
    }

    const minTime = events[0].ts;
    const maxTime = events[events.length - 1].ts;
    const duration = maxTime - minTime || 1;

    const gameSegments: GameSegment[] = [];
    let gameStartTime: number | null = null;
    let gameStartPos: number | null = null;
    let gameStartData: any = null;
    let roundStartData: any = null;
    let roundStartTime: number | null = null;
    let roundStartPos: number | null = null;
    let roundEvents: FlatEvent[] = [];
    let gameEvents: FlatEvent[] = [];
    let currentGameRounds: RoundSegment[] = [];
    let gameHasRounds = false;

    for (const event of events) {
        const position = ((event.ts - minTime) / duration) * 100;
        const eventTypeLower = event.type.toLowerCase();

        // Game tracking
        if (eventTypeLower === 'series-started-game') {
            gameStartTime = event.ts;
            gameStartPos = position;
            currentGameRounds = [];
            gameEvents = [event];
            gameHasRounds = false;
        } else if (eventTypeLower === 'series-ended-game' && gameStartTime !== null && gameStartPos !== null) {
            gameEvents.push(event);
            gameSegments.push({
                winningTeam: getWinningTeam(event) ?? undefined,
                startPos: gameStartPos,
                endPos: position,
                startTime: gameStartTime,
                endTime: event.ts,
                rounds: currentGameRounds,
                gameEvents: gameEvents,
            });
            gameStartTime = null;
            gameStartPos = null;
            currentGameRounds = [];
            gameEvents = [];
            gameHasRounds = false;
        }

        // Round tracking (only within a game)
        if (gameStartTime !== null) {
            if (eventTypeLower === 'game-started-round') {
                gameHasRounds = true;
                roundStartTime = event.ts;
                roundStartPos = position;
                roundStartData = event.payload ?? undefined;
                roundEvents = [event]
            } else if (eventTypeLower === 'game-ended-round' && roundStartTime !== null && roundStartPos !== null) {
                roundEvents.push(event);
                currentGameRounds.push({
                    winningTeam: getWinningTeam(event) ?? undefined,
                    startPos: roundStartPos,
                    endPos: position,
                    startTime: roundStartTime,
                    endTime: event.ts,
                    roundEvents,
                });
                roundEvents = [];
                roundStartTime = null;
                roundStartPos = null;
            } else {
                // Add to round events if we're in a round, otherwise add to game events
                if (roundStartTime !== null) {
                    roundEvents.push(event);
                } else {
                    gameEvents.push(event);
                }
            }
        }
    }

    // Handle case where game started but didn't end
    if (gameStartTime !== null && gameStartPos !== null) {
        // Handle unclosed round if exists
        if (roundStartTime !== null && roundStartPos !== null) {
            currentGameRounds.push({
                startPos: roundStartPos,
                endPos: 100,
                startTime: roundStartTime,
                endTime: maxTime,
                roundEvents,
            });
        }
        gameSegments.push({
            startPos: gameStartPos,
            endPos: 100,
            startTime: gameStartTime,
            endTime: maxTime,
            rounds: currentGameRounds,
            gameEvents: !gameHasRounds ? gameEvents : undefined,
        });
    }

    return gameSegments;
}
