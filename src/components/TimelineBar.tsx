'use client';

import { useState } from 'react';
import { FlatEvent } from '@/lib/grid/seriesAnalysis';
import { extractGameSegments, GameSegment, Team, RoundEventInfo } from '@/lib/grid/gameSegmentation';
import TimelineEvent from './TimelineEvent';

interface ExpandedState {
    games: Set<number>;
    rounds: Set<string>; // Key format: "gameIdx-roundIdx"
}

interface TimelineBarProps {
    events: FlatEvent[];
    seriesTeams?: Team[];
    seriesId: string;
    seriesName: string;
    onEventClick?: (event: FlatEvent) => void;
}

export default function TimelineBar({
    events,
    seriesTeams,
    seriesId,
    seriesName,
    onEventClick,
}: TimelineBarProps) {
    const [selectedEvent, setSelectedEvent] = useState<FlatEvent | null>(null);
    const [expandedState, setExpandedState] = useState<ExpandedState>({
        games: new Set(),
        rounds: new Set(),
    });

    if (!events || events.length === 0) {
        return (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No events recorded for this series
                </p>
            </div>
        );
    }

    // Calculate min and max timestamps
    const minTime = events[0].ts;
    const maxTime = events[events.length - 1].ts;
    const duration = maxTime - minTime || 1; // Avoid division by zero

    // Extract game and round segments using utility function
    const gameSegments = extractGameSegments(events);

    // Calculate position for each event (0-100%)
    const eventPositions = events.map(event => ({
        event,
        position: ((event.ts - minTime) / duration) * 100,
    }));

    // Format duration for display
    const durationSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const handleEventSelect = (event: FlatEvent) => {
        setSelectedEvent(event);
        onEventClick?.(event);
    };

    const toggleGameExpanded = (gameIdx: number) => {
        setExpandedState(prev => {
            const newGames = new Set(prev.games);
            if (newGames.has(gameIdx)) {
                newGames.delete(gameIdx);
            } else {
                newGames.add(gameIdx);
            }
            return { ...prev, games: newGames };
        });
    };

    const toggleRoundExpanded = (gameIdx: number, roundIdx: number) => {
        setExpandedState(prev => {
            const key = `${gameIdx}-${roundIdx}`;
            const newRounds = new Set(prev.rounds);
            if (newRounds.has(key)) {
                newRounds.delete(key);
            } else {
                newRounds.add(key);
            }
            return { ...prev, rounds: newRounds };
        });
    };

    const expandAllGames = () => {
        setExpandedState(prev => ({
            ...prev,
            games: new Set(gameSegments.map((_, idx) => idx)),
        }));
        expandAllRounds();
    };

    const collapseAllGames = () => {
        setExpandedState(prev => ({
            ...prev,
            games: new Set(),
        }));
        collapseAllRounds();
    };

    const expandAllRounds = () => {
        const allRoundKeys = new Set<string>();
        gameSegments.forEach((segment, gameIdx) => {
            segment.rounds.forEach((_, roundIdx) => {
                allRoundKeys.add(`${gameIdx}-${roundIdx}`);
            });
        });
        setExpandedState(prev => ({
            ...prev,
            rounds: allRoundKeys,
        }));
    };

    const collapseAllRounds = () => {
        setExpandedState(prev => ({
            ...prev,
            rounds: new Set(),
        }));
    };

    return (
        <div className="space-y-4">
            {/* Series Header */}
            <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                    {seriesName}
                </h3>
                <h4 className="text-sm text-zinc-600 dark:text-zinc-400">{seriesTeams && seriesTeams.map(team => team.name).join(' vs ')}</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {events.length} events • Duration: {durationText}
                </p>
            </div>

            {/* Timeline Container */}
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Timeline Bar - Scrollable */}
                <div className="overflow-x-auto">
                    <div className="px-8 py-2">
                        <div className="relative h-16 bg-linear-to-r from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-700" style={{ minWidth: '100%', width: 'max(100%, 800px)' }}>
                            {/* Game Active Segments Background */}
                            {gameSegments.map((segment, idx) => (
                                <div key={`game-segment-${idx}`}>
                                    {/* Game Background */}
                                    <div
                                        className="absolute top-0 bottom-0 bg-blue-100 dark:bg-blue-900/30 opacity-40"
                                        style={{
                                            left: `${segment.startPos}%`,
                                            right: `${100 - segment.endPos}%`,
                                        }}
                                        title={`Game ${idx + 1}: ${new Date(segment.startTime).toLocaleTimeString()} - ${new Date(segment.endTime).toLocaleTimeString()}`}
                                    />
                                    {/* Round Segments within Game */}
                                    {segment.rounds.map((round, roundIdx) => (
                                        <div
                                            key={`round-${idx}-${roundIdx}`}
                                            className="absolute top-0 bottom-0 bg-purple-200 dark:bg-purple-900/40 opacity-50"
                                            style={{
                                                left: `${round.startPos}%`,
                                                right: `${100 - round.endPos}%`,
                                            }}
                                            title={`Round ${roundIdx + 1}: ${new Date(round.startTime).toLocaleTimeString()} - ${new Date(round.endTime).toLocaleTimeString()}`}
                                        />
                                    ))}
                                </div>
                            ))}

                            {/* Events on Timeline */}
                            {eventPositions.map(({ event, position }, idx) => (
                                <TimelineEvent
                                    key={`${event.correlationId}-${event.sequenceNumber}-${event.ts}-${event.type}-${idx}`}
                                    event={event}
                                    position={position}
                                    onClick={handleEventSelect}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Time Labels */}
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2 px-1">
                        <span>{new Date(minTime).toLocaleTimeString()}</span>
                        <span>{new Date(maxTime).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            {/* Game Segments Legend */}
            {gameSegments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {gameSegments.length} Game{gameSegments.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={expandAllGames}
                                className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                                Expand All
                            </button>
                            <button
                                onClick={collapseAllGames}
                                className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                                Collapse All
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {gameSegments.map((segment, gameIdx) => {
                            const isGameExpanded = expandedState.games.has(gameIdx);
                            return (
                                <div key={`game-legend-${gameIdx}`} className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-3">
                                    {/* Game Header */}
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => toggleGameExpanded(gameIdx)}
                                            className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-medium hover:text-zinc-900 dark:hover:text-white"
                                        >
                                            <span className={`text-sm transition-transform ${isGameExpanded ? '' : '-rotate-90'}`}>
                                                ▼
                                            </span>
                                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                            <span>
                                                Game {gameIdx + 1} ({segment.winningTeam ? segment.winningTeam.name : 'N/A'})
                                            </span>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-normal">
                                                {new Date(segment.startTime).toLocaleTimeString()} - {new Date(segment.endTime).toLocaleTimeString()}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Game-level Events (for games without rounds, like LoL) */}
                                    {isGameExpanded && segment.gameEvents && segment.gameEvents.length > 0 && (
                                        <div className="ml-4 mt-3 space-y-0.5 border-l border-zinc-300 dark:border-zinc-600 pl-3">
                                            {segment.gameEvents.map((evt, evtIdx) => (
                                                <div
                                                    key={`game-event-${gameIdx}-${evtIdx}`}
                                                    className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-2 py-0.5"
                                                >
                                                    <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: getEventTypeColor(evt.type) }}></span>
                                                    <span className="text-zinc-600 dark:text-zinc-400">{evt.type}</span>
                                                    <span className="text-zinc-400 dark:text-zinc-600 text-xs">
                                                        {new Date(evt.ts).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Nested Rounds (for games with rounds) */}
                                    {isGameExpanded && segment.rounds.length > 0 && (
                                        <div className="ml-4 mt-3 space-y-2 border-l border-zinc-300 dark:border-zinc-600 pl-3">
                                            {segment.rounds.map((round, roundIdx) => {
                                                const roundKey = `${gameIdx}-${roundIdx}`;
                                                const isRoundExpanded = expandedState.rounds.has(roundKey);
                                                return (
                                                    <div key={`round-legend-${roundKey}`}>
                                                        {/* Round Header */}
                                                        <button
                                                            onClick={() => toggleRoundExpanded(gameIdx, roundIdx)}
                                                            className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white"
                                                        >
                                                            <span className={`text-sm transition-transform ${isRoundExpanded ? '' : '-rotate-90'}`}>
                                                                ▼
                                                            </span>
                                                            <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                                            <span>
                                                                Round {roundIdx + 1} ({round.winningTeam ? round.winningTeam.name : 'N/A'})
                                                            </span>
                                                            <span className="text-zinc-500 dark:text-zinc-500 text-xs font-normal">
                                                                {new Date(round.startTime).toLocaleTimeString()} - {new Date(round.endTime).toLocaleTimeString()}
                                                            </span>
                                                        </button>

                                                        {/* Round Events */}
                                                        {isRoundExpanded && round.roundEvents.length > 0 && (
                                                            <div className="ml-4 mt-1 space-y-0.5">
                                                                {round.roundEvents.map((evt, evtIdx) => (
                                                                    <div
                                                                        key={`round-event-${roundKey}-${evtIdx}`}
                                                                        className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-2 py-0.5"
                                                                    >
                                                                        <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: getEventTypeColor(evt.type) }}></span>
                                                                        <span className="text-zinc-600 dark:text-zinc-400">{evt.type}</span>
                                                                        <span className="text-zinc-400 dark:text-zinc-600 text-xs">
                                                                            {new Date(evt.ts).toLocaleTimeString()}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Event Details */}
            {
                selectedEvent && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                                    {selectedEvent.type}
                                </p>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                    {new Date(selectedEvent.ts).toLocaleTimeString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Event Payload */}
                        {selectedEvent.payload && (
                            <details className="mt-2">
                                <summary className="text-xs cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                    View details
                                </summary>
                                <pre className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-900 rounded text-xs overflow-auto max-h-40 text-zinc-700 dark:text-zinc-300">
                                    {JSON.stringify(selectedEvent.payload, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                )
            }
        </div >
    );
}

function getEventTypeColor(eventType: string): string {
    const colorMap: Record<string, string> = {
        kill: '#ef4444',
        death: '#8b5cf6',
        round_start: '#3b82f6',
        round_end: '#06b6d4',
        game_start: '#10b981',
        game_end: '#f59e0b',
        clutch: '#ec4899',
        bomb_plant: '#14b8a6',
        bomb_defuse: '#06b6d4',
        site: '#f97316',
    };

    for (const [key, color] of Object.entries(colorMap)) {
        if (eventType.toLowerCase().includes(key)) {
            return color;
        }
    }

    return '#6b7280';
}
