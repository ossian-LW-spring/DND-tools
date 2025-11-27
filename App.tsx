import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Save, Upload, Map as MapIcon, Shield, Trees, 
  ChevronRight, ChevronDown, Plus, Trash2, 
  Building, User, Flag, Swords,
  Eraser, X, Footprints as RoadIcon,
  Smile, Train, Home, Undo, Redo, Check, Edit3, Wand,
  Loader2, ImageIcon, Sparkles, Anchor
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

import { 
  HEX_SIZE, MAP_WIDTH, MAP_HEIGHT, DEFAULT_TERRAINS, 
  ROAD_TYPES, INITIAL_ICONS, EMOJI_PRESETS, 
  PARTY_ICONS, TOOLS 
} from './constants';
import { HexUtils } from './utils/hexUtils';
import { HexData, Region, LogEntry, IconDef, TerrainConfig } from './types';
import RegionEditor from './components/RegionEditor';

// --- Types for History ---
interface HistoryState {
    gridData: Record<string, HexData>;
    regions: Record<string, Region>;
    terrains: Record<string, TerrainConfig>;
}

// --- Sub-Components ---

const TerrainCreator = ({ onAdd }: { onAdd: (name: string, color: string) => void }) => {
    const [name, setName] = useState('');
    const [tempColor, setTempColor] = useState('#8b5cf6');
    const [confirmedColor, setConfirmedColor] = useState('#8b5cf6');

    const handleConfirmColor = () => {
        setConfirmedColor(tempColor);
    };

    const handleAdd = () => {
        if (!name.trim()) {
            alert("Please provide a name.");
            return;
        }
        onAdd(name, confirmedColor);
        setName('');
    };

    return (
        <div className="bg-slate-50 p-2 rounded border border-slate-200 mb-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Create Custom Terrain</h4>
            <div className="flex gap-2 mb-2 items-center">
                 <div className="flex items-center gap-1">
                     <input 
                        type="color" 
                        className="h-8 w-8 p-0 border rounded cursor-pointer shrink-0"
                        value={tempColor}
                        onChange={(e) => setTempColor(e.target.value)}
                     />
                     <button 
                        onClick={handleConfirmColor}
                        className="h-8 w-8 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-600"
                        title="Confirm Color"
                     >
                         <Check size={14}/>
                     </button>
                 </div>
                 
                 <div className="flex-1 flex flex-col gap-1">
                     <div className="flex items-center gap-2">
                        {/* Preview of confirmed color */}
                        <div 
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0" 
                            style={{backgroundColor: confirmedColor}}
                            title="Confirmed Color"
                        />
                        <input 
                            type="text"
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                     </div>
                 </div>
            </div>
            <button 
                onClick={handleAdd}
                className="w-full bg-blue-600 text-white text-xs font-bold p-1 rounded hover:bg-blue-700 flex justify-center items-center gap-1"
            >
                <Plus size={12}/> Add Terrain
            </button>
        </div>
    );
};

