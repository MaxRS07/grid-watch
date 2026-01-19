// app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/data/allData';

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql';
const GRID_API_KEY = process.env.GRID_KEY!;

if (!GRID_API_KEY) {
  throw new Error("GRID_KEY is not set in your environment variables!");
}

const TEAM_FIELDS_FRAGMENT = `
  fragment teamFields on Team {
    id
    name
    colorPrimary
    colorSecondary
    logoUrl
    externalLinks {
      dataProvider {
        name
      }
      externalEntity {
        id
      }
    }
  }
`;

const GET_TEAM_BY_ID_QUERY = (id: string) => `
  ${TEAM_FIELDS_FRAGMENT}
  query GetTeam {
    team(id: "${id}") {
      ...teamFields
    }
  }
`;

const GET_TEAMS_QUERY = (first: string, after: string | null = null) => `
  ${TEAM_FIELDS_FRAGMENT}
  query GetTeams {
    teams(first: ${first}, after: ${after ? `"${after}"` : 'null'}) {
      edges {
        node {
          ...teamFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
      totalCount
    }
  }
`;

const GET_TEAMS_BY_NAME_QUERY = (first: string, name: string, after: string | null = null) => `
  ${TEAM_FIELDS_FRAGMENT}
  query GetTeamsByName {
    teams(first: ${first}, filter: { name: { contains: "${name}" } }, after: ${after ? `"${after}"` : 'null'}) {
      edges {
        node {
          ...teamFields
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
      totalCount
    }
  }
`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const name = searchParams.get('name');
    const firstParam = searchParams.get('first');
    const after = searchParams.get('after');

    // Validate and cap first parameter at 50
    const first = Math.min(parseInt(firstParam || '30'), 50);

    let query: string;

    if (teamId) {
      query = GET_TEAM_BY_ID_QUERY(teamId);
    } else if (name) {
      query = GET_TEAMS_BY_NAME_QUERY(first.toString(), name, after);
    } else {
      query = GET_TEAMS_QUERY(first.toString(), after);
    }

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

    if (teamId) {
      // Single team response
      const team = json.data.team;
      return NextResponse.json({
        id: team.id,
        name: team.name,
        colorPrimary: team.colorPrimary,
        colorSecondary: team.colorSecondary,
        logoUrl: team.logoUrl,
        externalLinks: team.externalLinks || [],
      });
    } else {
      // Multiple teams response with pagination
      const teamsData = json.data.teams;
      const teams: Team[] = teamsData.edges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        colorPrimary: edge.node.colorPrimary,
        colorSecondary: edge.node.colorSecondary,
        logoUrl: edge.node.logoUrl,
        externalLinks: edge.node.externalLinks || [],
      }));

      return NextResponse.json({
        data: teams,
        pageInfo: {
          endCursor: teamsData.pageInfo?.endCursor || null,
          startCursor: teamsData.pageInfo?.startCursor || null,
          hasNextPage: teamsData.pageInfo?.hasNextPage || false,
          hasPreviousPage: teamsData.pageInfo?.hasPreviousPage || false,
          totalCount: teamsData.totalCount || teams.length,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching teams from GRID:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}
