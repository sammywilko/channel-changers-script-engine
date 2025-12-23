import React, { useRef } from 'react';
import { ProjectData } from '../types';
import { FileText, Users, MapPin, Activity, Film, Image as ImageIcon, Camera, Plus } from 'lucide-react';

interface ProjectSidebarProps {
  data: ProjectData;
  isOpen: boolean;
  toggleSidebar: () => void;
  onUpload?: (files: File[]) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ data, isOpen, toggleSidebar, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && onUpload) {
          onUpload(Array.from(e.target.files));
      }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed lg:static inset-y-0 right-0 z-50 w-80 bg-cinematic-900 border-l border-cinematic-700 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex flex-col h-full`}>
        <div className="p-5 border-b border-cinematic-700 bg-cinematic-800/50">
            <h2 className="text-cinematic-gold font-mono font-bold tracking-widest text-sm uppercase">Project Bible</h2>
            <h1 className="text-xl font-bold text-white mt-1 leading-tight">{data.title}</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Overview */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <FileText size={14} className="mr-2" /> Overview
                </h3>
                <div className="space-y-3">
                    <div>
                        <span className="text-gray-400 text-xs block">Format</span>
                        <span className="text-white text-sm">{data.format}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs block">Tone</span>
                        <span className="text-white text-sm">{data.tone}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs block">Logline</span>
                        <p className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-cinematic-500 pl-3 py-1">
                            {data.logline}
                        </p>
                    </div>
                </div>
            </section>

             {/* Visual Board */}
             <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                        <span className="flex items-center"><ImageIcon size={14} className="mr-2" /> Visual Board</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-cinematic-800 px-1.5 py-0.5 rounded text-gray-400">
                            {data.visuals ? data.visuals.length : 0}
                        </span>
                        {onUpload && (
                            <>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    multiple 
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1 hover:bg-cinematic-800 rounded text-cinematic-400 hover:text-white transition-colors"
                                    title="Add Reference Image"
                                >
                                    <Plus size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {data.visuals && data.visuals.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {data.visuals.map((asset) => (
                            <div key={asset.id} className="relative group aspect-square rounded overflow-hidden border border-cinematic-700 bg-black">
                                <img 
                                    src={`data:image/png;base64,${asset.data}`} 
                                    alt={asset.label} 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                    <span className="text-[10px] text-white font-medium truncate">{asset.label}</span>
                                    <span className="text-[9px] text-cinematic-gold uppercase">{asset.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="border border-dashed border-cinematic-700 rounded p-4 text-center hover:border-cinematic-500 transition-colors group cursor-pointer" onClick={() => onUpload && fileInputRef.current?.click()}>
                        <Camera size={20} className="mx-auto text-cinematic-600 mb-2 group-hover:text-cinematic-400" />
                        <p className="text-xs text-gray-500">Upload images or ask AI to generate concept art to build your visual board.</p>
                    </div>
                )}
            </section>

            {/* Characters */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <Users size={14} className="mr-2" /> Cast
                </h3>
                {data.characters.length > 0 ? (
                    <ul className="space-y-2">
                        {data.characters.map((char, i) => (
                            <li key={i} className="text-sm text-gray-300 bg-cinematic-800 p-2 rounded border border-cinematic-700">
                                {char}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-gray-600 italic">No characters locked yet.</p>
                )}
            </section>

            {/* Locations */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <MapPin size={14} className="mr-2" /> Locations
                </h3>
                {data.locations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {data.locations.map((loc, i) => (
                            <span key={i} className="text-xs text-gray-300 bg-cinematic-800 px-2 py-1 rounded border border-cinematic-700">
                                {loc}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-600 italic">No locations locked yet.</p>
                )}
            </section>

            {/* Beats */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <Activity size={14} className="mr-2" /> Beat Map
                </h3>
                {data.beats.length > 0 ? (
                    <ol className="list-decimal pl-4 space-y-1">
                        {data.beats.map((beat, i) => (
                            <li key={i} className="text-xs text-gray-300 pl-1">
                                {beat}
                            </li>
                        ))}
                    </ol>
                ) : (
                     <p className="text-xs text-gray-600 italic">No beats locked yet.</p>
                )}
            </section>

            {/* Stats */}
            <section className="bg-cinematic-800/30 p-3 rounded-lg border border-cinematic-700/50">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 flex items-center"><Film size={12} className="mr-1"/> Scenes Written</span>
                    <span className="text-sm font-mono font-bold text-cinematic-accent">{data.scenesWritten}</span>
                </div>
            </section>
        </div>
      </div>
    </>
  );
};

export default ProjectSidebar;