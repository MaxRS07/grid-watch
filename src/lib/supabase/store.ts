// =========================
// Types
// =========================
export type PlayerReportRequest = {
    player_id: string;
    time_window: string;       // '3M', '6M', '1Y', 'ALL'
    report_text: string;
    model: string;
    prompt_version: string;
    series_count: number;
    last_series_date: string;  // ISO string
};

export type PlayerReport = PlayerReportRequest & {
    id?: string;
    created_at?: string;
};

export type StoreResponse<T = any> = {
    success?: boolean;
    error?: string;
    data?: T;
    cached?: boolean;
};

// =========================
// Fetch a player report from Supabase (unique per player_id + time_window)
// =========================
export async function getPlayerReport(
    playerId: string,
    timeWindow: string
): Promise<StoreResponse<PlayerReport>> {
    try {
        const params = new URLSearchParams();
        params.set('playerId', playerId);
        params.set('timeWindow', timeWindow);

        const response = await fetch(
            `/api/supabase?${params.toString()}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return {
                success: false,
                error: error.error || `HTTP ${response.status}`,
            };
        }

        const result = await response.json();
        // Result is an array, but should contain at most one report
        const report = Array.isArray(result) ? result[0] : result;
        return {
            success: true,
            data: report as PlayerReport,
        };
    } catch (error) {
        console.error('[Store] Failed to fetch player report:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// =========================
// Save a player analysis report to Supabase
// =========================
export async function savePlayerReport(
    data: PlayerReportRequest
): Promise<StoreResponse<PlayerReport>> {
    try {
        const response = await fetch('/api/supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return {
                success: false,
                error: error.error || `HTTP ${response.status}`,
            };
        }

        const result = await response.json();
        return {
            success: true,
            data: result as PlayerReport,
        };
    } catch (error) {
        console.error('[Store] Failed to save player report:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// =========================
// Create a player report request object
// =========================
export function createPlayerReportRequest(
    playerId: string,
    timeWindow: string,
    reportText: string,
    seriesCount: number,
    lastSeriesDate: string,
    model: string = 'gemini-2.5-flash-lite',
    promptVersion: string = '1.0'
): PlayerReportRequest {
    return {
        player_id: playerId,
        time_window: timeWindow,
        report_text: reportText,
        model,
        prompt_version: promptVersion,
        series_count: seriesCount,
        last_series_date: lastSeriesDate,
    };
}