const TerrainListItem = ({ 
    id, 
    config, 
    isActive, 
    onSelect, 
    onUpdate, 
    onDelete 
}: { 
    id: string, 
    config: TerrainConfig, 
    isActive: boolean, 
    onSelect: () => void, 
    onUpdate: (id: string, config: TerrainConfig) => void, 
    onDelete: (id: string) => void 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(config.label);
    const [editColor, setEditColor] = useState(config.color);

    useEffect(() => {
        setEditName(config.label);
        setEditColor(config.color);
    }, [config]);

    const handleSave = () => {
        if (!editName.trim()) return;
        onUpdate(id, { label: editName, color: editColor });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-2 rounded border border-blue-300 bg-blue-50 flex flex-col gap-2 mb-1">
                 <div className="flex items-center gap-2">
                     <input 
                        type="color" 
                        className="h-6 w-6 p-0 border rounded cursor-pointer shrink-0"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                     />
                     <input 
                        type="text"
                        className="w-full p-1 text-xs border rounded"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                     />
                 </div>
                 <div className="flex gap-2">
                     <button onClick={handleSave} className="flex-1 bg-green-600 text-white text-xs p-1 rounded hover:bg-green-700">Save</button>
                     <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-300 text-slate-700 text-xs p-1 rounded hover:bg-slate-400">Cancel</button>
                 </div>
            </div>
        );
    }

    return (
        <div 
            className={`group w-full flex items-center justify-between p-2 rounded border transition-all mb-1 ${
                isActive ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
            }`}
        >
            <button 
                onClick={onSelect}
                className="flex items-center gap-3 flex-1 overflow-hidden"
            >
                <div className="w-6 h-6 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: config.color }}></div>
                <span className="text-sm font-medium truncate text-left">{config.label}</span>
            </button>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200"
                    title="Edit"
                >
                    <Edit3 size={14} />
                </button>
                {id !== 'void' && (
                    <button 
                        onClick={() => onDelete(id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-200"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default function App() {
  // -- State --
  const [gridData, setGridData] = useState<Record<string, HexData>>({}); 
  const [regions, setRegions] = useState<Record<string, Region>>({}); 
  const [terrains, setTerrains] = useState<Record<string, TerrainConfig>>(DEFAULT_TERRAINS);
  const [availableIcons, setAvailableIcons] = useState<IconDef[]>(INITIAL_ICONS);
  
  // Undo/Redo State
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isDirtyRef = useRef(false);

  // Party State
  const [partyPos, setPartyPos] = useState({ q: 3, r: 3 });
  const [partyIconId, setPartyIconId] = useState('shield');

  // Custom Stamp State
  const [newStampLabel, setNewStampLabel] = useState('');
  const [newStampSymbol, setNewStampSymbol] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  // Magic Tool State
  const [magicPrompt, setMagicPrompt] = useState("");
  const [magicImage, setMagicImage] = useState<string | null>(null);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [shouldClearMap, setShouldClearMap] = useState(true);
  
  // Magic Area State
  const [magicAreaPrompt, setMagicAreaPrompt] = useState("");
  const [isGeneratingArea, setIsGeneratingArea] = useState(false);
  
  // AI Region Gen State
  const [regionAiPrompt, setRegionAiPrompt] = useState("");
  const [isGeneratingRegion, setIsGeneratingRegion] = useState(false);

  // Refs to access latest state in event listeners without dependency cycles
  const gridDataRef = useRef(gridData);
  const regionsRef = useRef(regions);
  const terrainsRef = useRef(terrains);
  const historyIndexRef = useRef(historyIndex);
  const partyPosRef = useRef(partyPos);
  
  // Movement State Refs
  const keysPressedRef = useRef<Set<string>>(new Set());
  const moveIntervalRef = useRef<number | null>(null);
  const isMovingRef = useRef(false);
  const addLogRef = useRef<(text: string) => void>(() => {});

  useEffect(() => { gridDataRef.current = gridData; }, [gridData]);
  useEffect(() => { regionsRef.current = regions; }, [regions]);
  useEffect(() => { terrainsRef.current = terrains; }, [terrains]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);
  useEffect(() => { partyPosRef.current = partyPos; }, [partyPos]);

  // Tool State
  const [activeTool, setActiveTool] = useState(TOOLS.PAINT);
  const [activeTerrain, setActiveTerrain] = useState('grass');
  const [activeIcon, setActiveIcon] = useState('village');
  
  // Selection State (Multi-select support)
  const [selectedHexIds, setSelectedHexIds] = useState<Set<string>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<{q: number, r: number} | null>(null); 
  
  // Selection Drag Helpers
  const selectionSnapshotRef = useRef<Set<string>>(new Set());
  const dragOriginRef = useRef<{q: number, r: number} | null>(null);

  // Interaction State
  const [isMouseDown, setIsMouseDown] = useState(false);
  const lastPathHex = useRef<{q: number, r: number} | null>(null); 
  const [logs, setLogs] = useState<LogEntry[]>([{ id: 'init', text: "Welcome to HexForge.", type: 'info', time: new Date() }]);
  const [toasts, setToasts] = useState<LogEntry[]>([]); 
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null); 

  // Panning State
  const mainRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Ref for encounter routine
  const runEncounterRoutineRef = useRef<((region: Region) => void) | null>(null);

  // -- History Management --
  
  const addToHistory = (newGrid: Record<string, HexData>, newRegions: Record<string, Region>, newTerrains: Record<string, TerrainConfig>) => {
      // Use Ref to get the true current index, ensuring we don't use a stale closure value
      const currentIndex = historyIndexRef.current;
      setHistory(prev => {
          const newHistory = prev.slice(0, currentIndex + 1);
          newHistory.push({ gridData: newGrid, regions: newRegions, terrains: newTerrains });
          return newHistory;
      });
      setHistoryIndex(currentIndex + 1);
  };

  const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
          const prevIdx = historyIndex - 1;
          const prevState = history[prevIdx];
          setGridData(prevState.gridData);
          setRegions(prevState.regions);
          setTerrains(prevState.terrains);
          setHistoryIndex(prevIdx);
          addLog("Undo", "info");
      }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const nextIdx = historyIndex + 1;
          const nextState = history[nextIdx];
          setGridData(nextState.gridData);
          setRegions(nextState.regions);
          setTerrains(nextState.terrains);
          setHistoryIndex(nextIdx);
          addLog("Redo", "info");
      }
  }, [history, historyIndex]);

  // -- Initialization --
  useEffect(() => {
    // Fill initial grid
    const initialGrid: Record<string, HexData> = {};
    for (let r = 0; r < MAP_HEIGHT; r++) {
      for (let q = 0; q < MAP_WIDTH; q++) {
        initialGrid[HexUtils.getHexId(q, r)] = {
          terrain: 'void',
          icon: 'none',
          roads: {}, 
          regionId: null,
          lore: ''
        };
      }
    }
    setGridData(initialGrid);
    
    // Initialize History
    setHistory([{ gridData: initialGrid, regions: {}, terrains: DEFAULT_TERRAINS }]);
    setHistoryIndex(0);
  }, []);

  // Global Event Listeners
  useEffect(() => {
    // Global Mouse Up to stop dragging/panning
    const handleGlobalMouseUp = () => {
        setIsMouseDown(false);
        setIsPanning(false);
        lastPathHex.current = null; // Reset pathing
        
        // Commit history if changes occurred during drag
        if (isDirtyRef.current) {
            addToHistory(gridDataRef.current, regionsRef.current, terrainsRef.current);
            isDirtyRef.current = false;
        }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Keyboard Shortcuts (Undo/Redo & Party Movement)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Undo / Redo
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              if (e.shiftKey) {
                  handleRedo();
              } else {
                  handleUndo();
              }
              return;
          } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              handleRedo();
              return;
          }

          // Party Movement with Key Tracking
          if (activeTool === TOOLS.PARTY) {
              const moveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
              if (moveKeys.includes(e.key)) {
                  e.preventDefault();
                  keysPressedRef.current.add(e.key);
                  
                  // Start movement loop if not running
                  if (!isMovingRef.current) {
                      isMovingRef.current = true;
                      // Input buffering: Wait 70ms before processing to catch simultaneous diagonal presses
                      moveIntervalRef.current = window.setTimeout(gameLoop, 70); 
                  }
              }
          }
      };

      const gameLoop = () => {
          const keys = keysPressedRef.current;
          
          if (keys.size === 0) {
              isMovingRef.current = false;
              return;
          }

          // Calculate Vector
          let dx = 0;
          let dy = 0;
          
          if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx -= 1;
          if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1;
          if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy -= 1;
          if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy += 1;

          // Process move if vector exists
          if (dx !== 0 || dy !== 0) {
             // Clamp for cleaner logic
             dx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
             dy = dy > 0 ? 1 : dy < 0 ? -1 : 0;

             const { q, r } = partyPosRef.current;
             const newPos = HexUtils.getDisplacedHex(q, r, dx, dy);

             // Bounds Check
             if (newPos.q >= 0 && newPos.q < MAP_WIDTH && newPos.r >= 0 && newPos.r < MAP_HEIGHT) {
                  // Only update if changed
                  if (newPos.q !== partyPosRef.current.q || newPos.r !== partyPosRef.current.r) {
                      partyPosRef.current = newPos; 
                      setPartyPos(newPos);
                      
                      // Check for Encounter
                      const targetId = HexUtils.getHexId(newPos.q, newPos.r);
                      const targetHex = gridDataRef.current[targetId];
                      if (targetHex && targetHex.regionId) {
                          const region = regionsRef.current[targetHex.regionId];
                          if (region && runEncounterRoutineRef.current) {
                              runEncounterRoutineRef.current(region);
                          }
                      }
                  }
             }
          }

          // Schedule next tick (150ms for smooth continuous movement)
          moveIntervalRef.current = window.setTimeout(gameLoop, 150);
      };

      const handleKeyUp = (e: KeyboardEvent) => {
          keysPressedRef.current.delete(e.key);
      };

      const handleBlur = () => {
          keysPressedRef.current.clear();
          isMovingRef.current = false;
          if (moveIntervalRef.current) {
              clearTimeout(moveIntervalRef.current);
              moveIntervalRef.current = null;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleBlur);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          window.removeEventListener('blur', handleBlur);
          if (moveIntervalRef.current) clearTimeout(moveIntervalRef.current);
      };
  }, [handleUndo, handleRedo, activeTool]); // Re-bind if activeTool changes


  // -- Auto Deselect when Tool Changes (Except Magic/Select interactions) --
  useEffect(() => {
    if (activeTool !== TOOLS.SELECT && activeTool !== TOOLS.MAGIC) {
        setSelectedHexIds(new Set());
        setSelectionAnchor(null);
    }
  }, [activeTool]);

  // -- Logging Helper --
  const addLog = (text: string, type: 'info' | 'alert' | 'warning' | 'error' | 'success' = 'info') => {
    const id = Date.now() + Math.random(); 
    const newLog: LogEntry = { id, text, type, time: new Date() };
    setLogs(prev => [newLog, ...prev]);
    const isImportant = type === 'alert' || type === 'warning' || type === 'error';
    if (isImportant) {
        setToasts(prev => [newLog, ...prev]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }
  };

  useEffect(() => { addLogRef.current = addLog; }, [addLog]);

  // -- Panning Handlers --
  const handleMainMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMainMouseMove = (e: React.MouseEvent) => {
    if (isPanning && mainRef.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        mainRef.current.scrollLeft -= dx;
        mainRef.current.scrollTop -= dy;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  // -- Magic Generator --
  const handleMagicGenerate = async () => {
      if (!magicPrompt && !magicImage) {
          alert("Please enter a description or upload an image.");
          return;
      }
      setIsGeneratingMap(true);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const parts: any[] = [];
          
          if (magicImage) {
            parts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: magicImage
                }
            });
            parts.push({
                text: "Analyze this fantasy map image. Translate it into a 50x40 hex grid representation."
            });
          }
          
          if (magicPrompt) {
              parts.push({ text: `Description: ${magicPrompt}` });
          }

          parts.push({
              text: `
                You are a map generator for a hex grid (Width 50, Height 40).
                Coordinates: q (col 0-49), r (row 0-39).
                Available Terrains: ${Object.keys(DEFAULT_TERRAINS).join(', ')}.
                Available Icons: ${INITIAL_ICONS.filter(i => i.id !== 'none').map(i => i.id).join(', ')}.
                Road Types: ${Object.keys(ROAD_TYPES).join(', ')}.

                Output a JSON object with:
                1. "background": string (base terrain id, e.g. "grass")
                2. "operations": Array of objects. Each object must have a "type" field:
                   - type="fill_circle": { terrain: string, q: number, r: number, radius: number }
                   - type="fill_rect": { terrain: string, q: number, r: number, width: number, height: number }
                   - type="path": { road: string, points: [{q: number, r: number}, ...] } (list of waypoints)
                   - type="icon": { icon: string, q: number, r: number }

                Generate a rich map matching the description/image. Use operations to paint terrains, draw roads, and place icons.
                Important: "points" in "path" must be an array of objects with q and r.
                JSON ONLY.
              `
          });

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts },
              config: {
                  responseMimeType: 'application/json'
              }
          });
          
          const resultText = response.text;
          if (resultText) {
              const data = JSON.parse(resultText);
              
              let newGrid = shouldClearMap ? {} : { ...gridData };
              let newRegions = shouldClearMap ? {} : { ...regions };
              
              // 1. Initialize Background (if clear)
              if (shouldClearMap) {
                  for (let r = 0; r < MAP_HEIGHT; r++) {
                    for (let q = 0; q < MAP_WIDTH; q++) {
                        newGrid[HexUtils.getHexId(q, r)] = {
                            terrain: data.background || 'grass',
                            icon: 'none',
                            roads: {},
                            regionId: null,
                            lore: ''
                        };
                    }
                  }
              }

              // 2. Process Operations
              if (Array.isArray(data.operations)) {
                  data.operations.forEach((op: any) => {
                      if (op.type === 'fill_circle') {
                          const center = { q: op.q, r: op.r };
                          const radius = op.radius;
                          // Simple distance check
                          for(let r=0; r<MAP_HEIGHT; r++) {
                              for(let q=0; q<MAP_WIDTH; q++) {
                                  const hexP = HexUtils.hexToPixel(q, r);
                                  const centerP = HexUtils.hexToPixel(center.q, center.r);
                                  const dist = Math.sqrt((hexP.x - centerP.x)**2 + (hexP.y - centerP.y)**2);
                                  // Approx radius check in pixels
                                  if (dist <= radius * HEX_SIZE * 1.73) {
                                      const id = HexUtils.getHexId(q, r);
                                      if (newGrid[id]) newGrid[id] = { ...newGrid[id], terrain: op.terrain };
                                  }
                              }
                          }
                      }
                      else if (op.type === 'fill_rect') {
                          const qMin = op.q;
                          const rMin = op.r;
                          const qMax = op.q + op.width;
                          const rMax = op.r + op.height;
                          for(let q=qMin; q<qMax; q++) {
                              for(let r=rMin; r<rMax; r++) {
                                  const id = HexUtils.getHexId(q, r);
                                  if (newGrid[id]) newGrid[id] = { ...newGrid[id], terrain: op.terrain };
                              }
                          }
                      }
                      else if (op.type === 'icon') {
                          const id = HexUtils.getHexId(op.q, op.r);
                          if (newGrid[id]) newGrid[id] = { ...newGrid[id], icon: op.icon };
                      }
                      else if (op.type === 'path') {
                          if (Array.isArray(op.points) && op.points.length > 1) {
                              for (let i = 0; i < op.points.length - 1; i++) {
                                  const start = op.points[i];
                                  const end = op.points[i+1];
                                  // Linear interpolation for hex line
                                  const N = Math.max(Math.abs(start.q - end.q), Math.abs(start.r - end.r)) * 2; // Roughly enough steps
                                  if (N === 0) continue;
                                  
                                  let prevHex = start;
                                  for (let step = 1; step <= N; step++) {
                                      const t = step / N;
                                      const currQ = Math.round(start.q + (end.q - start.q) * t);
                                      const currR = Math.round(start.r + (end.r - start.r) * t);
                                      
                                      const prevId = HexUtils.getHexId(prevHex.q, prevHex.r);
                                      const currId = HexUtils.getHexId(currQ, currR);
                                      
                                      if (prevId !== currId && newGrid[prevId] && newGrid[currId]) {
                                          // Connect prev and curr
                                          const prevRoads = { ...(newGrid[prevId].roads || {}) };
                                          const currRoads = { ...(newGrid[currId].roads || {}) };
                                          
                                          // Only connect if they are neighbors
                                          if (HexUtils.isNeighbor(prevHex, {q: currQ, r: currR})) {
                                              prevRoads[currId] = op.road;
                                              currRoads[prevId] = op.road;
                                              newGrid[prevId] = { ...newGrid[prevId], roads: prevRoads };
                                              newGrid[currId] = { ...newGrid[currId], roads: currRoads };
                                              prevHex = {q: currQ, r: currR};
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  });
              }
              
              setGridData(newGrid);
              setRegions(newRegions);
              addToHistory(newGrid, newRegions, terrains);
              addLog("Magic map generation complete!", "success");
          }
      } catch (err) {
          console.error(err);
          addLog("Failed to generate map. Try again.", "error");
      } finally {
          setIsGeneratingMap(false);
      }
  };

  const handleMagicAreaGenerate = async () => {
    if (selectedHexIds.size === 0) return;
    if (!magicAreaPrompt.trim()) {
        alert("Please describe what you want to generate in this area.");
        return;
    }

    setIsGeneratingArea(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Prepare list of coordinates for the AI
        const coords = Array.from(selectedHexIds).map(id => {
            const { q, r } = HexUtils.parseHexId(id);
            return { q, r };
        });

        const prompt = `
            You are a map editor assistant. The user has selected ${coords.length} specific hexes.
            
            Target Hexes (q,r): ${JSON.stringify(coords)}
            
            User Description: "${magicAreaPrompt}"
            
            Available Assets:
            - Terrains: ${Object.keys(DEFAULT_TERRAINS).join(', ')}
            - Icons: ${INITIAL_ICONS.filter(i => i.id !== 'none').map(i => i.id).join(', ')}
            - Road Types: ${Object.keys(ROAD_TYPES).join(', ')}

            Instructions:
            - Generate content ONLY for the provided Target Hexes.
            - You can change terrain, place icons, add roads, and CREATE REGIONS.
            - For regions, create a logical grouping of hexes with lore and encounters.

            Output JSON Format:
            {
                "terrains": [{ "q": 1, "r": 2, "type": "grass" }, ...],
                "icons": [{ "q": 1, "r": 2, "id": "ruin" }, ...],
                "roads": [{ "q1": 1, "r1": 2, "q2": 1, "r2": 3, "type": "trail" }, ...],
                "regions": [
                    {
                        "name": "Haunted Woods",
                        "color": "#550000",
                        "lore": "A spooky forest...",
                        "encounters": ["Zombie attack", "Fog rolls in", ...],
                        "hexes": [{ "q": 1, "r": 2 }, ...]
                    }
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text;
        if (text) {
            const data = JSON.parse(text);
            let newGrid = { ...gridData };
            let newRegions = { ...regions };
            let modifiedCount = 0;

            // 1. Apply Terrain
            if (Array.isArray(data.terrains)) {
                data.terrains.forEach((t: any) => {
                    const id = HexUtils.getHexId(t.q, t.r);
                    if (newGrid[id] && selectedHexIds.has(id)) {
                        newGrid[id] = { ...newGrid[id], terrain: t.type };
                        modifiedCount++;
                    }
                });
            }

            // 2. Apply Icons
            if (Array.isArray(data.icons)) {
                data.icons.forEach((i: any) => {
                    const id = HexUtils.getHexId(i.q, i.r);
                    if (newGrid[id] && selectedHexIds.has(id)) {
                        newGrid[id] = { ...newGrid[id], icon: i.id };
                    }
                });
            }

            // 3. Apply Roads
            if (Array.isArray(data.roads)) {
                data.roads.forEach((r: any) => {
                    const id1 = HexUtils.getHexId(r.q1, r.r1);
                    const id2 = HexUtils.getHexId(r.q2, r.r2);
                    
                    // Allow connecting if at least one is in selection? Or both? 
                    // Let's strictly check if both exist in grid, and at least one is in selection to allow bridging out
                    if (newGrid[id1] && newGrid[id2] && (selectedHexIds.has(id1) || selectedHexIds.has(id2))) {
                        if (HexUtils.isNeighbor({q: r.q1, r: r.r1}, {q: r.q2, r: r.r2})) {
                             const roads1 = { ...newGrid[id1].roads, [id2]: r.type };
                             const roads2 = { ...newGrid[id2].roads, [id1]: r.type };
                             newGrid[id1] = { ...newGrid[id1], roads: roads1 };
                             newGrid[id2] = { ...newGrid[id2], roads: roads2 };
                        }
                    }
                });
            }

            // 4. Create Regions
            if (Array.isArray(data.regions)) {
                data.regions.forEach((r: any) => {
                    const regionId = `region_ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    
                    // Create Table
                    const encounters = Array.isArray(r.encounters) ? r.encounters : ["Something happens..."];
                    const table = encounters.map((txt: string, idx: number) => ({
                        range: [idx + 1, idx + 1],
                        result: txt
                    }));
                    // Pad table
                    while(table.length < 6) {
                        table.push({ range: [table.length+1, table.length+1], result: "Quiet." });
                    }

                    const newRegion: Region = {
                        name: r.name || "New Area",
                        color: r.color || "#ff00ff",
                        lore: r.lore || "",
                        freqConfig: { die: "d6", triggerValues: [1] },
                        diceConfig: { count: 1, faces: 6 },
                        table: table
                    };
                    
                    newRegions[regionId] = newRegion;

                    // Assign hexes
                    if (Array.isArray(r.hexes)) {
                        r.hexes.forEach((h: any) => {
                            const id = HexUtils.getHexId(h.q, h.r);
                            if (newGrid[id] && selectedHexIds.has(id)) {
                                newGrid[id] = { ...newGrid[id], regionId: regionId };
                            }
                        });
                    }
                });
            }

            setGridData(newGrid);
            setRegions(newRegions);
            addToHistory(newGrid, newRegions, terrains);
            addLog(`Magic Area Update complete.`, "success");
            setMagicAreaPrompt("");
        }

    } catch (e) {
        console.error(e);
        addLog("Failed to generate area content.", "error");
    } finally {
        setIsGeneratingArea(false);
    }
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              // strip prefix for Gemini
              setMagicImage(result.split(',')[1]); 
          };
          reader.readAsDataURL(file);
      }
  };

  // -- Action Handlers --

  const applyTool = (q: number, r: number, isDrag = false, modifiers: { shiftKey: boolean, ctrlKey: boolean, metaKey: boolean } = { shiftKey: false, ctrlKey: false, metaKey: false }) => {
    const id = HexUtils.getHexId(q, r);

    // 1. Paint Tool
    if (activeTool === TOOLS.PAINT) {
      isDirtyRef.current = true; // Mark change for history
      const isRoadMode = ['paved', 'trail', 'rail', 'bridge', 'bulldoze_road'].includes(activeTerrain);

      if (isRoadMode) {
        if (!isDrag) {
            lastPathHex.current = { q, r };
        } else {
            if (lastPathHex.current) {
                const start = lastPathHex.current;
                const end = { q, r };
                const startId = HexUtils.getHexId(start.q, start.r);
                
                if (startId !== id && HexUtils.isNeighbor(start, end)) {
                    setGridData(prev => {
                        const next = { ...prev };
                        const sData = next[startId];
                        const eData = next[id];
                        
                        if (!sData || !eData) return prev;

                        const sRoads = sData.roads || {};
                        const eRoads = eData.roads || {};

                        if (activeTerrain !== 'bulldoze_road') {
                            sRoads[id] = activeTerrain;
                            eRoads[startId] = activeTerrain;
                        } else {
                            delete sRoads[id];
                            delete eRoads[startId];
                        }

                        next[startId] = { ...sData, roads: { ...sRoads } };
                        next[id] = { ...eData, roads: { ...eRoads } };
                        return next;
                    });
                    lastPathHex.current = { q, r };
                }
            }
        }
      } else {
        setGridData(prev => ({
            ...prev,
            [id]: { ...prev[id], terrain: activeTerrain }
        }));
      }
    } 
    // 2. Icon Tool
    else if (activeTool === TOOLS.ICON) {
      isDirtyRef.current = true;
      setGridData(prev => ({
        ...prev,
        [id]: { ...prev[id], icon: activeIcon }
      }));
    }
    // 3. Selection Tool OR Magic Tool (for area selection)
    else if (activeTool === TOOLS.SELECT || activeTool === TOOLS.MAGIC) {
      if (!isDrag) {
        const { shiftKey, ctrlKey, metaKey } = modifiers;

        if (shiftKey && selectionAnchor) {
            setSelectedHexIds(prev => {
                const next = new Set(prev);
                const qMin = Math.min(selectionAnchor.q, q);
                const qMax = Math.max(selectionAnchor.q, q);
                const rMin = Math.min(selectionAnchor.r, r);
                const rMax = Math.max(selectionAnchor.r, r);
                for (let cQ = qMin; cQ <= qMax; cQ++) {
                    for (let cR = rMin; cR <= rMax; cR++) {
                        next.add(HexUtils.getHexId(cQ, cR));
                    }
                }
                return next;
            });
        } else if (ctrlKey || metaKey) {
            setSelectedHexIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            });
            setSelectionAnchor({ q, r });
        } else {
            setSelectedHexIds(new Set([id]));
            setSelectionAnchor({ q, r });
        }
      } else {
        // DRAG LOGIC
        if (modifiers.shiftKey && dragOriginRef.current) {
            // Shift+Drag: Rectangular Selection
            // We reconstruct the selection from the snapshot + the new box
            const start = dragOriginRef.current;
            const end = { q, r };
            const qMin = Math.min(start.q, end.q);
            const qMax = Math.max(start.q, end.q);
            const rMin = Math.min(start.r, end.r);
            const rMax = Math.max(start.r, end.r);

            const nextSelection = new Set(selectionSnapshotRef.current);
            for (let cQ = qMin; cQ <= qMax; cQ++) {
                for (let cR = rMin; cR <= rMax; cR++) {
                    nextSelection.add(HexUtils.getHexId(cQ, cR));
                }
            }
            setSelectedHexIds(nextSelection);
        } else {
            // Normal Drag: Paint Selection (Add to existing)
            setSelectedHexIds(prev => {
                const next = new Set(prev);
                next.add(id);
                return next;
            });
            setSelectionAnchor({ q, r });
        }
      }
    }
    // 5. Party Tool
    else if (activeTool === TOOLS.PARTY && !isDrag) {
      handlePartyMove(q, r);
    }
  };

  const handleHexMouseDown = (e: React.MouseEvent, q: number, r: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setIsMouseDown(true);
    
    // Capture state for selection dragging
    if (activeTool === TOOLS.SELECT || activeTool === TOOLS.MAGIC) {
        selectionSnapshotRef.current = new Set(selectedHexIds);
        dragOriginRef.current = { q, r };
    }

    const modifiers = {
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey
    };
    applyTool(q, r, false, modifiers);
  };

  const handleHexMouseEnter = (e: React.MouseEvent, q: number, r: number) => {
    if (isMouseDown) {
       const modifiers = {
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey
        };
      applyTool(q, r, true, modifiers);
    }
  };

  const handlePartyMove = (q: number, r: number) => {
    const targetId = HexUtils.getHexId(q, r);
    const targetHex = gridData[targetId];
    setPartyPos({ q, r });
    addLog(`Party moved to ${q},${r}.`);
    if (targetHex && targetHex.regionId && regions[targetHex.regionId]) {
      const region = regions[targetHex.regionId];
      runEncounterRoutine(region);
    }
  };

  const handleRegionUpdate = (regionId: string, newRegionData: Region) => {
    setRegions(prev => {
        const next = { ...prev, [regionId]: newRegionData };
        // Commit immediately for these UI updates (debounced by RegionEditor components)
        addToHistory(gridData, next, terrains); 
        return next;
    });
  };
  
  const handleAddStamp = () => {
    if (!newStampLabel || !newStampSymbol) {
        alert("Please provide both a Label and a Symbol (Emoji or Text).");
        return;
    }
    const newId = `custom_${Date.now()}`;
    const newStamp: IconDef = {
        id: newId,
        label: newStampLabel,
        icon: newStampSymbol,
        type: 'text'
    };
    setAvailableIcons(prev => [...prev, newStamp]);
    setNewStampLabel('');
    setNewStampSymbol('');
    setIsEmojiPickerOpen(false);
    setActiveIcon(newId);
  };

  const handleAddTerrain = (name: string, color: string) => {
    const id = `custom_terrain_${Date.now()}`;
    const newTerrains = {
        ...terrains,
        [id]: { label: name, color: color }
    };
    setTerrains(newTerrains);
    setActiveTerrain(id); // Select the new terrain
    
    // Add to history
    addToHistory(gridData, regions, newTerrains);
    addLog(`Created terrain: ${name}`, 'success');
  };

  const handleUpdateTerrain = (id: string, newConfig: TerrainConfig) => {
      const newTerrains = { ...terrains, [id]: newConfig };
      setTerrains(newTerrains);
      addToHistory(gridData, regions, newTerrains);
  };

  const handleDeleteTerrain = (id: string) => {
       if (id === 'void') {
           alert("Cannot delete the default Void terrain.");
           return;
       }
       
       // Count usage
       let count = 0;
       Object.values(gridData).forEach((hex: HexData) => { if(hex.terrain === id) count++; });
       
       if (count > 0) {
           if (!window.confirm(`This terrain is used in ${count} hexes. Deleting it will reset them to Void. Continue?`)) return;
       } else {
           if (!window.confirm(`Delete terrain "${terrains[id].label}"?`)) return;
       }

       // Update Grid
       let newGrid: Record<string, HexData> = { ...gridData };
       if (count > 0) {
           Object.keys(newGrid).forEach(k => {
               if (newGrid[k].terrain === id) newGrid[k] = { ...newGrid[k], terrain: 'void' };
           });
       }
       
       // Update Terrains
       const newTerrains: Record<string, TerrainConfig> = { ...terrains };
       delete newTerrains[id];
       
       // If active terrain was deleted, switch to void
       if (activeTerrain === id) setActiveTerrain('void');

       setGridData(newGrid);
       setTerrains(newTerrains);
       addToHistory(newGrid, regions, newTerrains);
  };

  const runEncounterRoutine = (region: Region) => {
    const freqDie = parseInt(region.freqConfig.die.substring(1));
    const freqRoll = Math.ceil(Math.random() * freqDie);
    const isTriggered = region.freqConfig.triggerValues.includes(freqRoll);

    if (!isTriggered) {
      addLog(`Region check (${region.name}): Rolled ${freqRoll} on ${region.freqConfig.die}. Safe.`, 'success');
      return;
    }
    addLog(`⚠️ Encounter in ${region.name}! (Check: ${freqRoll})`, 'warning');
    
    const diceCount = region.diceConfig.count;
    const faceCount = region.diceConfig.faces;
    let rollSum = 0;
    const rolls = [];
    for(let i=0; i<diceCount; i++) {
      const r = Math.ceil(Math.random() * faceCount);
      rolls.push(r);
      rollSum += r;
    }
    const outcome = region.table.find(row => rollSum >= row.range[0] && rollSum <= row.range[1]);
    const resultText = outcome ? outcome.result : "Uneventful silence...";
    addLog(`⚔️ Rolled ${rollSum} (${rolls.join('+')}). Result: ${resultText}`, 'alert');
  };
  
  // Update ref for encounters so useEffect can access it
  useEffect(() => {
     runEncounterRoutineRef.current = runEncounterRoutine; 
  });

  const handleClearHexes = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (selectedHexIds.size === 0) return;
    
    // We removed the window.confirm to ensure the action always fires immediately
    // and to avoid issues with browser blocking or user confusion.

    let newGrid = { ...gridData };
    let clearedCount = 0;
    
    selectedHexIds.forEach(id => {
        const hex = newGrid[id];
        if (!hex) return;

        // 1. Bulldoze Roads: Clean up neighbors pointing to this hex
        if (hex.roads) {
          Object.keys(hex.roads).forEach(neighborId => {
            const neighbor = newGrid[neighborId];
            if (neighbor && neighbor.roads) {
              const neighborRoads = { ...neighbor.roads };
              // If neighbor has a road to the current hex (id), remove it
              if (neighborRoads[id]) {
                  delete neighborRoads[id]; 
                  newGrid[neighborId] = { ...neighbor, roads: neighborRoads };
              }
            }
          });
        }
        
        // 2. Clear Content: Reset to Void terrain, None icon, No roads, Detach region, Clear lore
        newGrid[id] = {
          terrain: 'void',
          icon: 'none',
          roads: {}, 
          regionId: null,
          lore: ''
        };
        clearedCount++;
    });

    setGridData(newGrid);
    addToHistory(newGrid, regions, terrains);
    addLog(`Cleared content from ${clearedCount} hex(es).`, 'success');
  };

  // -- Data Management --
  const handleExport = () => {
    const data = { gridData, regions, terrains, partyPos, partyIconId };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hexforge_map.json';
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
            const data = JSON.parse(result) as {
                gridData?: Record<string, HexData>;
                regions?: Record<string, Region>;
                terrains?: any; // Use 'any' here to prevent stricter checks on initial parse
                partyPos?: any;
                partyIconId?: string;
            };

            const importedTerrains = (data.terrains as Record<string, TerrainConfig>) || DEFAULT_TERRAINS;

            if (data.gridData) setGridData(data.gridData);
            if (data.regions) setRegions(data.regions);
            if (data.terrains) setTerrains(importedTerrains); // Import custom terrains
            if (data.partyPos) setPartyPos(data.partyPos);
            if (data.partyIconId) setPartyIconId(data.partyIconId);
            
            // Reset History on Import
            setHistory([{ 
                gridData: data.gridData || {}, 
                regions: data.regions || {},
                terrains: importedTerrains
            }]);
            setHistoryIndex(0);
            
            addLog("Map loaded successfully.");
        }
      } catch (err) {
        addLog("Failed to load map data.", 'error');
      }
    };
    reader.readAsText(file);
  };

  const batchUpdateRegion = (regionId: string | null) => {
    let newGrid = { ...gridData };
    selectedHexIds.forEach(id => {
        if (newGrid[id]) {
            newGrid[id] = { ...newGrid[id], regionId: regionId };
        }
    });
    setGridData(newGrid);
    addToHistory(newGrid, regions, terrains);
    
    if (regionId === null) {
        addLog(`Detached regions from ${selectedHexIds.size} hex(es).`, 'info');
    } else {
        addLog(`Applied region to ${selectedHexIds.size} hex(es).`, 'info');
    }
  };

  const createRegion = () => {
    const id = `region_${Date.now()}`;
    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 70%)`;
    
    const newRegion: Region = {
        name: "New Region",
        color: randomColor, 
        freqConfig: { die: "d6", triggerValues: [1] },
        diceConfig: { count: 2, faces: 6 },
        table: [
          { range: [2, 6], result: "Common wildlife." },
          { range: [7, 9], result: "Bandit tracks." },
          { range: [10, 12], result: "Dragon spotted!" }
        ],
        lore: ""
    };

    const newRegions = { ...regions, [id]: newRegion };
    setRegions(newRegions);
    
    // If we have a selection, apply the new region to it immediately
    if (selectedHexIds.size > 0) {
        batchUpdateRegion(id);
    } else {
        setExpandedRegionId(id);
    }
    
    // Note: batchUpdateRegion handles the history/grid update if selected. 
    // If not selected, we still need to commit the new region existence to history.
    if (selectedHexIds.size === 0) {
        addToHistory(gridData, newRegions, terrains);
    }
  };

  const deleteRegion = (regionId: string) => {
      if (!window.confirm("Delete this region? Hexes will be detached.")) return;
      
      const newRegions = { ...regions };
      delete newRegions[regionId];

      let newGrid = { ...gridData };
      Object.keys(newGrid).forEach(hexId => {
          if (newGrid[hexId].regionId === regionId) {
              newGrid[hexId] = { ...newGrid[hexId], regionId: null };
          }
      });

      setRegions(newRegions);
      setGridData(newGrid);
      addToHistory(newGrid, newRegions, terrains);
  };

  const updateHexLore = (hexId: string, lore: string) => {
      setGridData(prev => ({
          ...prev,
          [hexId]: { ...prev[hexId], lore }
      }));
  };
  
  // Wrapper to commit lore change to history on Blur
  const commitHexLore = () => {
      addToHistory(gridData, regions, terrains);
  }

  // Helper to determine if all selected hexes share the same region
  const getCommonRegionId = () => {
      if (selectedHexIds.size === 0) return null;
      const ids = Array.from(selectedHexIds);
      const firstRegion = gridData[ids[0]]?.regionId;
      // All must match the first region, and it shouldn't be null to be considered a "Common Region" for editing
      if (firstRegion && ids.every(id => gridData[id]?.regionId === firstRegion)) {
          return firstRegion;
      }
      return null;
  };

  const commonRegionId = getCommonRegionId();

  // --- Render Components ---

  const renderGrid = () => {
    const els: React.ReactElement[] = [];
    const roadPaths: React.ReactElement[] = [];

    Object.keys(gridData).forEach(key => {
      const hex = gridData[key];
      const { q, r } = HexUtils.parseHexId(key);
      const { x, y } = HexUtils.hexToPixel(q, r);
      const points = HexUtils.getHexPoints(x, y, HEX_SIZE);
      const isSelected = selectedHexIds.has(key);
      const hasRegion = hex.regionId && regions[hex.regionId];
      const showRegionHighlight = (activeTool === TOOLS.SELECT || activeTool === TOOLS.MAGIC) && hasRegion;

      let stroke = "#00000010";
      let strokeWidth = 1;
      
      if (isSelected) {
          stroke = "white";
          strokeWidth = 3;
      } else if (showRegionHighlight && hex.regionId) {
          stroke = regions[hex.regionId].color || "#8b5cf6";
          strokeWidth = 2;
      }

      const iconDef = availableIcons.find(i => i.id === hex.icon);

      // Use the terrains state to look up colors
      const terrainColor = terrains[hex.terrain]?.color || '#ccc';

      els.push(
        <g 
          key={key} 
          onMouseDown={(e) => handleHexMouseDown(e, q, r)}
          onMouseEnter={(e) => handleHexMouseEnter(e, q, r)}
          className="cursor-pointer hover:opacity-90 transition-opacity"
        >
          <polygon 
            points={points} 
            fill={terrainColor} 
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <text x={x} y={y + HEX_SIZE/2} fontSize="8" textAnchor="middle" fill="rgba(0,0,0,0.1)" className="pointer-events-none select-none">
            {q},{r}
          </text>

          {iconDef && iconDef.id !== 'none' && (
            <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
              {iconDef.type === 'text' && typeof iconDef.icon === 'string' ? (
                  <text textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#1f2937">
                    {iconDef.icon}
                  </text>
              ) : (
                  <g transform="translate(-12, -12)">
                      {iconDef.icon && typeof iconDef.icon !== 'string' && React.createElement(iconDef.icon, { 
                        size: 24, 
                        color: "#1f2937",
                        fill: iconDef.id === 'cave' ? "#1f2937" : "rgba(255,255,255,0.4)" 
                      })}
                  </g>
              )}
            </g>
          )}
        </g>
      );

      if (hex.roads) {
          Object.entries(hex.roads).forEach(([neighborId, type]: [string, string]) => {
            if (key < neighborId) {
                const nData = HexUtils.parseHexId(neighborId);
                const nPos = HexUtils.hexToPixel(nData.q, nData.r);
                const style = ROAD_TYPES[type] || ROAD_TYPES['paved'];

                if (type === 'rail') {
                    roadPaths.push(
                        <line key={`road-base-${key}-${neighborId}`} x1={x} y1={y} x2={nPos.x} y2={nPos.y} stroke={style.color} strokeWidth={style.width} className="pointer-events-none" />
                    );
                    roadPaths.push(
                        <line key={`road-top-${key}-${neighborId}`} x1={x} y1={y} x2={nPos.x} y2={nPos.y} stroke="rgba(255,255,255,0.5)" strokeWidth={style.width - 2} strokeDasharray="4,4" className="pointer-events-none" />
                    );
                } else if (type === 'bridge') {
                    // Draw lower bridge deck
                     roadPaths.push(
                        <line key={`road-deck-${key}-${neighborId}`} x1={x} y1={y} x2={nPos.x} y2={nPos.y} stroke="#5c2b0c" strokeWidth={style.width + 2} className="pointer-events-none" />
                    );
                     roadPaths.push(
                        <line key={`road-plank-${key}-${neighborId}`} x1={x} y1={y} x2={nPos.x} y2={nPos.y} stroke={style.color} strokeWidth={style.width} strokeDasharray="2,2" className="pointer-events-none" />
                    );
                } else {
                    roadPaths.push(
                        <line key={`road-${key}-${neighborId}`} x1={x} y1={y} x2={nPos.x} y2={nPos.y} stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash} strokeLinecap="round" className="pointer-events-none" />
                    );
                }
            }
          });
      }
    });

    const partyPixel = HexUtils.hexToPixel(partyPos.q, partyPos.r);
    const PartyIconComponent = PARTY_ICONS.find(p => p.id === partyIconId)?.icon || Shield;

    return (
      <svg 
        width={MAP_WIDTH * HEX_SIZE * 1.8} 
        height={MAP_HEIGHT * HEX_SIZE * 1.6} 
        className="bg-slate-100 rounded-lg shadow-inner select-none"
        viewBox={`-20 -20 ${MAP_WIDTH * HEX_SIZE * 2} ${MAP_HEIGHT * HEX_SIZE * 1.8}`}
      >
        {els}
        {roadPaths}
        <g transform={`translate(${partyPixel.x - 12}, ${partyPixel.y - 12})`} className="pointer-events-none transition-all duration-200 ease-in-out">
          <PartyIconComponent size={24} fill="#ef4444" color="#7f1d1d" />
        </g>
      </svg>
    );
  };

  // --- Main Layout ---

  return (
    <div className="flex flex-col h-screen bg-slate-200 text-slate-800 font-sans overflow-hidden">
      
      {/* Toast Overlay */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 pointer-events-none w-96 z-[100]">
        {toasts.map((log) => (
            <div key={log.id} className={`p-3 rounded shadow-lg backdrop-blur-sm border-l-4 text-sm animate-in fade-in slide-in-from-top-4 ${
                log.type === 'alert' ? 'bg-red-900/90 text-red-100 border-red-500' :
                log.type === 'warning' ? 'bg-amber-900/90 text-amber-100 border-amber-500' :
                log.type === 'success' ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500' :
                'bg-slate-800/90 text-slate-100 border-blue-500'
            }`}>
                {log.text}
            </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg z-10">
        <div className="flex items-center gap-2">
          <MapIcon />
          <h1 className="text-xl font-bold tracking-wider">HEXFORGE</h1>
        </div>
        
        <div className="flex gap-4">
             {/* Toolbar */}
            <div className="flex bg-slate-800 rounded-lg p-1">
            {[
                { id: TOOLS.PAINT, icon: Trees, label: "Paint" },
                { id: TOOLS.ICON, icon: Home, label: "Stamp" },
                { id: TOOLS.MAGIC, icon: Wand, label: "Magic" },
                { id: TOOLS.SELECT, icon: ChevronRight, label: "Edit" },
                { id: TOOLS.PARTY, icon: Shield, label: "Play" },
            ].map(tool => (
                <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeTool === tool.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                >
                    <tool.icon size={18} />
                    <span className="text-sm font-medium">{tool.label}</span>
                </button>
            ))}
            </div>

            {/* Undo/Redo */}
            <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                    onClick={handleUndo} 
                    disabled={historyIndex <= 0}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo size={18} />
                </button>
                <button 
                    onClick={handleRedo} 
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo size={18} />
                </button>
            </div>
        </div>

        <div className="flex gap-2">
            <button onClick={handleExport} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300" title="Save JSON">
                <Save size={20} />
            </button>
            <label className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 cursor-pointer" title="Load JSON">
                <Upload size={20} />
                <input type="file" onChange={handleImport} className="hidden" accept=".json"/>
            </label>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-300 flex flex-col shadow-xl z-10 shrink-0">
           <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h2 className="text-sm font-bold uppercase text-slate-500 mb-2">
                {activeTool === TOOLS.PAINT ? 'Terrain & Infrastructure' : 
                 activeTool === TOOLS.ICON ? 'Icon Stamps' : 
                 activeTool === TOOLS.PARTY ? 'Party Config' : 
                 activeTool === TOOLS.MAGIC ? 'AI Generator' :
                 activeTool === TOOLS.SELECT ? 'Edit Tools' : 'Tools'}
             </h2>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeTool === TOOLS.PAINT && (
                  <>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Base Terrain</h3>
                    
                    <TerrainCreator onAdd={handleAddTerrain} />

                    {Object.entries(terrains).map(([key, t]) => (
                        <TerrainListItem 
                            key={key}
                            id={key}
                            config={t}
                            isActive={activeTerrain === key}
                            onSelect={() => setActiveTerrain(key)}
                            onUpdate={handleUpdateTerrain}
                            onDelete={handleDeleteTerrain}
                        />
                    ))}
                  </div>

                  <hr className="border-slate-100 my-4"/>
                  
                  <div className="space-y-1">
                     <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Infrastructure</h3>
                     
                     <button 
                        onClick={() => setActiveTerrain('paved')}
                        className={`w-full flex items-center gap-3 p-2 rounded border transition-all ${
                            activeTerrain === 'paved' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                     >
                        <div className="w-6 h-6 flex items-center justify-center bg-slate-300 rounded text-slate-600">
                             <RoadIcon size={14} className="rotate-90"/>
                        </div>
                        <span className="text-sm font-medium">Paved Road</span>
                     </button>

                     <button 
                        onClick={() => setActiveTerrain('trail')}
                        className={`w-full flex items-center gap-3 p-2 rounded border transition-all ${
                            activeTerrain === 'trail' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                     >
                        <div className="w-6 h-6 flex items-center justify-center bg-amber-100 rounded text-amber-700">
                             <RoadIcon size={14} className="rotate-90 opacity-50"/>
                        </div>
                        <span className="text-sm font-medium">Dirt Trail</span>
                     </button>

                     <button 
                        onClick={() => setActiveTerrain('rail')}
                        className={`w-full flex items-center gap-3 p-2 rounded border transition-all ${
                            activeTerrain === 'rail' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                     >
                        <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded text-slate-300">
                             <Train size={14}/>
                        </div>
                        <span className="text-sm font-medium">Railroad</span>
                     </button>

                     <button 
                        onClick={() => setActiveTerrain('bridge')}
                        className={`w-full flex items-center gap-3 p-2 rounded border transition-all ${
                            activeTerrain === 'bridge' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                     >
                        <div className="w-6 h-6 flex items-center justify-center bg-amber-900 rounded text-amber-200">
                             <RoadIcon size={14} className="rotate-90"/>
                        </div>
                        <span className="text-sm font-medium">Bridge</span>
                     </button>

                     <div className="pt-2">
                        <button 
                            onClick={() => setActiveTerrain('bulldoze_road')}
                            className={`w-full flex items-center gap-3 p-2 rounded border transition-all ${
                                activeTerrain === 'bulldoze_road' ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded text-red-500">
                                <X size={14}/>
                            </div>
                            <span className="text-sm font-medium">Bulldoze Road</span>
                        </button>
                     </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic px-1">
                      Drag across hexes to connect them with roads.
                  </p>
                  </>
              )}

              {activeTool === TOOLS.ICON && (
                <>
                  {/* Create New Stamp Section */}
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 mb-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Create Custom Stamp</h3>
                      <div className="space-y-2">
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">Stamp Name</label>
                              <input 
                                className="w-full p-1 border rounded text-sm" 
                                placeholder="e.g. Dragon"
                                value={newStampLabel}
                                onChange={(e) => setNewStampLabel(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="text-xs text-slate-400 block mb-1">Symbol</label>
                              <div className="flex gap-2">
                                  <input 
                                    className="w-12 p-1 border rounded text-center text-lg" 
                                    placeholder="🐉"
                                    maxLength={2}
                                    value={newStampSymbol}
                                    onChange={(e) => setNewStampSymbol(e.target.value)}
                                  />
                                  <button
                                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                    className="p-1 bg-slate-200 rounded hover:bg-slate-300"
                                    title="Pick Emoji"
                                  >
                                    <Smile size={20}/>
                                  </button>
                                  <button 
                                    onClick={handleAddStamp}
                                    className="flex-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
                                  >
                                    Add
                                  </button>
                              </div>
                              {isEmojiPickerOpen && (
                                  <div className="mt-2 p-2 bg-white border rounded shadow-inner h-48 overflow-y-auto grid grid-cols-6 gap-1">
                                      {EMOJI_PRESETS.map((emoji, idx) => (
                                          <button
                                            key={idx}
                                            className="text-lg hover:bg-slate-100 p-1 rounded"
                                            onClick={() => {
                                                setNewStampSymbol(emoji);
                                                setIsEmojiPickerOpen(false);
                                            }}
                                          >
                                              {emoji}
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  <hr className="border-slate-100 my-4"/>

                  <div className="space-y-1">
                      {availableIcons.map((i) => (
                         <button 
                            key={i.id}
                            onClick={() => setActiveIcon(i.id)}
                            className={`w-full flex items-center gap-3 p-2 rounded border transition-all ${
                                activeIcon === i.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                            }`}
                         >
                            <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded text-slate-700">
                                {i.type === 'text' ? (
                                    <span className="text-lg">{i.icon as string}</span>
                                ) : (
                                    i.icon ? React.createElement(i.icon as React.ComponentType<any>, { size: 20, fill: i.id === 'cave' ? '#000' : 'none' }) : <span className="text-xs">X</span>
                                )}
                            </div>
                            <span className="text-sm font-medium truncate">{i.label}</span>
                         </button>
                      ))}
                  </div>
                </>
              )}

              {/* === MAGIC TOOL === */}
              {activeTool === TOOLS.MAGIC && (
                  <div className="space-y-4">
                      {selectedHexIds.size > 0 ? (
                        // --- AREA MODE ---
                        <div className="bg-indigo-50 p-3 rounded border border-indigo-200 animate-in fade-in">
                            <h3 className="text-xs font-bold text-indigo-700 uppercase mb-2 flex items-center gap-2">
                                <Sparkles size={14}/> Modify Selected Area
                            </h3>
                            <div className="mb-2 text-xs text-indigo-600 bg-white/50 p-2 rounded">
                                {selectedHexIds.size} Hexes Selected
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Instruction</label>
                                    <textarea 
                                        className="w-full h-24 p-2 text-sm border border-slate-200 rounded focus:border-indigo-500 outline-none resize-none"
                                        placeholder="Add a dark forest with a ruined tower and a trail leading through it..."
                                        value={magicAreaPrompt}
                                        onChange={(e) => setMagicAreaPrompt(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleMagicAreaGenerate}
                                    disabled={isGeneratingArea}
                                    className="w-full bg-indigo-600 text-white text-sm font-bold py-2 rounded hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isGeneratingArea ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                                    Generate Content
                                </button>
                            </div>
                             <p className="text-[10px] text-slate-400 mt-2 italic">
                                This will add terrain, icons, roads, and create regions in the selected area.
                            </p>
                        </div>
                      ) : (
                        // --- FULL MAP MODE ---
                        <div className="bg-purple-50 p-3 rounded border border-purple-200">
                          <h3 className="text-xs font-bold text-purple-700 uppercase mb-2 flex items-center gap-2">
                              <Wand size={14}/> Auto-Generate Map
                          </h3>
                          <p className="text-xs text-purple-600 mb-3">
                              Describe the world you want, or upload a map image to digitize.
                          </p>
                          
                          <div className="space-y-3">
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Description</label>
                                  <textarea 
                                      className="w-full h-24 p-2 text-sm border border-slate-200 rounded focus:border-purple-500 outline-none resize-none"
                                      placeholder="A kingdom with a large desert in the south, a mountain range in the north, and a cursed swamp..."
                                      value={magicPrompt}
                                      onChange={(e) => setMagicPrompt(e.target.value)}
                                  />
                              </div>
                              
                              <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Reference Image (Optional)</label>
                                  <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                    />
                                    <div className="flex items-center gap-2 p-2 border border-slate-300 border-dashed rounded bg-white text-slate-500 text-xs">
                                        <ImageIcon size={16}/>
                                        {magicImage ? "Image selected" : "Click to upload image"}
                                    </div>
                                  </div>
                                  {magicImage && (
                                      <div className="mt-2 relative group">
                                          <img src={`data:image/png;base64,${magicImage}`} className="w-full h-24 object-cover rounded border" />
                                          <button 
                                            onClick={() => setMagicImage(null)}
                                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                          >
                                              <X size={12}/>
                                          </button>
                                      </div>
                                  )}
                              </div>

                              <div className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    id="clearMap"
                                    checked={shouldClearMap}
                                    onChange={(e) => setShouldClearMap(e.target.checked)}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <label htmlFor="clearMap" className="text-xs text-slate-600">Clear existing map first</label>
                              </div>

                              <button
                                  onClick={handleMagicGenerate}
                                  disabled={isGeneratingMap}
                                  className="w-full bg-purple-600 text-white text-sm font-bold py-2 rounded hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  {isGeneratingMap ? <Loader2 size={16} className="animate-spin"/> : <Wand size={16}/>}
                                  Generate Map
                              </button>
                          </div>
                          <div className="text-xs text-slate-400 italic px-1 mt-3">
                            <span className="font-bold">Tip:</span> Highlight an area on the map to modify just that section.
                          </div>
                        </div>
                      )}
                  </div>
              )}

              {activeTool === TOOLS.PARTY && (
                 <div className="space-y-4">
                    <p className="text-sm text-slate-500">Choose your party token:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {PARTY_ICONS.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPartyIconId(p.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded border ${
                                    partyIconId === p.id ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <p.icon className="mb-1 text-slate-700" size={24} />
                                <span className="text-xs font-bold text-slate-600">{p.label}</span>
                            </button>
                        ))}
                    </div>
                    <hr className="border-slate-200 my-4"/>
                    <p className="text-xs italic text-slate-400">
                        Click on the map or use <b>Arrow Keys</b> to move the token. Movement into regions triggers encounter checks.
                    </p>
                 </div>
              )}

              {/* === INSPECTOR CONTENT === */}
              {activeTool === TOOLS.SELECT && (
                <div className="space-y-6">
                    {/* Basic Info */}
                    {selectedHexIds.size === 1 && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {terrains[gridData[Array.from(selectedHexIds)[0] as string]?.terrain]?.label || 'Unknown'}
                            </h3>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                {gridData[Array.from(selectedHexIds)[0] as string]?.icon !== 'none' && (
                                    <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    {availableIcons.find(i => i.id === gridData[Array.from(selectedHexIds)[0] as string].icon)?.label}
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    {selectedHexIds.size > 1 && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                            Editing {selectedHexIds.size} Hexes. Region changes will apply to all.
                        </div>
                    )}

                    {/* Lore Input (Only single select) */}
                    {selectedHexIds.size === 1 && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">DM Notes / Lore</label>
                            <textarea 
                                className="w-full h-24 p-2 text-sm border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Describe this location..."
                                value={gridData[Array.from(selectedHexIds)[0] as string]?.lore || ''}
                                onChange={(e) => updateHexLore(Array.from(selectedHexIds)[0] as string, e.target.value)}
                                onBlur={commitHexLore}
                            />
                        </div>
                    )}

                    {/* Region Manager (Visible even with 0 selected) */}
                    {selectedHexIds.size === 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                                Region Manager
                                <button 
                                    onClick={createRegion}
                                    className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                                    title="Create New Region"
                                >
                                    <Plus size={16}/>
                                </button>
                            </h3>

                            {Object.keys(regions).length === 0 && (
                                <p className="text-sm text-slate-400 italic">No regions created yet.</p>
                            )}

                            <div className="space-y-2">
                                {Object.entries(regions).map(([id, region]: [string, Region]) => (
                                    <div key={id} className="border border-slate-200 rounded overflow-hidden">
                                        <div 
                                            className="p-2 bg-slate-50 hover:bg-slate-100 cursor-pointer flex justify-between items-center"
                                            onClick={() => setExpandedRegionId(expandedRegionId === id ? null : id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color || "#8b5cf6" }}></div>
                                                <span className="text-sm font-bold text-slate-700">{region.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteRegion(id); }}
                                                    className="text-slate-400 hover:text-red-500 p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                {expandedRegionId === id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                            </div>
                                        </div>
                                        {expandedRegionId === id && (
                                            <div className="p-2 border-t border-slate-100">
                                                <RegionEditor 
                                                    region={regions[id]} 
                                                    onUpdate={(newData) => handleRegionUpdate(id, newData)}
                                                    onRunEncounter={runEncounterRoutine}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Region Assignment (Visible when hexes selected) */}
                    {selectedHexIds.size > 0 && (
                        <>
                        <hr className="border-slate-100"/>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Encounter Region</label>
                                <button 
                                    onClick={() => batchUpdateRegion(null)}
                                    className="text-xs text-red-400 hover:text-red-600 underline"
                                >
                                    Detach All
                                </button>
                            </div>
                            
                            <select 
                                className="w-full p-2 border rounded text-sm mb-2 bg-slate-50"
                                onChange={(e) => {
                                    if(e.target.value === "new") createRegion();
                                    else batchUpdateRegion(e.target.value || null);
                                }}
                                value={commonRegionId || ""}
                            >
                                <option value="">-- Select Region to Apply --</option>
                                {Object.entries(regions).map(([id, r]: [string, Region]) => (
                                    <option key={id} value={id}>{r.name}</option>
                                ))}
                                <option value="new" className="font-bold text-blue-600">+ Create New Region</option>
                            </select>

                             {/* AI Region Generation Section */}
                            <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                <label className="text-xs font-bold text-purple-700 uppercase block mb-1 flex items-center gap-1">
                                   <Sparkles size={12}/> AI Create Region
                                </label>
                                <div className="flex flex-col gap-2">
                                    <textarea 
                                        className="w-full h-16 p-1 text-xs border rounded resize-none"
                                        placeholder="E.g. Haunted Woods, dangerous, undead encounters..."
                                        value={regionAiPrompt}
                                        onChange={(e) => setRegionAiPrompt(e.target.value)}
                                    />
                                    <button 
                                        className="bg-purple-600 text-white text-xs p-1 rounded hover:bg-purple-700 flex justify-center items-center gap-1 disabled:opacity-50"
                                        onClick={() => {
                                            /* Reuse the handleGenerateRegionFromSelection functionality, 
                                               but we need to access it here. 
                                               NOTE: In previous prompt, this was defined. I will re-implement it briefly inline or 
                                               expose the function if needed. It was defined as handleGenerateRegionFromSelection.
                                               Let's make sure it's accessible.
                                            */
                                            // Calling the function defined in component scope
                                            // Since I'm overwriting the component, I need to ensure that function exists.
                                            // It was defined below. I will include it.
                                        }}
                                        disabled={isGeneratingRegion}
                                    >
                                        {isGeneratingRegion ? <Loader2 size={12} className="animate-spin"/> : "Generate Region for Selection"}
                                    </button>
                                </div>
                            </div>

                            {/* Show Editor if all selected hexes belong to the same region (e.g. just created) */}
                            {commonRegionId && regions[commonRegionId] && (
                                <div className="mt-3">
                                    <RegionEditor 
                                        region={regions[commonRegionId]} 
                                        onUpdate={(newData) => handleRegionUpdate(commonRegionId, newData)}
                                        onRunEncounter={runEncounterRoutine}
                                    />
                                </div>
                            )}
                        </div>
                        
                        <hr className="border-slate-100 my-4"/>

                        {/* Danger Zone */}
                        <div>
                            <h4 className="text-xs font-bold text-red-500 uppercase mb-2">Actions</h4>
                            <button 
                                onClick={(e) => handleClearHexes(e)}
                                className="w-full flex items-center justify-center gap-2 p-2 border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm"
                            >
                                <Eraser size={16} />
                                Clear Hex Content
                            </button>
                        </div>
                        </>
                    )}
                </div>
              )}
           </div>

           {/* Event Log */}
           {activeTool === TOOLS.SELECT && (
               <div className="h-48 border-t border-slate-200 bg-slate-50 flex flex-col shrink-0">
                 <div className="p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                    Session Log
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {logs.map((l) => (
                        <div key={l.id} className="text-xs border-b border-slate-100 last:border-0 pb-1 mb-1">
                            <span className="text-slate-400 mr-2">{l.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                            <span className={`${
                                l.type === 'error' || l.type === 'alert' ? 'text-red-600 font-bold' : 
                                l.type === 'success' ? 'text-emerald-600' : 'text-slate-700'
                            }`}>
                                {l.text}
                            </span>
                        </div>
                    ))}
                 </div>
              </div>
           )}
        </aside>

        {/* Center: Canvas */}
        <main 
            ref={mainRef}
            className={`flex-1 bg-slate-200 overflow-auto relative ${
                isPanning ? 'cursor-move' : 'cursor-default'
            }`}
            onMouseDown={handleMainMouseDown}
            onMouseMove={handleMainMouseMove}
        >
          <div className="relative shadow-2xl rounded-lg overflow-hidden bg-slate-100 border border-slate-300 pointer-events-auto inline-block m-8">
             {renderGrid()}
          </div>
        </main>
      </div>
    </div>
  );
}