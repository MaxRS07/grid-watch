import { Series } from '@/data/allData';
import { NextRequest, NextResponse } from 'next/server';

const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql';
const GRID_API_KEY = process.env.GRID_KEY!;

const SERIES_FIELDS_FRAGMENT = `
  fragment seriesFields on Series {
    id
    title { nameShortened }
    tournament { nameShortened }
    startTimeScheduled
    format {
      name
      nameShortened
    }
    teams {
      baseInfo {
        id
        name
      }
      scoreAdvantage
    }
  }
`;

interface SeriesFilter {
    live?: boolean;
    teamId?: string;
    titleId?: string;
    gameIdByExternalId?: string;
    tournamentIdByExternalId?: string;
    seriesIdByExternalId?: string;
    dataProviderName?: string;
    livePlayerIds?: string[];
    startDate?: string;
    endDate?: string;
}

const buildFilterObject = (filters: SeriesFilter): string => {
    const filterParts: string[] = [];

    if (filters.live !== undefined) {
        filterParts.push(`live: ${filters.live}`);
    }

    if (filters.teamId) {
        filterParts.push(`teamId: "${filters.teamId}"`);
    }

    if (filters.titleId) {
        filterParts.push(`titleId: "${filters.titleId}" }`);
    }

    if (filters.gameIdByExternalId) {
        filterParts.push(`gameIdByExternalId: "${filters.gameIdByExternalId}"`);
    }

    if (filters.tournamentIdByExternalId) {
        filterParts.push(`tournamentIdByExternalId: "${filters.tournamentIdByExternalId}"`);
    }

    if (filters.seriesIdByExternalId) {
        filterParts.push(`seriesIdByExternalId: "${filters.seriesIdByExternalId}"`);
    }

    if (filters.dataProviderName) {
        filterParts.push(`dataProviders: { name: "${filters.dataProviderName}" }`);
    }

    if (filters.livePlayerIds) {
        filterParts.push(`livePlayerIds: { in: [${filters.livePlayerIds.join(', ')}]`);
    }

    if (filters.startDate || filters.endDate) {
        const dateFilter: string[] = [];
        if (filters.startDate) {
            dateFilter.push(`gte: "${filters.startDate}"`);
        }
        if (filters.endDate) {
            dateFilter.push(`lte: "${filters.endDate}"`);
        }
        if (dateFilter.length > 0) {
            filterParts.push(`startTimeScheduled: { ${dateFilter.join(', ')} }`);
        }
    }

    return filterParts.length > 0 ? `filter: { ${filterParts.join(', ')} }` : '';
};
const GET_SERIES_BY_ID_QUERY = (id: string) => `
    ${SERIES_FIELDS_FRAGMENT}
    query GetSeries {
    series(id: "${id}") {
        ...seriesFields
    }
}`;
const GET_SERIES_QUERY = (filters: SeriesFilter) => {
    const filterString = buildFilterObject(filters);

    return `
    ${SERIES_FIELDS_FRAGMENT}

    query GetSeries {
      allSeries(
        ${filterString}
        orderBy: StartTimeScheduled
      ) {
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
            ...seriesFields
          }
        }
      }
    }
  `;
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const seriesId = searchParams.get('seriesId');

    // If seriesId is provided, fetch single series by ID
    if (seriesId) {
        try {
            const res = await fetch(GRID_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': `${GRID_API_KEY}`,
                },
                body: JSON.stringify({
                    query: GET_SERIES_BY_ID_QUERY(seriesId),
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                return NextResponse.json(
                    { error: `GRID API error: ${res.status} - ${text}` },
                    { status: res.status }
                );
            }

            const json = await res.json();

            if (json.errors) {
                return NextResponse.json(
                    { error: `GraphQL error: ${JSON.stringify(json.errors)}` },
                    { status: 400 }
                );
            }

            const node = json.data.series;

            const series: Series = {
                id: node.id,
                name: node.title?.nameShortened,
                tournamentName: node.tournament?.nameShortened,
                startTimeScheduled: node.startTimeScheduled,
                format: node.format,
                teams: node.teams.map((t: any) => ({
                    baseInfo: {
                        id: t.baseInfo.id,
                        name: t.baseInfo.name,
                    },
                    scoreAdvantage: t.scoreAdvantage,
                })),
                players: node.players,
                streams: node.streams,
            };

            return NextResponse.json(series);
        } catch (error) {
            console.error('Error fetching series from GRID:', error);
            return NextResponse.json(
                { error: 'Failed to fetch series' },
                { status: 500 }
            );
        }
    }

    // Build filters for allSeries query
    const filters: SeriesFilter = {};

    if (searchParams.has('live')) {
        filters.live = searchParams.get('live') === 'true';
    }

    // Parse ID filters
    if (searchParams.has('teamId')) {
        filters.teamId = searchParams.get('teamId') || undefined;
    }

    if (searchParams.has('titleId')) {
        filters.titleId = searchParams.get('titleId') || undefined;
    }

    if (searchParams.has('livePlayerIds')) {
        filters.livePlayerIds = searchParams.get('livePlayerIds')?.split(',') || undefined;
    }

    // Parse external ID filters
    if (searchParams.has('gameIdByExternalId')) {
        filters.gameIdByExternalId = searchParams.get('gameIdByExternalId') || undefined;
    }

    if (searchParams.has('tournamentIdByExternalId')) {
        filters.tournamentIdByExternalId = searchParams.get('tournamentIdByExternalId') || undefined;
    }

    if (searchParams.has('seriesIdByExternalId')) {
        filters.seriesIdByExternalId = searchParams.get('seriesIdByExternalId') || undefined;
    }

    // Parse provider filter
    if (searchParams.has('dataProviderName')) {
        filters.dataProviderName = searchParams.get('dataProviderName') || undefined;
    }

    // Parse date filters
    if (searchParams.has('startDate')) {
        const startDateStr = searchParams.get('startDate');
        if (startDateStr) {
            const startDate = new Date(parseInt(startDateStr));
            filters.startDate = startDate.toISOString();
        }
    }

    if (searchParams.has('endDate')) {
        const endDateStr = searchParams.get('endDate');
        if (endDateStr) {
            const endDate = new Date(parseInt(endDateStr));
            filters.endDate = endDate.toISOString();
        }
    }

    // If no filters provided, set default date range (last 7 days)
    if (Object.keys(filters).length === 0) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filters.startDate = sevenDaysAgo.toISOString();
        filters.endDate = now.toISOString();
    }

    try {
        const res = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': `${GRID_API_KEY}`,
            },
            body: JSON.stringify({
                query: GET_SERIES_QUERY(filters),
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json(
                { error: `GRID API error: ${res.status} - ${text}` },
                { status: res.status }
            );
        }

        const json = await res.json();

        if (json.errors) {
            return NextResponse.json(
                { error: `GraphQL error: ${JSON.stringify(json.errors)}` },
                { status: 400 }
            );
        }

        const series: Series[] = json.data.allSeries.edges.map((edge: any) => ({
            id: edge.node.id,
            name: edge.node.title?.nameShortened,
            tournamentName: edge.node.tournament?.nameShortened,
            startTimeScheduled: edge.node.startTimeScheduled,
            format: edge.node.format,
            teams: edge.node.teams.map((t: any) => ({
                baseInfo: {
                    id: t.baseInfo.id,
                    name: t.baseInfo.name,
                },
                scoreAdvantage: t.scoreAdvantage,
            })),
        }));

        return NextResponse.json(series);
    } catch (error) {
        console.error('Error fetching series from GRID:', error);
        return NextResponse.json(
            { error: 'Failed to fetch series' },
            { status: 500 }
        );
    }
}
