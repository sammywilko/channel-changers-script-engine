import React, { useState } from 'react';
import { X, Film, RefreshCw, Download, Sparkles } from 'lucide-react';
import { ProjectData } from '../types';
import { generateConceptArt } from '../services/geminiService';

interface StoryboardViewProps {
  data: ProjectData;
  onClose: () => void;
}

const StoryboardView: React.FC<StoryboardViewProps> = ({ data, onClose }) => {
  const [images, setImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  // Use top 4 beats or placeholders if empty
  const beatsToVisualize = data.beats.length > 0 
    ? data.beats.slice(0, 4) 
    : ["Inciting Incident (Pending)", "Plot Point 1 (Pending)", "Midpoint (Pending)", "Climax (Pending)"];

  const generatePanel = async (index: number, beat: string) => {
    if (!beat || beat.includes("(Pending)")) return;

    setLoading(prev => ({ ...prev, [index]: true }));
    try {
      // Create a specific storyboard prompt
      const prompt = `Cinematic storyboard sketch, graphic novel style, wide shot. Scene description: ${beat}. High contrast, dramatic lighting, 16:9 aspect ratio.`;
      const base64 = await generateConceptArt(prompt);
      setImages(prev => ({ ...prev, [index]: base64 }));
    } catch (e) {
      console.error("Failed to generate panel", e);
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const generateAll = () => {
    beatsToVisualize.forEach((beat, idx) => {
        if (!beat.includes("Pending")) {
            generatePanel(idx, beat);
        }
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex-none h-16 bg-cinematic-900 border-b border-cinematic-700 flex items-center justify-between px-6">
         <div className="flex items-center gap-3">
             <Film className="text-cinematic-gold" />
             <h1 className="font-bold text-white text-lg">Auto-Storyboard Mode</h1>
         </div>
         <div className="flex items-center gap-4">
             {data.beats.length > 0 && (
                 <button 
                    onClick={generateAll}
                    className="flex items-center gap-2 bg-cinematic-accent hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                 >
                    <Sparkles size={16} /> Generate All
                 </button>
             )}
             <button onClick={onClose} className="p-2 hover:bg-cinematic-800 rounded-full text-gray-400 hover:text-white transition-colors">
                 <X size={24} />
             </button>
         </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
            {data.beats.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 mb-4">No beats detected in the Project Bible.</p>
                    <p className="text-cinematic-gold text-sm">Complete Phase 3 (Structure) to unlock Storyboard Mode.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {beatsToVisualize.map((beat, index) => (
                        <div key={index} className="bg-cinematic-800 rounded-lg border border-cinematic-700 overflow-hidden flex flex-col shadow-xl hover:shadow-2xl transition-shadow">
                            {/* Image Area */}
                            <div className="relative aspect-video bg-black group">
                                {loading[index] ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-cinematic-500">
                                        <RefreshCw className="animate-spin mb-2" />
                                        <span className="text-xs font-mono">RENDERING FRAME {index + 1}</span>
                                    </div>
                                ) : images[index] ? (
                                    <>
                                        <img src={`data:image/png;base64,${images[index]}`} alt={beat} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={`data:image/png;base64,${images[index]}`} download={`panel-${index+1}.png`} className="bg-black/60 p-2 rounded-full text-white hover:bg-black">
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <button 
                                            onClick={() => generatePanel(index, beat)}
                                            className="border border-cinematic-600 text-cinematic-400 px-4 py-2 rounded hover:bg-cinematic-700 hover:text-white transition-colors text-sm"
                                        >
                                            Generate Panel
                                        </button>
                                    </div>
                                )}
                                <div className="absolute top-0 left-0 bg-black/50 backdrop-blur-sm px-3 py-1 text-white font-mono text-xs border-r border-b border-white/10">
                                    PANEL 0{index + 1}
                                </div>
                            </div>
                            
                            {/* Text Area */}
                            <div className="p-4 border-t border-cinematic-700 bg-cinematic-800 relative">
                                <p className="text-gray-200 text-sm leading-relaxed">{beat}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StoryboardView;
