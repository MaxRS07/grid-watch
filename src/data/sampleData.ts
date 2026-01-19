import { PlayerStats, MatchHistory, WeaponStats } from '@/types/player';

export const samplePlayer: PlayerStats = {
  id: '1',
  name: 'Shadow Striker',
  rank: 'Diamond III',
  winRate: 64.5,
  gamesPlayed: 342,
  kills: 4821,
  deaths: 3102,
  assists: 1893,
  kda: 2.16,
  averageDamage: 3245,
  headshotPercentage: 42.8,
  accuracyPercentage: 38.2,
};

export const sampleMatches: MatchHistory[] = [
  {
    id: '1',
    date: '2 hours ago',
    result: 'win',
    score: '13-9',
    kills: 24,
    deaths: 16,
    assists: 8,
    mapName: 'Dust II',
  },
  {
    id: '2',
    date: '5 hours ago',
    result: 'win',
    score: '13-11',
    kills: 21,
    deaths: 18,
    assists: 12,
    mapName: 'Mirage',
  },
  {
    id: '3',
    date: '1 day ago',
    result: 'loss',
    score: '9-13',
    kills: 18,
    deaths: 20,
    assists: 6,
    mapName: 'Inferno',
  },
  {
    id: '4',
    date: '1 day ago',
    result: 'win',
    score: '13-7',
    kills: 27,
    deaths: 14,
    assists: 9,
    mapName: 'Vertigo',
  },
  {
    id: '5',
    date: '2 days ago',
    result: 'loss',
    score: '11-13',
    kills: 19,
    deaths: 21,
    assists: 11,
    mapName: 'Nuke',
  },
];

export const sampleWeapons: WeaponStats[] = [
  {
    name: 'AK-47',
    kills: 1847,
    accuracy: 42.3,
    headshotRate: 48.5,
  },
  {
    name: 'M4A4',
    kills: 1234,
    accuracy: 39.1,
    headshotRate: 45.2,
  },
  {
    name: 'AWP',
    kills: 892,
    accuracy: 68.7,
    headshotRate: 72.3,
  },
  {
    name: 'Desert Eagle',
    kills: 456,
    accuracy: 28.4,
    headshotRate: 62.8,
  },
];
