import React, { useState, useEffect } from 'react';
import { Check, Dices, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Region, TableEntry } from '../types';

interface RegionEditorProps {
    region: Region;
    onUpdate: (updatedRegion: Region) => void;
    onRunEncounter: (region: Region) => void;
}

const RegionEditor: React.FC<RegionEditorProps> = ({ region, onUpdate, onRunEncounter }) => {
  if (!region) return null;

  // Local state to buffer changes and prevent lag
  const [tempColor, setTempColor] = useState(region.color || "#8b5cf6");
  const [localName, setLocalName] = useState(region.name);
  const [localTrigger, setLocalTrigger] = useState(region.freqConfig.triggerValues.join(', '));
  const [localLore, setLocalLore] = useState(region.lore || "");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync local state when the region prop changes (e.g. switching selection or undo)
  useEffect(() => {
    setTempColor(region.color || "#8b5cf6");
  }, [region.color]);

  useEffect(() => {
    setLocalName(region.name);
  }, [region.name]);
  
  useEffect(() => {
      setLocalLore(region.lore || "");
  }, [region.lore]);

  useEffect(() => {
      // Re-format array to string only if the array actually changed significantly 
      setLocalTrigger(region.freqConfig.triggerValues.join(', '));
  }, [region.freqConfig.triggerValues]);

  const updateField = (field: keyof Region, val: any) => {
    onUpdate({ ...region, [field]: val });
  };
  
  const applyColor = () => {
    updateField('color', tempColor);
  };

  const updateTable = (newTable: TableEntry[]) => {
    onUpdate({ ...region, table: newTable });
  };

  const updateFreqTrigger = (valStr: string) => {
     const vals: number[] = [];
     const parts = valStr.split(',');
     
     parts.forEach(part => {
         if (part.includes('-')) {
             // Handle Range (e.g. "1-12")
             const rangeParts = part.split('-').map(n => parseInt(n.trim()));
             if (rangeParts.length === 2 && !isNaN(rangeParts[0]) && !isNaN(rangeParts[1])) {
                 const min = Math.min(rangeParts[0], rangeParts[1]);
                 const max = Math.max(rangeParts[0], rangeParts[1]);
                 for(let i = min; i <= max; i++) vals.push(i);
             }
         } else {
             // Handle Single Number (e.g. "1")
             const num = parseInt(part.trim());
             if (!isNaN(num)) vals.push(num);
         }
     });

     // Deduplicate and sort
     const uniqueVals = [...new Set(vals)].sort((a, b) => a - b);

     onUpdate({ 
        ...region, 
        freqConfig: { ...region.freqConfig, triggerValues: uniqueVals } 
     });
  };

  const recalculateRanges = (rows: TableEntry[]): TableEntry[] => {
    const count = Number(region.diceConfig.count) || 1;
    const faces = Number(region.diceConfig.faces) || 6;
    
    const minRoll = count;
    const maxRoll = count * faces;
    const totalRange = maxRoll - minRoll + 1;
    
    const targetRowCount = rows.length;
    if (targetRowCount === 0) return [];
    
    const baseSize = Math.floor(totalRange / targetRowCount);
    const remainder = totalRange % targetRowCount;
    
    const newTable: TableEntry[] = [];
    let currentStart = minRoll;

    for (let i = 0; i < targetRowCount; i++) {
        // Distribute remainder to first rows
        const extra = i < remainder ? 1 : 0;
        const size = Math.max(1, baseSize + extra);
        
        // Calculate end, ensuring we don't exceed maxRoll
        const currentEnd = Math.min(maxRoll, currentStart + size - 1);
        const effectiveStart = Math.min(currentStart, maxRoll);

        newTable.push({
            range: [effectiveStart, currentEnd],
            result: rows[i].result
        });
        
        currentStart = currentEnd + 1;
    }
    return newTable;
  };

  const handleAddRow = () => {
    const newRows = [...region.table, { range: [0, 0], result: "New Entry" } as TableEntry];
    const newTable = recalculateRanges(newRows);
    onUpdate({ ...region, table: newTable });
  };

  const handleDeleteRow = (idx: number) => {
      const newRows = region.table.filter((_, i) => i !== idx);
      const newTable = recalculateRanges(newRows);
      onUpdate({ ...region, table: newTable });
  };

  const handleAIGenerate = async () => {
      if (region.table.length === 0) return;
      
      setIsGenerating(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Generate ${region.table.length} distinct, creative random encounter scenarios for a fantasy RPG region.
          
          Region Name: "${region.name}"
          Region Lore/Description: "${region.lore || "Generic fantasy setting"}"
          
          The encounters should fit the theme and lore. Keep descriptions concise (under 15 words) suitable for a lookup table.`;
  
          const response = await ai.models.generateContent({
               model: 'gemini-2.5-flash',
               contents: prompt,
               config: {
                   responseMimeType: 'application/json',
                   responseSchema: {
                       type: Type.ARRAY,
                       items: { type: Type.STRING }
                   }
               }
          });
          
          const generatedText = response.text;
          if (generatedText) {
            const generated = JSON.parse(generatedText);
            if (Array.isArray(generated)) {
                const newTable = region.table.map((row, i) => ({
                    ...row,
                    result: generated[i] !== undefined ? generated[i] : row.result
                }));
                onUpdate({ ...region, table: newTable });
            }
          }
      } catch (err) {
          console.error("AI Generation failed", err);
          alert("Failed to generate encounters. Check console for details.");
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="bg-white p-3 rounded-md border border-slate-200 mt-2 space-y-3">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">Region Name & Color</label>
        <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1 shrink-0">
                <input 
                    type="color" 
                    className="h-8 w-10 p-0 border rounded cursor-pointer"
                    value={tempColor}
                    onChange={(e) => setTempColor(e.target.value)}
                />
                <button 
                    onClick={applyColor}
                    className="h-8 w-8 flex items-center justify-center bg-green-50 text-green-600 border border-green-200 rounded hover:bg-green-100 transition-colors"
                    title="Confirm Color"
                >
                    <Check size={16} />
                </button>
            </div>
            <input 
              className="w-full p-1 border rounded text-sm" 
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={() => updateField('name', localName)}
              placeholder="Region Name"
              spellCheck
            />
        </div>
      </div>

      {/* Region Lore Section */}
      <div>
         <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Region Lore</label>
         <textarea
            className="w-full h-20 p-2 text-sm border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="History, secrets, or rumors about this region..."
            value={localLore}
            onChange={(e) => setLocalLore(e.target.value)}
            onBlur={() => updateField('lore', localLore)}
            spellCheck
         />
      </div>

      <div className="bg-slate-50 p-2 rounded">
          <h4 className="text-xs font-bold text-slate-500 mb-1">Check Frequency</h4>
          <div className="flex gap-2 text-sm items-center">
              <span>Roll</span>
              <select 
                  className="p-1 border rounded"
                  value={region.freqConfig.die}
                  onChange={(e) => onUpdate({
                      ...region, 
                      freqConfig: { ...region.freqConfig, die: e.target.value } 
                  })}
              >
                  {['d4','d6','d8','d12','d20'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <span>Trigger on:</span>
              <input 
                  className="w-20 p-1 border rounded"
                  placeholder="1, 18-20"
                  value={localTrigger}
                  onChange={(e) => setLocalTrigger(e.target.value)}
                  onBlur={(e) => updateFreqTrigger(e.target.value)}
              />
          </div>
          <p className="text-xs text-slate-400 mt-1">Example: "1-4" triggers on 1, 2, 3, 4.</p>
      </div>

      <div className="bg-slate-50 p-2 rounded">
          <div className="flex justify-between items-center mb-1">
             <h4 className="text-xs font-bold text-slate-500">Encounter Table</h4>
          </div>
          
          <div className="flex gap-2 text-sm items-center mb-2">
              <span>Dice:</span>
              <input 
                type="number" min="1" max="100" 
                className="w-10 p-1 border rounded"
                value={region.diceConfig.count}
                onChange={(e) => onUpdate({ ...region, diceConfig: { ...region.diceConfig, count: parseInt(e.target.value) || 0 } })}
              />
              <span>d</span>
              <select 
                className="p-1 border rounded"
                value={region.diceConfig.faces}
                onChange={(e) => onUpdate({ ...region, diceConfig: { ...region.diceConfig, faces: parseInt(e.target.value) } })}
              >
                <option value="4">4</option>
                <option value="6">6</option>
                <option value="8">8</option>
                <option value="12">12</option>
                <option value="20">20</option>
                <option value="100">100</option>
              </select>
          </div>
          
          <div className="space-y-1">
              {region.table.map((row, idx) => (
                  <TableRowInput 
                    key={idx} 
                    row={row} 
                    onUpdate={(updatedRow) => {
                        const newTable = [...region.table];
                        newTable[idx] = updatedRow;
                        updateTable(newTable);
                    }}
                    onDelete={() => handleDeleteRow(idx)}
                  />
              ))}
          </div>
          
          <div className="flex justify-between items-center mt-2">
              <button 
                  className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                  onClick={handleAddRow}
              >
                  <Plus size={12} className="mr-1"/> Add Row
              </button>

              <button
                onClick={handleAIGenerate}
                disabled={isGenerating || region.table.length === 0}
                className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded border border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-100 transition-colors"
                title="Fill table using AI based on region lore"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                AI Fill
              </button>
          </div>
      </div>
      
      <button 
          className="w-full bg-indigo-600 text-white p-2 rounded text-sm hover:bg-indigo-700 flex justify-center items-center gap-2"
          onClick={() => onRunEncounter(region)}
      >
          <Dices size={16} /> Test Roll Now
      </button>
    </div>
  );
};

// Helper component to manage local state for table rows (avoid losing focus or spamming history)
const TableRowInput: React.FC<{ row: TableEntry, onUpdate: (r: TableEntry) => void, onDelete: () => void }> = ({ row, onUpdate, onDelete }) => {
    const [rangeMin, setRangeMin] = useState(row.range[0].toString());
    const [rangeMax, setRangeMax] = useState(row.range[1].toString());
    const [result, setResult] = useState(row.result);

    useEffect(() => {
        setRangeMin(row.range[0].toString());
        setRangeMax(row.range[1].toString());
        setResult(row.result);
    }, [row]);

    const commit = () => {
        onUpdate({
            range: [parseInt(rangeMin) || 0, parseInt(rangeMax) || 0],
            result
        });
    };

    return (
        <div className="flex gap-1 items-center">
            <input 
                className="w-8 p-1 text-xs border rounded text-center"
                value={rangeMin}
                onChange={(e) => setRangeMin(e.target.value)}
                onBlur={commit}
            />
            <span className="text-xs">-</span>
            <input 
                className="w-8 p-1 text-xs border rounded text-center"
                value={rangeMax}
                onChange={(e) => setRangeMax(e.target.value)}
                onBlur={commit}
            />
            <input 
                className="flex-1 p-1 text-xs border rounded"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                onBlur={commit}
                spellCheck
            />
            <button 
                className="text-red-400 hover:text-red-600"
                onClick={onDelete}
            >
                <Trash2 size={12}/>
            </button>
        </div>
    );
};

export default RegionEditor;