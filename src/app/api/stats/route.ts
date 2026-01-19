// app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GRID_STATS_API_URL = 'https://api-op.grid.gg/statistics-feed/graphql';
const GRID_API_KEY = process.env.GRID_KEY!;

if (!GRID_API_KEY) {
  throw new Error("GRID_KEY is not set in your environment variables!");
}

export type TimeWindow = 'WEEK' | 'MONTH' | '3_MONTHS' | '6_MONTHS' | "YEAR";
// GraphQL queries
const TEAM_STATS = (teamId: string, timeWindow: TimeWindow = '3_MONTHS') => `
  query {
    teamStatistics(teamId: "${teamId}", filter: { timeWindow: LAST_${timeWindow} }) {
      id
      aggregationSeriesIds
      series {
        count
        kills { sum min max avg }
      }
      game {
        count
        wins {
          value
          count
          percentage
          streak { min max current }
        }
      }
      segment {
        type
        count
        deaths { sum min max avg }
      }
    }
  }
`;

const TEAM_STATS_TOURNAMENTS = (teamId: string, tournamentIds: string[]) => `
  query {
    teamStatistics(teamId: "${teamId}", filter: { tournamentIds: { in: [${tournamentIds.map(id => `"${id}"`).join(', ')}] } }) {
      id
      aggregationSeriesIds
      series {
        count
        kills { sum min max avg }
      }
      game {
        count
        wins {
          value
          count
          percentage
          streak { min max current }
        }
      }
      segment {
        type
        count
        deaths { sum min max avg }
      }
    }
  }
`;

const PLAYER_STATS = (playerId: string, timeWindow: TimeWindow) => `
  query {
    playerStatistics(playerId: "${playerId}", filter: { timeWindow: LAST_${timeWindow} }) {
      id
      aggregationSeriesIds
      series { count kills { sum min max avg } }
      game {
        count
        wins {
          value count percentage streak { min max current }
        }
      }
      segment { type count deaths { sum min max avg } }
    }
  }
`;

const PLAYER_STATS_TOURNAMENTS = (playerId: string, tournamentIds: string[]) => `
  query {
    playerStatistics(playerId: "${playerId}", filter: { tournamentIds: { in: [${tournamentIds.map(id => `"${id}"`).join(', ')}] } }) {
      id
      aggregationSeriesIds
      series { count kills { sum min max avg } }
      game {
        count
        wins { value count percentage streak { min max current } }
      }
      segment { type count deaths { sum min max avg } }
    }
  }
`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('type'); // 'team' or 'player'
    const id = searchParams.get('id');           // teamId or playerId
    const timeWindowParam = searchParams.get('timeWindow');
    const tournamentIds = searchParams.get('tournaments'); // comma-separated string

    if (!entityType || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    // Validate timeWindow if provided
    let timeWindow: TimeWindow = '3_MONTHS';
    if (timeWindowParam) {
      const validTimeWindows: TimeWindow[] = ['WEEK', 'MONTH', '3_MONTHS', '6_MONTHS', 'YEAR'];
      if (!validTimeWindows.includes(timeWindowParam as TimeWindow)) {
        return NextResponse.json(
          { error: `Invalid timeWindow. Must be one of: ${validTimeWindows.join(', ')}` },
          { status: 400 }
        );
      }
      timeWindow = timeWindowParam as TimeWindow;
    }

    // Select query
    let query = '';
    if (entityType === 'team') {
      if (timeWindowParam) query = TEAM_STATS(id, timeWindow);
      else if (tournamentIds) query = TEAM_STATS_TOURNAMENTS(id, tournamentIds.split(','));
      else query = TEAM_STATS(id, '3_MONTHS'); // default to 3 months
    } else if (entityType === 'player') {
      if (timeWindowParam) query = PLAYER_STATS(id, timeWindow);
      else if (tournamentIds) query = PLAYER_STATS_TOURNAMENTS(id, tournamentIds.split(','));
      else query = PLAYER_STATS(id, '3_MONTHS'); // default to 3 months
    }

    if (!query) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    const res = await fetch(GRID_STATS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GRID_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: `GRID Stats API error: ${res.status} - ${text}` },
        { status: res.status }
      );
    }

    const json = JSON.parse(text);
    return NextResponse.json(json.data);
  } catch (error) {
    console.error('Error fetching stats from GRID:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
