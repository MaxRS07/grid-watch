export interface PlayerStats {
  id: string;
  name: string;
  rank: string;
  winRate: number;
  gamesPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  averageDamage: number;
  headshotPercentage: number;
  accuracyPercentage: number;
}

export interface MatchHistory {
  id: string;
  date: string;
  result: 'win' | 'loss';
  score: string;
  kills: number;
  deaths: number;
  assists: number;
  mapName: string;
}

export interface WeaponStats {
  name: string;
  kills: number;
  accuracy: number;
  headshotRate: number;
}
