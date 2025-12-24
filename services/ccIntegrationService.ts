/**
 * SCRIPT ENGINE - Integration Service
 * 
 * Enables data export to Director
 */

export const CC_EXPORT_VERSION = '1.0.0';

export interface CCScriptExport {
  version: string;
  type: 'cc-script-export';
  exportedAt: number;
  exportedFrom: 'script-engine';
  
  script: {
    title: string;
    rawContent: string;
    format: string;
    pageCount?: number;
  };
  
  characters: CCCharacter[];
  locations: CCLocation[];
  beats?: CCBeat[];
  visuals?: CCVisualAsset[];
  
  metadata: {
    phase: number;
    scenesWritten: number;
    tone?: string;
    logline?: string;
  };
}

export interface CCCharacter {
  name: string;
  handle: string;
  role?: string;
  archetype?: string;
  traits?: string[];
  dialogueDNA?: string;
  visuals?: string;
  referenceImages?: string[];
}

export interface CCLocation {
  name: string;
  handle: string;
  interior: boolean;
  timeOfDay?: string;
  visuals?: string;
  referenceImages?: string[];
}

export interface CCBeat {
  id: string;
  sceneNumber: number;
  action: string;
  characters: string[];
  dialogue?: string;
  location: string;
  camera?: string;
  lighting?: string;
  emotion?: string;
}

export interface CCVisualAsset {
  id: string;
  type: 'reference' | 'generated' | 'concept';
  data: string;
  label: string;
  linkedTo?: string;
}

// ============================================
// EXPORT FROM SCRIPT ENGINE PROJECT
// ============================================

export const exportToDirector = (projectData: any): CCScriptExport => {
  const {
    title,
    logline,
    format,
    tone,
    characters,
    characterProfiles,
    locations,
    beats,
    scenesWritten,
    scriptContent,
    visuals,
  } = projectData;
  
  const ccCharacters: CCCharacter[] = (characterProfiles || []).map((cp: any) => ({
    name: cp.name,
    handle: `@${cp.name.replace(/\s/g, '')}`,
    archetype: cp.archetype,
    dialogueDNA: cp.dialogueDNA,
    traits: [],
    visuals: `Character: ${cp.name}`,
  }));
  
  (characters || []).forEach((name: string) => {
    if (!ccCharacters.find(c => c.name === name)) {
      ccCharacters.push({
        name,
        handle: `@${name.replace(/\s/g, '')}`,
        visuals: `Character: ${name}`,
      });
    }
  });
  
  const ccLocations: CCLocation[] = (locations || []).map((loc: string) => {
    const isInt = loc.toUpperCase().startsWith('INT');
    return {
      name: loc,
      handle: `@${loc.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '')}`,
      interior: isInt,
      visuals: `Location: ${loc}`,
    };
  });
  
  const ccBeats: CCBeat[] = (beats || []).map((beat: string, idx: number) => ({
    id: `beat_${Date.now()}_${idx}`,
    sceneNumber: Math.floor(idx / 3) + 1,
    action: beat,
    characters: [],
    location: 'UNKNOWN',
  }));
  
  const ccVisuals: CCVisualAsset[] = (visuals || []).map((v: any) => ({
    id: v.id,
    type: v.type === 'generated' ? 'generated' : 'reference',
    data: v.data,
    label: v.label,
  }));
  
  return {
    version: CC_EXPORT_VERSION,
    type: 'cc-script-export',
    exportedAt: Date.now(),
    exportedFrom: 'script-engine',
    script: {
      title: title || 'Untitled',
      rawContent: scriptContent || '',
      format: 'custom',
    },
    characters: ccCharacters,
    locations: ccLocations,
    beats: ccBeats,
    visuals: ccVisuals,
    metadata: {
      phase: 0,
      scenesWritten: scenesWritten || 0,
      tone,
      logline,
    },
  };
};

// ============================================
// DOWNLOAD EXPORT FILE
// ============================================

export const downloadExport = (data: CCScriptExport) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.script.title}_director-export.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
