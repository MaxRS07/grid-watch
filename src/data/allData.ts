export interface Player {
  id: string
  name: string
  title: Title
  team: Team
  roles: any[]
  externalLinks: ExternalLink[]
  updatedAt: string
}
export interface Team {
  id: string
  name: string
  colorPrimary: string
  colorSecondary: string
}

export interface Title {
  id: string
  name: string
  nameShortened: string
}

export interface DataProvider {
  name: string
  description: string
}

export interface ExternalEntity {
  id: string
}

export interface Team {
  id: string;
  name: string;
  colorPrimary: string;
  colorSecondary: string;
  logoUrl: string;
  externalLinks: ExternalLink[];
  won?: boolean;
};

type ExternalLink = {
  dataProvider: { name: string };
  externalEntity: { id: string };
};

export type Tournament = {
  id: string;
  name: string;
  nameShortened: string;
};

export interface Series {
  title: {
    id: string;
    name: string
    nameShortened: string;
  }
  id: string;
  tournamentName: string;
  startTimeScheduled: string; // ISO string
  format: {
    name: string;
    nameShortened: string;
  };
  players: string[];
  streams: string[];
  teams: {
    baseInfo: {
      id: string;
      name: string;
    };
    scoreAdvantage: number;
  }[];
}
const headers = {
  'Accept': 'application/json',
  'x-api-key': 'WdrthAd3IiygDPtU55ByeInh1b25V1Wmp4SOVuiC'
};

const res = fetch('https://api.grid.gg/file-download/end-state/grid/series/2653979',
  {
    method: 'GET',

    headers: headers
  })
res.then(o => console.log(o.text()));

const enum TitleID {
  CS2 = 28,
  DOTA2 = 2,
  LeagueOfLegends = 3,
  MLBB = 11,
  PUBG = 4,
  RainbowSixSiege = 25,
  Standoff2 = 32,
  VALORANT = 6
}
