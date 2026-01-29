export type StatSeries = {
    count: number;
    kills: { sum: number; min: number; max: number; avg: number };
};

export type GameWins = {
    value: boolean;
    count: number;
    percentage: number;
    streak: { min: number; max: number; current: number };
};

export type Game = {
    count: number;
    wins: GameWins[];
};

export type Segment = {
    type: string;
    count: number;
    deaths: { sum: number; min: number; max: number; avg: number };
};

export type PlayerStats = {
    id: string;
    aggregationSeriesIds: string[];
    series: StatSeries;
    game: Game;
    segment: Segment[];
};