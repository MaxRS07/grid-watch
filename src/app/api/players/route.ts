// app/api/players/route.ts
import { Player } from '@/data/allData';
import { NextRequest, NextResponse } from 'next/server';

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql';
const GRID_API_KEY = process.env.GRID_KEY;

if (!GRID_API_KEY) {
    throw new Error("GRID_KEY is not set in your environment variables!");
}

const PLAYER_FIELDS_FRAGMENT = `
  fragment playerFields on Player {
    id
    nickname
    title {
      name
    }
    team {
      id
    }
    updatedAt
  }
`;

const GET_PLAYERS_BY_ID_QUERY = (id: string) => `
    ${PLAYER_FIELDS_FRAGMENT}
    query GetPlayer {
        player(id: "${id}") {
        ...playerFields
        }
    }
`;

const GET_PLAYERS_QUERY = (first: string, after: string | null = null) => `
  ${PLAYER_FIELDS_FRAGMENT}
  query GetPlayers {
    players(first: ${first}, after: ${after ? `"${after}"` : null}) {
      pageInfo {
        endCursor
        startCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      edges {
        node {
          ...playerFields
        }
      }
    }
  }
`;

const GET_PLAYERS_BY_NICKNAME_QUERY = (first: string, nickname: string, after: string | null = null) => `
  ${PLAYER_FIELDS_FRAGMENT}
  query GetPlayersByNickname {
    players(first: ${first}, filter: { nickname: { contains: "${nickname}" } }, after: ${after ? `"${after}"` : null}) {
      pageInfo {
        endCursor
        startCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      edges {
        node {
          ...playerFields
        }
      }
    }
  }
`;

const GET_TEAM_ROSTER_QUERY = (teamId: string) => `
  ${PLAYER_FIELDS_FRAGMENT}
  query GetTeamRoster {
    players(filter: { teamIdFilter: { id: "${teamId}" } }) {
      edges {
        node {
          ...playerFields
            }
        }
      pageInfo {
            hasNextPage
            hasPreviousPage
        }
    }
}
`;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const playerId = searchParams.get('playerId');
        const teamId = searchParams.get('teamId');
        const nickname = searchParams.get('nickname');
        const firstParam = searchParams.get('first');
        const after = searchParams.get('after');

        // Validate and cap first parameter at 50
        const first = Math.min(parseInt(firstParam || '30'), 50);

        let query: string;

        if (playerId) {
            query = GET_PLAYERS_BY_ID_QUERY(playerId);
        } else if (teamId) {
            query = GET_TEAM_ROSTER_QUERY(teamId);
        } else if (nickname) {
            query = GET_PLAYERS_BY_NICKNAME_QUERY(first.toString(), nickname, after);
        } else {
            query = GET_PLAYERS_QUERY(first.toString(), after);
        }

        const res = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': GRID_API_KEY ?? "",
            },
            body: JSON.stringify({ query }),
        });

        const text = await res.text();

        if (!res.ok) {
            return NextResponse.json(
                { error: `GRID API error: ${res.status} - ${text} ` },
                { status: res.status }
            );
        }

        const json = JSON.parse(text);

        // Handle single player response
        if (playerId) {
            if (!json.data.player) {
                return NextResponse.json({ error: 'Player not found' }, { status: 404 });
            }
            const player: Player = {
                id: json.data.player.id,
                name: json.data.player.nickname,
                title: json.data.player.title?.name || '',
                updatedAt: json.data.player.updatedAt,
                teamId: json.data.player.team?.id || '',
            };
            return NextResponse.json(player);
        }

        // Transform GraphQL response with pagination info for multiple players
        const playersData = json.data.players;
        const players: Player[] = playersData.edges.map((edge: any) => ({
            id: edge.node.id,
            name: edge.node.nickname,
            title: edge.node.title?.name || '',
            teamId: edge.node.team?.id || '',
        }));

        // Return response with pagination info
        const response = {
            data: players,
            pageInfo: {
                endCursor: playersData.pageInfo?.endCursor || null,
                startCursor: playersData.pageInfo?.startCursor || null,
                hasNextPage: playersData.pageInfo?.hasNextPage || false,
                hasPreviousPage: playersData.pageInfo?.hasPreviousPage || false,
                totalCount: playersData.totalCount || players.length,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching players from GRID:', error);
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }
}
