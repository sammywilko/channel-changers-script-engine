/**
 * SCRIPT ENGINE - Script Import Modal
 * 
 * Allows importing scripts from:
 * - PDF files
 * - FDX (Final Draft)
 * - Fountain format
 */

import React, { useState, useRef } from 'react';
import { importScript, exportToDirector, ParsedScript, DirectorExport } from '../services/scriptImportService';
import { exportToDirector as exportCC, downloadExport, CCScriptExport } from '../services/ccIntegrationService';

interface ScriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (script: string, characters: string[], locations: string[], beats: string[]) => void;
  onExportToDirector?: (exportData: CCScriptExport) => void;
  currentProject?: any; // For exporting current project
}

export const ScriptImportModal: React.FC<ScriptImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onExportToDirector,
  currentProject
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ParsedScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      const parsed = await importScript(file);
      setPreview(parsed);
    } catch (err) {
      console.error('Import failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to import script');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (!preview) return;

    // Extract beats from scenes
    const beats: string[] = [];
    preview.scenes.forEach(scene => {
      scene.content.forEach(element => {
        if (element.type === 'action') {
          beats.push(element.content);
        }
      });
    });

    onImport(
      preview.rawText,
      preview.characters,
      preview.locations,
      beats
    );

    setPreview(null);
    onClose();
  };

  const handleExportToDirector = () => {
    if (!currentProject) {
      alert('No project to export');
      return;
    }

    const ccExport = exportCC(currentProject);
    downloadExport(ccExport);
    
    if (onExportToDirector) {
      onExportToDirector(ccExport);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return '📄';
      case 'fdx': return '🎬';
      case 'fountain': return '⛲';
      default: return '📝';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📥 Import / Export Script
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!preview ? (
            <div className="space-y-6">
              {/* Import Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Import Script</h3>
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors"
                >
                  {isImporting ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-gray-400">Parsing script...</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl mb-4">📄</div>
                      <p className="text-gray-300 font-medium">Click to upload script</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Supports: PDF, FDX (Final Draft), Fountain, TXT
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.fdx,.fountain,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {error && (
                  <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Export Section */}
              {currentProject && (
                <div className="pt-6 border-t border-gray-700">
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Export to Director</h3>
                  <button
                    onClick={handleExportToDirector}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    🎬 Export for Director
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Creates a JSON file that Director can import with all characters, locations, and beats.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {getFormatIcon(preview.metadata.format)}
                  {preview.title}
                </h3>
                <span className="text-xs text-gray-500 uppercase">
                  {preview.metadata.format}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{preview.scenes.length}</div>
                  <div className="text-xs text-gray-400">Scenes</div>
                </div>
                <div className="bg-gray-800 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">{preview.characters.length}</div>
                  <div className="text-xs text-gray-400">Characters</div>
                </div>
                <div className="bg-gray-800 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">{preview.locations.length}</div>
                  <div className="text-xs text-gray-400">Locations</div>
                </div>
              </div>

              {/* Characters List */}
              {preview.characters.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Characters</h4>
                  <div className="flex flex-wrap gap-2">
                    {preview.characters.slice(0, 10).map((char, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs">
                        {char}
                      </span>
                    ))}
                    {preview.characters.length > 10 && (
                      <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs">
                        +{preview.characters.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Locations List */}
              {preview.locations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Locations</h4>
                  <div className="flex flex-wrap gap-2">
                    {preview.locations.slice(0, 6).map((loc, i) => (
                      <span key={i} className="px-2 py-1 bg-orange-900/30 text-orange-300 rounded text-xs">
                        {loc}
                      </span>
                    ))}
                    {preview.locations.length > 6 && (
                      <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs">
                        +{preview.locations.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Script Preview */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Preview</h4>
                <div className="bg-gray-800 rounded p-4 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {preview.rawText.substring(0, 1000)}
                    {preview.rawText.length > 1000 && '...'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3 shrink-0">
          {preview ? (
            <>
              <button
                onClick={() => setPreview(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold"
              >
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
              >
                ✓ Import Script
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptImportModal;
