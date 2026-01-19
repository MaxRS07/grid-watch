import { SeriesState } from '@/types/series-stats';
import { NextRequest, NextResponse } from 'next/server';

const GRID_API_URL = 'https://api-op.grid.gg/live-data-feed/series-state/graphql';
const GRID_API_KEY = process.env.GRID_KEY!;

if (!GRID_API_KEY) {
    throw new Error("GRID_KEY is not set in your environment variables!");
}

const SERIES_STATE_QUERY = (seriesId: string) => `
  query GetSeriesState {
    seriesState(id: "${seriesId}") {
      valid
      updatedAt
      format
      started
      finished
      teams {
        id
        name
        won
      }
      games {
        sequenceNumber
        teams {
          id
          name
          players {
            id
            name
            kills
            deaths
            netWorth
            money
            abilities {
              id
              name
              ready
            }
            teamkills
            selfkills
            unitKills {
              id
              count
              unitName
            }
            multikills {
              id
              count
              numberOfKills
            }
            weaponKills {
              id
              count
              weaponName
            }
            loadoutValue
            weaponTeamkills {
              id
              count
              weaponName
            }
            killAssistsGiven
            teamkillAssistsReceived
            killAssistsReceivedFromPlayer {
              id
              playerId
              killAssistsReceived
            }
            teamkillAssistsReceivedFromPlayer {
              id
              playerId
              teamkillAssistsReceived
            }
            inventory {
              items {
                id
                name
                stashed
                quantity
                equipped
              }
            }
            character {
              id
              name
            }
            position {
              x
              y
            }
          }
        }
      }
    }
  }
`;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const seriesId = searchParams.get('seriesId');

        if (!seriesId) {
            return NextResponse.json(
                { error: 'Missing seriesId parameter' },
                { status: 400 }
            );
        }

        const res = await fetch(GRID_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': GRID_API_KEY,
            },
            body: JSON.stringify({
                query: SERIES_STATE_QUERY(seriesId),
            }),
        });

        const text = await res.text();

        if (!res.ok) {
            return NextResponse.json(
                { error: `GRID API error: ${res.status} - ${text}` },
                { status: res.status }
            );
        }

        const json = JSON.parse(text);

        if (json.errors) {
            return NextResponse.json(
                { error: `GraphQL error: ${JSON.stringify(json.errors)}` },
                { status: 400 }
            );
        }

        return NextResponse.json(json.data.seriesState);
    } catch (error) {
        console.error('Error fetching series stats from GRID:', error);
        return NextResponse.json(
            { error: 'Failed to fetch series statistics' },
            { status: 500 }
        );
    }
}
