import React from 'react';
import { Clock, RotateCcw, Trash2, X } from 'lucide-react';
import { Snapshot } from '../types';

interface VersionHistoryProps {
  snapshots: Snapshot[];
  onRestore: (snapshot: Snapshot) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ snapshots, onRestore, onDelete, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-cinematic-900 border border-cinematic-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-cinematic-800 flex justify-between items-center bg-cinematic-800/50">
            <h2 className="text-white font-bold flex items-center gap-2">
                <Clock size={18} className="text-cinematic-gold"/> Version History
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {snapshots.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    <p>No snapshots saved yet.</p>
                </div>
            ) : (
                snapshots.slice().reverse().map((snap) => (
                    <div key={snap.id} className="bg-cinematic-800 p-3 rounded-lg border border-cinematic-700 flex justify-between items-center group">
                        <div>
                            <div className="text-white font-medium text-sm">{snap.label}</div>
                            <div className="text-xs text-gray-500 font-mono">
                                {new Date(snap.timestamp).toLocaleString()} • {snap.data.scenesWritten} scenes
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => onRestore(snap)}
                                className="p-2 bg-cinematic-700 hover:bg-cinematic-600 rounded text-green-400"
                                title="Restore this version"
                            >
                                <RotateCcw size={16} />
                            </button>
                            <button 
                                onClick={() => onDelete(snap.id)}
                                className="p-2 bg-cinematic-700 hover:bg-cinematic-600 rounded text-red-400"
                                title="Delete snapshot"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
