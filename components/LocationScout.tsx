import React, { useState } from 'react';
import { X, MapPin, Search, Plus, Map, Loader2 } from 'lucide-react';
import { scoutLocation } from '../services/geminiService';
import { ProjectData } from '../types';

interface LocationScoutProps {
  onAddLocation: (name: string) => void;
  onClose: () => void;
}

const LocationScout: React.FC<LocationScoutProps> = ({ onAddLocation, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{text: string, grounding: any} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
      if (!query.trim()) return;
      setIsLoading(true);
      try {
          const data = await scoutLocation(query);
          setResults(data);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Helper to extract clean chunks
  const getGroundingChunks = () => {
      if (!results?.grounding?.groundingChunks) return [];
      // Filter for Google Maps chunks
      return results.grounding.groundingChunks.filter((c: any) => c.web?.uri?.includes('google.com/maps') || c.web?.title);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex-none h-16 bg-cinematic-900 border-b border-cinematic-700 flex items-center justify-between px-6">
         <div className="flex items-center gap-3">
             <MapPin className="text-cinematic-gold" />
             <h1 className="font-bold text-white text-lg">Location Scout Mode</h1>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-cinematic-800 rounded-full text-gray-400 hover:text-white transition-colors">
             <X size={24} />
         </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full p-6">
          <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe a location (e.g. 'abandoned warehouse in Berlin with graffiti')..."
                    className="w-full bg-cinematic-800 border border-cinematic-700 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-cinematic-500 text-lg"
                    autoFocus
                  />
              </div>
              <button 
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="bg-cinematic-accent hover:bg-red-700 text-white px-8 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Scout"}
              </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-cinematic-900/50 rounded-xl border border-cinematic-700 p-6">
              {!results && !isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                      <Map size={48} className="opacity-20" />
                      <p>Enter a description to find real-world filming locations via Google Maps.</p>
                  </div>
              )}

              {isLoading && (
                   <div className="h-full flex items-center justify-center">
                       <Loader2 size={40} className="animate-spin text-cinematic-accent" />
                   </div>
              )}

              {results && (
                  <div className="space-y-8">
                      <div className="prose prose-invert max-w-none">
                          <p>{results.text}</p>
                      </div>

                      {results.grounding?.groundingChunks && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {results.grounding.groundingChunks.map((chunk: any, i: number) => {
                                  // Depending on API version, map chunks structure varies. 
                                  // Assuming web URI format for now as per instructions.
                                  const title = chunk.web?.title || "Location Result";
                                  const uri = chunk.web?.uri;
                                  
                                  if (!uri) return null;

                                  return (
                                      <div key={i} className="bg-cinematic-800 p-4 rounded-lg border border-cinematic-700 hover:border-cinematic-500 transition-colors flex justify-between items-start group">
                                          <div>
                                              <h3 className="font-bold text-white mb-1">{title}</h3>
                                              <a href={uri} target="_blank" rel="noreferrer" className="text-xs text-cinematic-gold hover:underline truncate block max-w-[200px]">
                                                  View on Maps ↗
                                              </a>
                                          </div>
                                          <button 
                                            onClick={() => {
                                                onAddLocation(title);
                                                alert(`Added "${title}" to Project Bible`);
                                            }}
                                            className="p-2 bg-cinematic-700 hover:bg-green-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Add to Bible"
                                          >
                                              <Plus size={16} />
                                          </button>
                                      </div>
                                  )
                              })}
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default LocationScout;