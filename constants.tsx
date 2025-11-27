import { 
    Home, Building, Castle, Skull, Tent, Trees, Mountain, Circle, 
    Shield, User, Flag, Swords 
} from 'lucide-react';
import { IconDef, RoadConfig, TerrainConfig } from './types';

export const HEX_SIZE = 30;
export const MAP_WIDTH = 50; 
export const MAP_HEIGHT = 40; 

export const DEFAULT_TERRAINS: Record<string, TerrainConfig> = {
  void: { color: "#f3f4f6", label: "Empty" },
  grass: { color: "#86efac", label: "Grassland" },
  forest: { color: "#166534", label: "Deep Forest" },
  water: { color: "#3b82f6", label: "Water" },
  mountain: { color: "#57534e", label: "Mountain" },
  desert: { color: "#fde047", label: "Desert" },
  swamp: { color: "#581c87", label: "Swamp" },
};

export const ROAD_TYPES: Record<string, RoadConfig> = {
    paved: { label: "Paved Road", color: "#94a3b8", width: 4, dash: "none" },
    trail: { label: "Dirt Trail", color: "#854d0e", width: 3, dash: "4, 4" },
    rail:  { label: "Railroad",   color: "#334155", width: 4, dash: "rail" },
    bridge: { label: "Bridge",    color: "#78350f", width: 6, dash: "bridge" }
};

export const INITIAL_ICONS: IconDef[] = [
  { id: 'none', label: 'None', icon: null, type: 'component' },
  { id: 'village', label: 'Village', icon: Home, type: 'component' },
  { id: 'town', label: 'Town', icon: Building, type: 'component' },
  { id: 'city', label: 'City', icon: Castle, type: 'component' },
  { id: 'ruin', label: 'Ruins', icon: Skull, type: 'component' },
  { id: 'camp', label: 'Camp', icon: Tent, type: 'component' },
  { id: 'tree', label: 'Tree', icon: Trees, type: 'component' },
  { id: 'peak', label: 'Peak', icon: Mountain, type: 'component' },
  { id: 'cave', label: 'Cave', icon: Circle, type: 'component' },
];

export const EMOJI_PRESETS = [
    "🐉", "👺", "👻", "💀", "🧟", "🧙", "🧚", "🧛", // Monsters
    "👑", "⚔️", "🛡️", "🏹", "🧪", "📜", "💎", "💰", // Items
    "🐺", "🐻", "🦅", "🐎", "🕷️", "🐀", "🦂", "🐍", // Animals
    "🌲", "🍄", "🌵", "🌋", "🌊", "🌪️", "❄️", "🔥", // Nature
    "🏰", "🛖", "⛺", "🌉", "🏛️", "🏚️", "⚓", "⛩️", "🧱" // Structures
];

export const PARTY_ICONS = [
  { id: 'shield', label: 'Shield', icon: Shield },
  { id: 'user', label: 'Hero', icon: User },
  { id: 'flag', label: 'Banner', icon: Flag },
  { id: 'swords', label: 'Battle', icon: Swords },
];

export const TOOLS = {
  SELECT: 'select',
  PAINT: 'paint',
  ICON: 'icon',
  PARTY: 'party',
  MAGIC: 'magic'
};