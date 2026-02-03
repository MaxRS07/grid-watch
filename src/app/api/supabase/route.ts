import { createClient } from '@supabase/supabase-js';
import pako from 'pako';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Request body for POST
type PlayerReportRequest = {
    player_id: string;
    time_window: string;
    report_text: string;
    model: string;
    prompt_version: string;
    series_count: number;
    last_series_date: string;
};

// Series events cache request
type SeriesEventsRequest = {
    type: 'series_events';
    series_id: string;
    events: any[];
    event_count: number;
};

// Returned report type
type PlayerReport = PlayerReportRequest & {
    generatedAt: string;
};


/**
 * GET /api/supabase?playerId=xxx&timeWindow=xxx
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const playerId = url.searchParams.get('playerId');
        const timeWindow = url.searchParams.get('timeWindow');

        if (!playerId) {
            return Response.json(
                { error: 'playerId is required' },
                { status: 400 }
            );
        }

        let query = supabase
            .from('player_reports')
            .select('*')
            .eq('player_id', playerId);

        if (timeWindow) {
            query = query.eq('time_window', timeWindow);
        }

        const { data, error } = await query;

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json(data);
    } catch (error) {
        return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/supabase
 * Save player report
 */
export async function POST(req: Request) {
    try {
        const body = await req.json() as PlayerReportRequest;

        // Validate required fields
        if (!body.player_id || !body.time_window || !body.report_text) {
            return Response.json(
                { error: 'player_id, time_window, and report_text are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('player_reports')
            .insert([
                {
                    player_id: body.player_id,
                    time_window: body.time_window,
                    report_text: body.report_text,
                    model: body.model,
                    prompt_version: body.prompt_version,
                    series_count: body.series_count,
                    last_series_date: body.last_series_date,
                }
            ])
            .select();

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json(data[0], { status: 201 });
    } catch (error) {
        return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
