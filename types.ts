import { ComponentType } from 'react';
import { LucideProps } from 'lucide-react';

export interface TerrainConfig {
    color: string;
    label: string;
}

export interface RoadConfig {
    label: string;
    color: string;
    width: number;
    dash: string;
}

export interface IconDef {
    id: string;
    label: string;
    icon: ComponentType<LucideProps> | string | null; // Lucide component or emoji string
    type: 'component' | 'text';
}

export interface HexData {
    terrain: string;
    icon: string;
    roads: Record<string, string>; // neighborId -> roadType
    regionId: string | null;
    lore: string;
}

export interface TableEntry {
    range: [number, number];
    result: string;
}

export interface Region {
    name: string;
    color: string;
    freqConfig: {
        die: string;
        triggerValues: number[];
    };
    diceConfig: {
        count: number;
        faces: number;
    };
    table: TableEntry[];
    lore?: string;
}

export interface LogEntry {
    id: string | number;
    text: string;
    type: 'info' | 'alert' | 'warning' | 'error' | 'success';
    time: Date;
}

export interface Point {
    x: number;
    y: number;
}

export interface HexCoord {
    q: number;
    r: number;
}