import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, X, Activity } from 'lucide-react';
import { connectLiveSession, disconnectLiveSession } from '../services/liveService';

interface LiveRoomProps {
  onClose: () => void;
}

const LiveRoom: React.FC<LiveRoomProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  
  // To smooth out the visualizer
  const talkTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Start session on mount
    connectLiveSession(
      (talking) => {
        setIsActive(true);
        if (talking) {
            setIsTalking(true);
            if (talkTimeoutRef.current) clearTimeout(talkTimeoutRef.current);
            talkTimeoutRef.current = window.setTimeout(() => setIsTalking(false), 500);
        }
      },
      (err) => setError(err)
    );

    return () => {
      disconnectLiveSession();
      if (talkTimeoutRef.current) clearTimeout(talkTimeoutRef.current);
    };
  }, []);

  const handleClose = async () => {
    await disconnectLiveSession();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
      <button 
        onClick={handleClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-cinematic-800 text-gray-400 hover:text-white hover:bg-cinematic-700 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="text-center space-y-8 max-w-lg px-6">
        <div>
          <h2 className="text-cinematic-gold font-mono tracking-widest text-sm mb-2 uppercase">Live Writers' Room</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight">Immersive Session</h1>
          <p className="text-gray-400 mt-2">Talk out your scenes. I'm listening.</p>
        </div>

        {/* Visualizer Orb */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full border-2 border-cinematic-accent/30 transition-all duration-300 ${isTalking ? 'scale-110 opacity-100' : 'scale-100 opacity-50'}`}></div>
          <div className={`absolute inset-4 rounded-full border border-cinematic-accent/50 transition-all duration-500 ${isTalking ? 'scale-105 opacity-100' : 'scale-100 opacity-40'}`}></div>
          
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-cinematic-accent to-cinematic-900 shadow-[0_0_30px_rgba(229,9,20,0.5)] flex items-center justify-center transition-all duration-200 ${isTalking ? 'scale-110 brightness-125' : 'scale-100'}`}>
            <Mic size={48} className="text-white" />
          </div>
          
          {/* Ripple Effects when talking */}
          {isTalking && (
             <>
                <div className="absolute inset-0 rounded-full border border-cinematic-gold/50 animate-ping opacity-20"></div>
                <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping delay-75 opacity-10"></div>
             </>
          )}
        </div>

        {error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-cinematic-400">
             <Activity size={16} className={isActive ? "animate-pulse text-green-500" : ""} />
             <span className="text-sm font-mono">{isActive ? "LINK ESTABLISHED" : "CONNECTING..."}</span>
          </div>
        )}

        <div className="pt-8">
            <button 
                onClick={handleClose}
                className="bg-cinematic-800 hover:bg-cinematic-700 text-white px-8 py-3 rounded-full font-medium transition-colors border border-cinematic-600"
            >
                End Session
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveRoom;