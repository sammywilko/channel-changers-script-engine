import React, { useState } from 'react';
import { X, Layout, Plus, GripVertical, Trash } from 'lucide-react';
import { ProjectData } from '../types';
import { MentionableInput } from './MentionableInput';

interface BeatBoardProps {
  data: ProjectData;
  onUpdateBeats: (beats: string[]) => void;
  onClose: () => void;
}

const BeatBoard: React.FC<BeatBoardProps> = ({ data, onUpdateBeats, onClose }) => {
  const [beats, setBeats] = useState<string[]>(data.beats || []);
  const [newBeat, setNewBeat] = useState("");

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (sourceIndex === targetIndex) return;

    const newBeats = [...beats];
    const [moved] = newBeats.splice(sourceIndex, 1);
    newBeats.splice(targetIndex, 0, moved);
    setBeats(newBeats);
    onUpdateBeats(newBeats);
  };

  const addBeat = () => {
    if (!newBeat.trim()) return;
    const updated = [...beats, newBeat];
    setBeats(updated);
    onUpdateBeats(updated);
    setNewBeat("");
  };

  const deleteBeat = (index: number) => {
    const updated = beats.filter((_, i) => i !== index);
    setBeats(updated);
    onUpdateBeats(updated);
  };

  const updateBeatText = (index: number, text: string) => {
    const updated = [...beats];
    updated[index] = text;
    setBeats(updated);
  };

  const handleBlur = () => {
      onUpdateBeats(beats);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex-none h-16 bg-cinematic-900 border-b border-cinematic-700 flex items-center justify-between px-6">
         <div className="flex items-center gap-3">
             <Layout className="text-cinematic-gold" />
             <h1 className="font-bold text-white text-lg">Interactive Beat Board</h1>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-cinematic-800 rounded-full text-gray-400 hover:text-white transition-colors">
             <X size={24} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-cinematic-900/50">
        <div className="max-w-4xl mx-auto space-y-4">
            {beats.length === 0 && (
                <div className="text-center text-gray-500 py-12 border-2 border-dashed border-cinematic-700 rounded-xl">
                    <p>No beats yet. Add specific story moments below.</p>
                </div>
            )}

            {beats.map((beat, index) => (
                <div 
                    key={index} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="bg-cinematic-800 p-4 rounded-lg border border-cinematic-700 flex items-start gap-4 shadow-md hover:border-cinematic-500 transition-colors group cursor-grab active:cursor-grabbing"
                >
                    <div className="mt-1 text-cinematic-500 cursor-grab">
                        <GripVertical size={20} />
                    </div>
                    <div className="flex-none w-8 h-8 bg-cinematic-900 rounded-full flex items-center justify-center font-mono text-xs text-cinematic-gold border border-cinematic-700">
                        {index + 1}
                    </div>
                    <div className="flex-1">
                        <MentionableInput
                            sourceApp="script-engine"
                            projectId={data.id}
                            contextType="beat"
                            contextId={`beat-${index}`}
                            allowCreate={true}
                        >
                            {(ref) => (
                                <textarea
                                    ref={ref as React.RefObject<HTMLTextAreaElement>}
                                    value={beat}
                                    onChange={(e) => updateBeatText(index, e.target.value)}
                                    onBlur={handleBlur}
                                    className="w-full bg-transparent text-gray-200 resize-none focus:outline-none focus:text-white text-sm md:text-base"
                                    rows={Math.max(2, Math.ceil(beat.length / 80))}
                                />
                            )}
                        </MentionableInput>
                    </div>
                    <button onClick={() => deleteBeat(index)} className="text-cinematic-600 hover:text-red-500 transition-colors">
                        <Trash size={18} />
                    </button>
                </div>
            ))}

            <div className="flex gap-4 mt-8">
                <input 
                    type="text" 
                    value={newBeat}
                    onChange={(e) => setNewBeat(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBeat()}
                    placeholder="Enter new plot beat..."
                    className="flex-1 bg-cinematic-800 border border-cinematic-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cinematic-500"
                />
                <button 
                    onClick={addBeat}
                    disabled={!newBeat.trim()}
                    className="bg-cinematic-accent hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Plus size={20} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BeatBoard;