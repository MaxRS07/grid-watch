export interface Player {
  id: string;
  name: string;
  title: string;
  teamId: string;
  updatedAt?: string;
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
  id: string;
  name: string;
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
