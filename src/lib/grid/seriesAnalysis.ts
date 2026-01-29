// event-analysis.ts
// Utilities to analyze GRID JSONL event records

import { EventActor } from "@/types/fileStats";
import { Series } from "@/data/allData";
import { getSeriesFile, getSeriesFileList } from "./files";

export type EventRecord = {
    correlationId: string;
    occurredAt: string; // ISO string
    sequenceNumber: number;
    events: any[];
};

export type FlatEvent = {
    ts: number;
    type: string;
    correlationId: string;
    sequenceNumber: number;
    payload: any;
};

/**
 * Flattens record-level events into a single event stream
 */
export function flattenEvents(records: EventRecord[]): FlatEvent[] {
    const out: FlatEvent[] = [];

    for (const record of records) {
        for (const event of record.events ?? []) {
            out.push({
                ts: Date.parse(record.occurredAt),
                type: event.type ?? 'unknown',
                correlationId: record.correlationId,
                sequenceNumber: record.sequenceNumber,
                payload: event,
            });
        }
    }

    return out.sort((a, b) => a.ts - b.ts || a.sequenceNumber - b.sequenceNumber);
}

export function flattenEventsWithProgress(
    records: EventRecord[],
    onProgress: (processed: number, total: number) => void
): FlatEvent[] {
    const out: FlatEvent[] = [];
    const totalRecords = records.length;
    let processedRecords = 0;

    for (const record of records) {
        for (const event of record.events ?? []) {
            out.push({
                ts: Date.parse(record.occurredAt),
                type: event.type ?? 'unknown',
                correlationId: record.correlationId,
                sequenceNumber: record.sequenceNumber,
                payload: event,
            });
        }
        processedRecords++;
        onProgress(processedRecords, totalRecords);
    }

    return out.sort((a, b) => a.ts - b.ts || a.sequenceNumber - b.sequenceNumber);
}

/**
 * Counts events by type
 */
export function countByType(events: FlatEvent[]) {
    return events.reduce<Record<string, number>>((acc, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1;
        return acc;
    }, {});
}

/**
 * Groups events by correlationId
 */
export function groupByCorrelation(events: FlatEvent[]) {
    return events.reduce<Record<string, FlatEvent[]>>((acc, e) => {
        (acc[e.correlationId] ??= []).push(e);
        return acc;
    }, {});
}

/**
 * Returns event timeline buckets (per minute by default)
 */
export function eventsOverTime(events: FlatEvent[], bucketMs = 60_000) {
    const buckets = new Map<number, number>();

    for (const e of events) {
        const bucket = Math.floor(e.ts / bucketMs) * bucketMs;
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }

    return [...buckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([ts, count]) => ({ ts, count }));
}

/**
 * Finds longest correlation chains (useful for complex actions)
 */
export function longestCorrelationChains(events: FlatEvent[], topN = 10) {
    const grouped = groupByCorrelation(events);

    return Object.entries(grouped)
        .map(([correlationId, evts]) => ({
            correlationId,
            count: evts.length,
            start: evts[0].ts,
            end: evts[evts.length - 1].ts,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, topN);
}

/**
 * Extracts high-level match stats (kills, objectives, wins)
 */
export function extractGameStats(events: FlatEvent[]) {
    const stats = {
        kills: 0,
        objectives: 0,
        gamesStarted: 0,
        gamesEnded: 0,
    };

    for (const e of events) {
        if (e.type.includes('killed-player')) stats.kills++;
        if (e.type.includes('completed-slay') || e.type.includes('destroy')) stats.objectives++;
        if (e.type === 'series-started-game') stats.gamesStarted++;
        if (e.type === 'series-ended-game') stats.gamesEnded++;
    }

    return stats;
}

/**
 * High-level entry point for analysis
 */
export function analyze(records: EventRecord[]) {
    const flat = flattenEvents(records);

    return {
        totalRecords: records.length,
        totalEvents: flat.length,
        byType: countByType(flat),
        timeline: eventsOverTime(flat),
        longestCorrelations: longestCorrelationChains(flat),
        gameStats: extractGameStats(flat),
    };
}

export function getEventActor(event: FlatEvent): EventActor | null {
    const payload = event.payload;
    if (payload?.actor) {
        const actor: EventActor = payload.actor;
        return actor;
    }
    return null;
}
export function getEventTarget(event: FlatEvent): EventActor | null {
    const payload = event.payload;
    if (payload?.target) {
        const target: EventActor = payload.target;
        return target;
    }
    return null;
}
/** * Returns [name, id]
 */
export function getWinningTeam(event: FlatEvent): { name: string, id: string } | null {
    const payload = event.payload;
    if (payload?.target.type === "round" || payload?.target.type === "game") {
        const teams = payload.target.state.teams;
        if (teams) {
            const winner = teams.find((team: any) => team.won);
            const name = winner?.name;
            const id = winner?.id;
            return name && id ? { name, id } : null;
        }
    }
    return null;
}

/**
 * Load series events sequentially with progress callback
 */
export async function loadSeriesEventsWithProgress(
    seriesList: Series[],
    onProgress: (loaded: number, total: number, status?: string, fileName?: string, eventCount?: number, totalEvents?: number) => void
): Promise<Record<string, FlatEvent[]>> {
    const result: Record<string, FlatEvent[]> = {};
    let loaded = 0;

    for (const series of seriesList) {
        const seriesName = series.title?.name + " - " + series.tournamentName;

        try {
            // Download file list
            onProgress(loaded, seriesList.length, `Downloading file list for series: ${seriesName}`);
            const fileList = await getSeriesFileList(series.id);
            const eventFile = fileList.files.find((file) => file.id.startsWith('events-grid'));

            if (eventFile) {
                // Download file
                onProgress(loaded, seriesList.length, `Downloading file for series: ${seriesName}`);
                const data = await getSeriesFile(series.id, 'events');

                // Extract events
                onProgress(loaded, seriesList.length, `Extracting events from series: ${seriesName}`);
                const events = flattenEvents(data);
                result[series.id] = events;

                // Get total event count from the raw data
                const totalEventCount = (data as EventRecord[]).reduce((sum, record) => sum + (record.events?.length || 0), 0);
                onProgress(loaded + 1, seriesList.length, `Completed: ${seriesName}`, seriesName, events.length, totalEventCount);
            }
        } catch (error) {
            console.error(`Error fetching events file data for series ${series.id}:`, error);
            onProgress(loaded + 1, seriesList.length, `Failed to load: ${seriesName}`, seriesName, 0, 0);
        }

        loaded++;
    }

    return result;
}