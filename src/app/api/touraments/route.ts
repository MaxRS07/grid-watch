// app/api/tournaments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Tournament } from '@/data/allData';

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql';
const GRID_API_KEY = process.env.GRID_KEY!;

if (!GRID_API_KEY) {
    throw new Error('GRID_KEY is not set in your environment variables!');
}

const TOURNAMENT_FIELDS = `
  fragment tournamentFields on Tournament {
    id
    name
    nameShortened
  }
`;

const GET_TOURNAMENT_BY_ID = (id: string) => `
  ${TOURNAMENT_FIELDS}
  query {
    tournament(id: "${id}") {
      ...tournamentFields
    }
  }
`;

const GET_TOURNAMENTS = `
  ${TOURNAMENT_FIELDS}
  query {
    tournaments {
      totalCount
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          ...tournamentFields
        }
      }
    }
  }
`;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        const query = id ? GET_TOURNAMENT_BY_ID(id) : GET_TOURNAMENTS;

        const res = await fetch(GRID_API_URL, {
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
                { error: `GRID API error: ${res.status} - ${text}` },
                { status: res.status }
            );
        }

        const json = JSON.parse(text);

        // Single tournament
        if (id) {
            const tournament: Tournament | null = json.data.tournament;
            return NextResponse.json(tournament);
        }

        // Multiple tournaments
        const tournaments: Tournament[] = json.data.tournaments.edges.map(
            (edge: any) => edge.node
        );

        return NextResponse.json({
            totalCount: json.data.tournaments.totalCount,
            pageInfo: json.data.tournaments.pageInfo,
            tournaments,
        });
    } catch (error) {
        console.error('Error fetching tournaments from GRID:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tournaments' },
            { status: 500 }
        );
    }
}
