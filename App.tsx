import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, Mic, LayoutGrid, FileText, History, Save, MapPin, Layout, Upload, Download, Cloud, CloudOff, Loader2 } from 'lucide-react';
import PhaseIndicator from './components/PhaseIndicator';
import ChatInterface from './components/ChatInterface';
import ProjectSidebar from './components/ProjectSidebar';
import LiveRoom from './components/LiveRoom';
import StoryboardView from './components/StoryboardView';
import ScriptEditor from './components/ScriptEditor';
import VersionHistory from './components/VersionHistory';
import LocationScout from './components/LocationScout';
import BeatBoard from './components/BeatBoard';
import ScriptImportModal from './components/ScriptImportModal';
import { initializeChat, sendMessageToGemini, generateConceptArt } from './services/geminiService';
import { syncProject, isSyncAvailable, SyncStatus } from './services/syncService';
import { Message, Phase, ProjectState, Snapshot, CharacterProfile, VisualAsset } from './types';
import { INITIAL_PROJECT_DATA } from './constants';

function App() {
  // Project ID for Supabase sync (generate once per browser session)
  const [projectId] = useState<string>(() => {
    const savedId = localStorage.getItem('cc_project_id');
    if (savedId) return savedId;
    const newId = crypto.randomUUID();
    localStorage.setItem('cc_project_id', newId);
    return newId;
  });

  // Cloud sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isSyncAvailable() ? 'idle' : 'offline'
  );

  const [projectState, setProjectState] = useState<ProjectState>(() => {
    const saved = localStorage.getItem('cc_project_state');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed ? {
        ...parsed,
        data: {
            ...INITIAL_PROJECT_DATA,
            ...parsed.data,
            visuals: parsed.data.visuals || []
        }
    } : {
      currentPhase: Phase.DevelopmentHell,
      data: INITIAL_PROJECT_DATA,
    };
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isStoryboardMode, setIsStoryboardMode] = useState(false);
  const [isScriptMode, setIsScriptMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLocationScoutOpen, setIsLocationScoutOpen] = useState(false);
  const [isBeatBoardOpen, setIsBeatBoardOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Save to localStorage AND sync to Supabase (debounced)
  useEffect(() => {
    // Always save locally first (instant)
    localStorage.setItem('cc_project_state', JSON.stringify(projectState));

    // Sync to cloud (debounced - 2 second delay)
    if (isSyncAvailable()) {
      syncProject(projectId, projectState, setSyncStatus);
    }
  }, [projectState, projectId]);

  const saveSnapshot = (label: string = "Auto-Save") => {
    const newSnapshot: Snapshot = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        label,
        data: projectState.data
    };
    setProjectState(prev => ({
        ...prev,
        data: {
            ...prev.data,
            snapshots: [...prev.data.snapshots, newSnapshot]
        }
    }));
  };

  const restoreSnapshot = (snap: Snapshot) => {
      if(confirm(`Restore version "${snap.label}" from ${new Date(snap.timestamp).toLocaleString()}? Current unsaved progress will be lost.`)) {
          setProjectState(prev => ({ ...prev, data: snap.data }));
          setIsHistoryOpen(false);
      }
  };

  const deleteSnapshot = (id: string) => {
      setProjectState(prev => ({
          ...prev,
          data: {
              ...prev.data,
              snapshots: prev.data.snapshots.filter(s => s.id !== id)
          }
      }));
  };

  const handleScriptImport = (script: string, characters: string[], locations: string[], beats: string[]) => {
    setProjectState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        scriptContent: script,
        characters: Array.from(new Set([...prev.data.characters, ...characters])),
        locations: Array.from(new Set([...prev.data.locations, ...locations])),
        beats: [
          ...prev.data.beats,
          ...beats
        ]
      }
    }));
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      content: `📄 **Script Imported Successfully!**\n\n• ${characters.length} characters detected\n• ${locations.length} locations identified\n• ${beats.length} action beats extracted\n\nThe script has been loaded into the Script Editor.`,
      timestamp: Date.now()
    }]);
    
    setIsImportModalOpen(false);
  };

  const handleVisualUpload = async (files: File[]) => {
      const newVisualAssets: VisualAsset[] = [];
      for (const file of files) {
           const reader = new FileReader();
           await new Promise<void>((resolve) => {
               reader.onload = (e) => {
                   if (e.target?.result) {
                       const base64 = (e.target.result as string).split(',')[1];
                       newVisualAssets.push({
                           id: Date.now().toString() + Math.random().toString(),
                           type: 'reference',
                           data: base64,
                           label: file.name,
                           timestamp: Date.now()
                       });
                   }
                   resolve();
               };
               reader.readAsDataURL(file);
           });
       }
       if (newVisualAssets.length > 0) {
            setProjectState(prev => ({
                ...prev,
                data: {
                    ...prev.data,
                    visuals: [...prev.data.visuals, ...newVisualAssets]
                }
            }));
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                content: `*Added ${newVisualAssets.length} new reference image(s) to the Project Bible.*`,
                timestamp: Date.now()
            }]);
       }
  };

  useEffect(() => {
    const warmupApi = async () => {
      try {
        await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'warmup', model: 'gemini-3-flash-preview' })
        }).catch(() => {});
      } catch (e) {}
    };
    warmupApi();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeChat();
        if (messages.length === 0) {
            setIsLoading(true);
            const { text } = await sendMessageToGemini("SYSTEM_START: Begin the interaction as Channel Changers. Greet the user.");
            const startMsg: Message = {
            id: Date.now().toString(),
            role: 'model',
            content: text,
            timestamp: Date.now(),
            };
            setMessages([startMsg]);
            setIsLoading(false);
        }
      } catch (err) {
        console.error("Initialization failed", err);
      }
    };
    init();
  }, []);

  const handleSendMessage = useCallback(async (text: string, files: File[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      images: [] 
    };

    const imageParts: { inlineData: { data: string; mimeType: string } }[] = [];
    const newVisualAssets: VisualAsset[] = [];

    if (files.length > 0) {
       for (const file of files) {
           const reader = new FileReader();
           await new Promise<void>((resolve) => {
               reader.onload = (e) => {
                   if (e.target?.result) {
                       const base64 = (e.target.result as string).split(',')[1];
                       newMessage.images?.push(base64);
                       imageParts.push({ inlineData: { data: base64, mimeType: file.type } });
                       newVisualAssets.push({
                           id: Date.now().toString() + Math.random().toString(),
                           type: 'reference',
                           data: base64,
                           label: file.name,
                           timestamp: Date.now()
                       });
                   }
                   resolve();
               };
               reader.readAsDataURL(file);
           });
       }
    }

    if (newVisualAssets.length > 0) {
        setProjectState(prev => ({
            ...prev,
            data: { ...prev.data, visuals: [...prev.data.visuals, ...newVisualAssets] }
        }));
    }

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const { text: responseText, dataUpdate } = await sendMessageToGemini(text, imageParts);

      if (dataUpdate) {
        setProjectState((prevState) => {
          const newData = { ...prevState.data };
          if (dataUpdate.title) newData.title = dataUpdate.title;
          if (dataUpdate.logline) newData.logline = dataUpdate.logline;
          if (dataUpdate.format) newData.format = dataUpdate.format;
          if (dataUpdate.tone) newData.tone = dataUpdate.tone;
          if (dataUpdate.addCharacters) {
             newData.characters = Array.from(new Set([...newData.characters, ...dataUpdate.addCharacters]));
          }
          if (dataUpdate.addCharacterProfiles) {
             const currentProfiles = [...(newData.characterProfiles || [])];
             dataUpdate.addCharacterProfiles.forEach((p: CharacterProfile) => {
                 const idx = currentProfiles.findIndex(cp => cp.name === p.name);
                 if (idx >= 0) currentProfiles[idx] = { ...currentProfiles[idx], ...p };
                 else currentProfiles.push(p);
             });
             newData.characterProfiles = currentProfiles;
          }
          if (dataUpdate.addLocations) {
             newData.locations = Array.from(new Set([...newData.locations, ...dataUpdate.addLocations]));
          }
          if (dataUpdate.addBeats) {
             newData.beats = [...newData.beats, ...dataUpdate.addBeats];
          }
          if (dataUpdate.scenesWrittenIncrement) {
             newData.scenesWritten += dataUpdate.scenesWrittenIncrement;
          }
          if (dataUpdate.scriptAppend) {
              const prevScript = newData.scriptContent || "";
              newData.scriptContent = prevScript + (prevScript ? "\n\n" : "") + dataUpdate.scriptAppend;
          }
          return { ...prevState, data: newData };
        });
      }

      const responseMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, responseMsg]);

      if (dataUpdate?.generateImagePrompt) {
        try {
            const imageData = await generateConceptArt(dataUpdate.generateImagePrompt);
            const imageMsg: Message = {
                id: (Date.now() + 2).toString(),
                role: 'model',
                content: `**VISUAL PRODUCTION ASSET**\n\nPrompt: _${dataUpdate.generateImagePrompt}_`,
                timestamp: Date.now(),
                generatedImage: imageData
            };
            setMessages((prev) => [...prev, imageMsg]);
            const generatedAsset: VisualAsset = {
                id: (Date.now() + 3).toString(),
                type: 'generated',
                data: imageData,
                label: dataUpdate.generateImagePrompt.length > 50 
                    ? dataUpdate.generateImagePrompt.substring(0, 50) + "..." 
                    : dataUpdate.generateImagePrompt,
                timestamp: Date.now()
            };
            setProjectState(prev => ({
                ...prev,
                data: { ...prev.data, visuals: [...prev.data.visuals, generatedAsset] }
            }));
        } catch (imgErr) {
            console.error(imgErr);
        }
      }

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I encountered a production error. Let's try that again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePhase = (newPhase: Phase) => {
    setProjectState(prev => ({ ...prev, currentPhase: newPhase }));
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white font-sans overflow-hidden">
      <header className="flex-none h-16 bg-cinematic-900 border-b border-cinematic-700 flex items-center justify-between px-4 z-20 shadow-xl">
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-cinematic-accent rounded flex items-center justify-center font-bold text-white shadow-lg">CC</div>
            <h1 className="font-bold tracking-tight hidden md:block">CHANNEL CHANGERS <span className="text-cinematic-500 font-normal">| Script Engine</span></h1>
        </div>
        
        <div className="hidden md:flex space-x-2">
            <button 
                onClick={() => changePhase(Math.max(1, projectState.currentPhase - 1))}
                className="text-xs text-cinematic-400 hover:text-white px-2 py-1"
                disabled={projectState.currentPhase === 1}
            >
                PREV
            </button>
            <span className="text-xs font-mono text-cinematic-gold border border-cinematic-600 px-2 py-1 rounded bg-cinematic-800">
                PHASE {projectState.currentPhase}
            </span>
            <button 
                onClick={() => changePhase(Math.min(5, projectState.currentPhase + 1))}
                className="text-xs text-cinematic-400 hover:text-white px-2 py-1"
                disabled={projectState.currentPhase === 5}
            >
                NEXT
            </button>
        </div>

        <div className="flex items-center gap-2">
            {/* Cloud Sync Status Indicator */}
            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs" title={
              syncStatus === 'synced' ? 'Synced to cloud' :
              syncStatus === 'syncing' ? 'Syncing...' :
              syncStatus === 'error' ? 'Sync error' :
              syncStatus === 'offline' ? 'Offline mode' : 'Ready'
            }>
              {syncStatus === 'syncing' && <Loader2 size={14} className="animate-spin text-blue-400" />}
              {syncStatus === 'synced' && <Cloud size={14} className="text-green-400" />}
              {syncStatus === 'error' && <CloudOff size={14} className="text-red-400" />}
              {syncStatus === 'offline' && <CloudOff size={14} className="text-cinematic-500" />}
              {syncStatus === 'idle' && <Cloud size={14} className="text-cinematic-500" />}
            </div>

            <button
                onClick={() => saveSnapshot(`Manual Save ${new Date().toLocaleTimeString()}`)}
                className="p-2 text-cinematic-400 hover:text-green-400 transition-colors"
                title="Quick Save"
            >
                <Save size={20}/>
            </button>
            <button 
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 text-cinematic-400 hover:text-white transition-colors"
                title="Version History"
            >
                <History size={20} />
            </button>
            
            <div className="h-6 w-[1px] bg-cinematic-700 mx-1"></div>

            {/* 🆕 IMPORT/EXPORT BUTTON */}
            <button 
                onClick={() => setIsImportModalOpen(true)} 
                className="p-2 text-green-400 hover:text-green-300 hover:bg-cinematic-800 rounded-full hidden sm:block" 
                title="Import/Export Script"
            >
                <Upload size={20} />
            </button>

            <button onClick={() => setIsLocationScoutOpen(true)} className="p-2 text-cinematic-400 hover:text-white hover:bg-cinematic-800 rounded-full hidden sm:block" title="Location Scout">
                <MapPin size={20} />
            </button>
            <button onClick={() => setIsBeatBoardOpen(true)} className="p-2 text-cinematic-400 hover:text-white hover:bg-cinematic-800 rounded-full hidden sm:block" title="Beat Board">
                <Layout size={20} />
            </button>

            <button 
                onClick={() => setIsScriptMode(true)}
                className="p-2 text-cinematic-400 hover:text-white hover:bg-cinematic-800 rounded-full transition-colors hidden sm:block"
                title="Script Editor"
            >
                <FileText size={20} />
            </button>
            <button 
                onClick={() => setIsStoryboardMode(true)}
                className="p-2 text-cinematic-400 hover:text-white hover:bg-cinematic-800 rounded-full transition-colors hidden sm:block"
                title="Storyboard Mode"
            >
                <LayoutGrid size={20} />
            </button>
            <button 
                onClick={() => setIsLiveMode(true)}
                className="p-2 text-cinematic-accent hover:bg-cinematic-accent/10 rounded-full transition-colors animate-pulse"
                title="Live Writers Room"
            >
                <Mic size={20} />
            </button>
            <div className="h-6 w-[1px] bg-cinematic-700 mx-2 hidden lg:block"></div>
            <button 
                className="p-2 text-cinematic-400 hover:text-white lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                <Menu />
            </button>
        </div>
      </header>

      <PhaseIndicator currentPhase={projectState.currentPhase} />

      <div className="flex-1 flex overflow-hidden relative">
        <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
        />
        
        <ProjectSidebar 
            data={projectState.data}
            isOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onUpload={handleVisualUpload}
        />
      </div>

      {isLiveMode && <LiveRoom onClose={() => setIsLiveMode(false)} />}
      
      {isLocationScoutOpen && (
          <LocationScout 
            onAddLocation={(loc) => {
                setProjectState(prev => ({
                    ...prev,
                    data: { ...prev.data, locations: [...prev.data.locations, loc] }
                }));
            }} 
            onClose={() => setIsLocationScoutOpen(false)} 
          />
      )}

      {isBeatBoardOpen && (
          <BeatBoard 
            data={projectState.data}
            onUpdateBeats={(beats) => {
                setProjectState(prev => ({
                    ...prev,
                    data: { ...prev.data, beats }
                }));
            }}
            onClose={() => setIsBeatBoardOpen(false)}
          />
      )}
      
      {isStoryboardMode && (
          <StoryboardView data={projectState.data} onClose={() => setIsStoryboardMode(false)} />
      )}
      
      {isScriptMode && (
          <ScriptEditor 
            data={projectState.data} 
            onUpdateScript={(newContent) => {
                setProjectState(prev => ({
                    ...prev,
                    data: { ...prev.data, scriptContent: newContent }
                }));
            }}
            onClose={() => setIsScriptMode(false)} 
          />
      )}

      {isHistoryOpen && (
          <VersionHistory 
            snapshots={projectState.data.snapshots || []}
            onRestore={restoreSnapshot}
            onDelete={deleteSnapshot}
            onClose={() => setIsHistoryOpen(false)}
          />
      )}

      {/* 🆕 IMPORT/EXPORT MODAL */}
      <ScriptImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleScriptImport}
        currentProject={projectState.data}
      />
    </div>
  );
}

export default App;
