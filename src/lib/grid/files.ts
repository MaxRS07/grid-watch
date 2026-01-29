import { DownloadList } from "@/types/file";
import { getCachedData } from "../cache";
import JSZip from "jszip";
import { EventRecord } from "./seriesAnalysis";

export async function getSeriesFile(seriesId: string, fileType: 'end-state' | 'events', onProgress?: (loaded: number, total: number) => void): Promise<EventRecord[]> {
    return getCachedData(
        `series-files:${seriesId}`,
        async () => {
            const res = await fetch(`/api/files?seriesId=${seriesId}&fileType=${fileType}&download=true`);
            if (!res.ok) {
                throw new Error(await res.text());
            }

            const zipBuffer = await res.arrayBuffer();
            const zip = await JSZip.loadAsync(zipBuffer);

            const events: EventRecord[] = [];

            for (const [filename, file] of Object.entries(zip.files)) {
                if (file.dir || !filename.endsWith(".jsonl")) continue;

                const content = await file.async("text");
                const lines = content.split("\n")
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const raw: EventRecord = JSON.parse(line);
                        events.push(raw);
                        onProgress?.(events.length, lines.length);
                    } catch {
                        // ignore malformed lines
                    }
                }
            }

            events.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
            return events;
        },
        10 * 60 * 1000
    );
}

export async function getSeriesFileList(series_id: string): Promise<DownloadList> {
    return getCachedData(
        `series-file-list:${series_id}`,
        async () => {
            const res = await fetch(`/api/files?seriesId=${series_id}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Backend API error: ${res.status} - ${text}`);
            }

            return await res.json();
        },
        10 * 60 * 1000 // Cache for 10 minutes
    );
}