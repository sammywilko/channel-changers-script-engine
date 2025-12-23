import React, { useState, useEffect, useRef } from 'react';
import { Save, Download, Play, AlertTriangle, Eye, Mic, List, ChevronRight, Sparkles, X } from 'lucide-react';
import { generateTableRead, checkContinuity, analyzeSubtext, punchUpScript } from '../services/geminiService';
import { ProjectData } from '../types';

interface ScriptEditorProps {
  data: ProjectData;
  onUpdateScript: (newScript: string) => void;
  onClose: () => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ data, onUpdateScript, onClose }) => {
  const [script, setScript] = useState(data.scriptContent || "");
  const [navigationItems, setNavigationItems] = useState<{line: number, text: string}[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'none' | 'subtext' | 'continuity'>('none');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Context Menu State
  const [selection, setSelection] = useState<{text: string, start: number, end: number} | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [isPunchingUp, setIsPunchingUp] = useState(false);

  // Sync internal state
  useEffect(() => {
    if (data.scriptContent && data.scriptContent !== script) {
        if (script.length === 0) setScript(data.scriptContent);
    }
  }, [data.scriptContent]);

  // Generate Navigation
  useEffect(() => {
    const lines = script.split('\n');
    const nav = lines
      .map((text, idx) => ({ text, line: idx }))
      .filter(item => /^(INT\.|EXT\.|I\/E\.)/.test(item.text.toUpperCase()));
    setNavigationItems(nav);
  }, [script]);

  // Selection Handler
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      if (target.selectionStart !== target.selectionEnd) {
          const text = target.value.substring(target.selectionStart, target.selectionEnd);
          // Only show menu for non-trivial selections
          if (text.trim().length > 3) {
              setSelection({
                  text,
                  start: target.selectionStart,
                  end: target.selectionEnd
              });
              // Simple positioning near the mouse would require MouseEvent, here we just center or use fixed
              // For robustness in this textarea, let's put it in a fixed noticeable spot or compute roughly.
              // Since we can't easily get XY from select event, we'll render a toolbar at the bottom or top of editor.
          }
      } else {
          setSelection(null);
      }
  };

  const applyPunchUp = async (instruction: string) => {
      if (!selection) return;
      setIsPunchingUp(true);
      try {
          const context = script.slice(Math.max(0, selection.start - 500), Math.min(script.length, selection.end + 500));
          const rewritten = await punchUpScript(selection.text, instruction, context);
          
          const newScript = script.substring(0, selection.start) + rewritten + script.substring(selection.end);
          setScript(newScript);
          setSelection(null); // Clear selection
      } catch (e) {
          console.error(e);
      } finally {
          setIsPunchingUp(false);
      }
  };

  const handleExportFountain = () => {
    const element = document.createElement("a");
    const file = new Blob([script], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${data.title.replace(/\s+/g, '_')}_Script.fountain`;
    document.body.appendChild(element);
    element.click();
  };

  const handleTableRead = async () => {
    if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
    }
    
    setIsPlaying(true);
    try {
        const segment = script.slice(0, 3000); 
        const base64Audio = await generateTableRead(segment);
        const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        
        if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            audioRef.current.onended = () => setIsPlaying(false);
        } else {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play();
            audio.onended = () => setIsPlaying(false);
        }
    } catch (e) {
        setIsPlaying(false);
        alert("Could not generate audio table read.");
    }
  };

  const runContinuityCheck = async () => {
    setAnalysisMode('continuity');
    setIsAnalyzing(true);
    try {
        const bibleSummary = `Characters: ${data.characters.join(', ')}. Locations: ${data.locations.join(', ')}.`;
        const result = await checkContinuity(script.slice(0, 5000), bibleSummary);
        setAnalysisResult(result);
    } catch (e) {
        setAnalysisResult("Analysis failed.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const runSubtextAnalysis = async () => {
    setAnalysisMode('subtext');
    setIsAnalyzing(true);
    try {
        const resultJson = await analyzeSubtext(script.slice(0, 3000));
        const parsed = JSON.parse(resultJson);
        setAnalysisResult(parsed);
    } catch (e) {
        setAnalysisResult([]);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const scrollToLine = (lineIdx: number) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
        const lineHeight = 24; 
        textarea.scrollTop = lineIdx * lineHeight;
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Toolbar */}
      <div className="flex-none h-16 bg-cinematic-900 border-b border-cinematic-700 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center space-x-4">
             <h2 className="text-white font-bold tracking-tight">Script Editor</h2>
             <span className="text-cinematic-500 text-sm border-l border-cinematic-700 pl-4">{data.title}</span>
        </div>
        
        <div className="flex items-center space-x-2">
            <button onClick={runContinuityCheck} className={`p-2 rounded hover:bg-cinematic-700 text-cinematic-400 hover:text-white ${analysisMode === 'continuity' ? 'bg-cinematic-700 text-white' : ''}`} title="Continuity Check">
                <AlertTriangle size={18} />
            </button>
            <button onClick={runSubtextAnalysis} className={`p-2 rounded hover:bg-cinematic-700 text-cinematic-400 hover:text-white ${analysisMode === 'subtext' ? 'bg-cinematic-700 text-white' : ''}`} title="Analyze Subtext">
                <Eye size={18} />
            </button>
            <div className="h-6 w-[1px] bg-cinematic-700 mx-2"></div>
            <button onClick={handleTableRead} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${isPlaying ? 'bg-red-900/50 text-red-200 animate-pulse' : 'bg-cinematic-800 hover:bg-cinematic-700 text-white'}`}>
                <Play size={16} /> {isPlaying ? 'Playing...' : 'Table Read'}
            </button>
            <button onClick={handleExportFountain} className="flex items-center gap-2 px-3 py-1.5 bg-cinematic-800 hover:bg-cinematic-700 text-white rounded text-sm font-medium transition-colors">
                <Download size={16} /> Export .fountain
            </button>
            <button onClick={() => { onUpdateScript(script); onClose(); }} className="px-4 py-1.5 bg-cinematic-accent hover:bg-red-700 text-white rounded text-sm font-medium transition-colors ml-2">
                Done
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
         {/* Navigation Sidebar */}
         <div className="w-64 bg-cinematic-900 border-r border-cinematic-700 flex flex-col hidden md:flex">
             <div className="p-3 border-b border-cinematic-800">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                     <List size={12} /> Scenes
                 </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {navigationItems.map((item, i) => (
                     <button 
                        key={i} 
                        onClick={() => scrollToLine(item.line)}
                        className="w-full text-left text-xs text-gray-400 hover:text-white hover:bg-cinematic-800 p-2 rounded truncate transition-colors font-mono"
                     >
                        {item.text}
                     </button>
                 ))}
                 {navigationItems.length === 0 && <p className="text-xs text-gray-600 p-2 italic">No scene headers found.</p>}
             </div>
         </div>

         {/* Editor Area */}
         <div className="flex-1 relative bg-[#E8E8E8] text-black">
             <textarea 
                value={script}
                onChange={(e) => setScript(e.target.value)}
                onSelect={handleSelect}
                className="w-full h-full p-8 md:p-16 font-mono text-base md:text-lg focus:outline-none resize-none screenplay-editor leading-relaxed"
                placeholder="Start writing your masterpiece..."
                spellCheck={false}
             />
             
             {/* Floating Context Menu for Punch-Up */}
             {selection && (
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-cinematic-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-cinematic-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 z-50">
                     <span className="text-xs font-bold text-cinematic-gold flex items-center gap-1">
                         <Sparkles size={12}/> AI PUNCH-UP
                     </span>
                     <div className="h-4 w-[1px] bg-cinematic-700"></div>
                     <button onClick={() => applyPunchUp("Funnier")} className="text-sm hover:text-cinematic-accent transition-colors">Funnier</button>
                     <button onClick={() => applyPunchUp("More Subtext")} className="text-sm hover:text-cinematic-accent transition-colors">Subtext</button>
                     <button onClick={() => applyPunchUp("More Period Accurate")} className="text-sm hover:text-cinematic-accent transition-colors">Period</button>
                     <button onClick={() => applyPunchUp("More Conflict")} className="text-sm hover:text-cinematic-accent transition-colors">Conflict</button>
                     <div className="h-4 w-[1px] bg-cinematic-700"></div>
                     <button onClick={() => setSelection(null)} className="text-gray-500 hover:text-white"><X size={14}/></button>
                 </div>
             )}
             
             {isPunchingUp && (
                 <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center z-50">
                     <div className="bg-cinematic-900 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
                         <div className="animate-spin w-5 h-5 border-2 border-cinematic-accent border-t-transparent rounded-full"></div>
                         <span className="font-mono text-sm">REWRITING SCENE...</span>
                     </div>
                 </div>
             )}

             {/* Analysis Overlay Panel */}
             {analysisMode !== 'none' && (
                 <div className="absolute top-4 right-4 w-80 bg-cinematic-900 border border-cinematic-700 text-white shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[80%] z-40">
                     <div className="bg-cinematic-800 p-3 flex justify-between items-center border-b border-cinematic-700">
                         <span className="font-bold text-sm flex items-center gap-2">
                             {analysisMode === 'subtext' ? <Eye size={14} className="text-blue-400"/> : <AlertTriangle size={14} className="text-yellow-400"/>}
                             {analysisMode === 'subtext' ? 'Subtext Analysis' : 'Continuity Report'}
                         </span>
                         <button onClick={() => setAnalysisMode('none')} className="text-gray-400 hover:text-white"><ChevronRight size={16}/></button>
                     </div>
                     <div className="p-4 overflow-y-auto text-sm text-gray-300">
                         {isAnalyzing ? (
                             <div className="flex items-center gap-2 text-cinematic-400">
                                 <div className="w-2 h-2 bg-cinematic-accent rounded-full animate-bounce"></div>
                                 Analyzing script...
                             </div>
                         ) : (
                             analysisMode === 'subtext' && Array.isArray(analysisResult) ? (
                                 <div className="space-y-4">
                                     {analysisResult.map((item: any, idx: number) => (
                                         <div key={idx} className="border-l-2 border-blue-500 pl-3">
                                             <div className="text-white italic mb-1">"{item.line}"</div>
                                             <div className="text-blue-300 text-xs">{item.subtext}</div>
                                         </div>
                                     ))}
                                     {analysisResult.length === 0 && <p>No significant subtext found in this chunk.</p>}
                                 </div>
                             ) : (
                                 <div className="prose prose-invert prose-sm">
                                     <p className="whitespace-pre-wrap">{analysisResult}</p>
                                 </div>
                             )
                         )}
                     </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default ScriptEditor;