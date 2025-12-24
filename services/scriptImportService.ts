/**
 * SCRIPT ENGINE - Script Import Service
 * 
 * Supports importing scripts from:
 * - PDF files (extracts text)
 * - FDX files (Final Draft XML)
 * - Fountain files (plain text screenplay format)
 */

// ============================================
// TYPES
// ============================================

export interface ParsedScript {
  title?: string;
  authors?: string[];
  rawText: string;
  scenes: ParsedScene[];
  characters: string[];
  locations: string[];
  metadata: ScriptMetadata;
}

export interface ParsedScene {
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  interior: boolean;
  content: SceneElement[];
}

export interface SceneElement {
  type: 'action' | 'dialogue' | 'parenthetical' | 'transition' | 'character';
  content: string;
  character?: string;
}

export interface ScriptMetadata {
  format: 'pdf' | 'fdx' | 'fountain' | 'unknown';
  pageCount?: number;
  importedAt: number;
}

// ============================================
// FOUNTAIN PARSER
// ============================================

const parseFountain = (text: string): ParsedScript => {
  const lines = text.split('\n');
  const scenes: ParsedScene[] = [];
  const characters = new Set<string>();
  const locations = new Set<string>();
  
  let currentScene: ParsedScene | null = null;
  let sceneNumber = 0;
  let title = '';
  let authors: string[] = [];
  
  // Parse title page
  let i = 0;
  while (i < lines.length && i < 50) {
    const line = lines[i].trim();
    if (line === '') { i++; continue; }
    
    const titleMatch = line.match(/^Title:\s*(.+)/i);
    const authorMatch = line.match(/^(?:Author|Authors|Credit):\s*(.+)/i);
    
    if (titleMatch) { title = titleMatch[1]; i++; continue; }
    if (authorMatch) { authors.push(authorMatch[1]); i++; continue; }
    if (line.match(/^(?:INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i)) break;
    i++;
  }
  
  // Parse body
  for (; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') continue;
    
    // Scene heading
    if (trimmed.match(/^(?:INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i) || trimmed.startsWith('.')) {
      sceneNumber++;
      const isInt = /^(?:INT|I\/E)/i.test(trimmed);
      const locMatch = trimmed.match(/(?:INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*(.+?)(?:\s*[-–]\s*(.+))?$/i);
      
      const location = locMatch?.[1]?.trim() || trimmed;
      const timeOfDay = locMatch?.[2]?.trim() || 'DAY';
      
      locations.add(location.toUpperCase());
      
      currentScene = {
        sceneNumber,
        heading: trimmed,
        location,
        timeOfDay,
        interior: isInt,
        content: [],
      };
      scenes.push(currentScene);
      continue;
    }
    
    if (!currentScene) {
      sceneNumber++;
      currentScene = {
        sceneNumber,
        heading: 'OPENING',
        location: 'UNKNOWN',
        timeOfDay: 'DAY',
        interior: true,
        content: [],
      };
      scenes.push(currentScene);
    }
    
    // Character cue
    const charMatch = trimmed.match(/^([A-Z][A-Z\s\.\-\']+)(?:\s*\(.*\))?$/);
    if (charMatch && trimmed.length < 40 && !trimmed.includes(':')) {
      const char = charMatch[1].trim();
      if (!['INT', 'EXT', 'CUT TO', 'FADE IN', 'FADE OUT', 'DISSOLVE TO'].includes(char)) {
        characters.add(char);
        currentScene.content.push({ type: 'character', content: char, character: char });
        continue;
      }
    }
    
    // Parenthetical
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      currentScene.content.push({ type: 'parenthetical', content: trimmed });
      continue;
    }
    
    // Transition
    if (trimmed.match(/(CUT TO|FADE TO|DISSOLVE TO|SMASH CUT|FADE IN|FADE OUT):?$/i)) {
      currentScene.content.push({ type: 'transition', content: trimmed });
      continue;
    }
    
    // Dialogue continuation
    const lastElement = currentScene.content[currentScene.content.length - 1];
    if (lastElement && (lastElement.type === 'character' || lastElement.type === 'parenthetical' || lastElement.type === 'dialogue')) {
      if (lastElement.type === 'dialogue') {
        lastElement.content += ' ' + trimmed;
      } else {
        const char = currentScene.content.findLast(e => e.type === 'character')?.character;
        currentScene.content.push({ type: 'dialogue', content: trimmed, character: char });
      }
      continue;
    }
    
    // Default: Action
    currentScene.content.push({ type: 'action', content: trimmed });
  }
  
  return {
    title: title || 'Untitled Script',
    authors,
    rawText: text,
    scenes,
    characters: Array.from(characters),
    locations: Array.from(locations),
    metadata: { format: 'fountain', importedAt: Date.now() },
  };
};

// ============================================
// FDX PARSER (Final Draft XML)
// ============================================

const parseFDX = async (xmlContent: string): Promise<ParsedScript> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  
  const scenes: ParsedScene[] = [];
  const characters = new Set<string>();
  const locations = new Set<string>();
  let sceneNumber = 0;
  let currentScene: ParsedScene | null = null;
  
  const titlePage = doc.querySelector('TitlePage');
  const title = titlePage?.querySelector('Content[Type="Title"]')?.textContent?.trim() || 
                doc.querySelector('FinalDraft')?.getAttribute('Title') || 'Untitled Script';
  
  const authorElements = titlePage?.querySelectorAll('Content[Type="Author"], Content[Type="Written by"]');
  const authors: string[] = [];
  authorElements?.forEach(el => {
    const author = el.textContent?.trim();
    if (author) authors.push(author);
  });
  
  const paragraphs = doc.querySelectorAll('Paragraph');
  
  paragraphs.forEach(para => {
    const type = para.getAttribute('Type')?.toLowerCase() || '';
    const textContent = para.querySelector('Text')?.textContent?.trim() || '';
    if (!textContent) return;
    
    if (type === 'scene heading' || type === 'slug line') {
      sceneNumber++;
      const isInt = /^(?:INT|I\/E)/i.test(textContent);
      const locMatch = textContent.match(/(?:INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*(.+?)(?:\s*[-–]\s*(.+))?$/i);
      
      const location = locMatch?.[1]?.trim() || textContent;
      const timeOfDay = locMatch?.[2]?.trim() || 'DAY';
      
      locations.add(location.toUpperCase());
      
      currentScene = { sceneNumber, heading: textContent, location, timeOfDay, interior: isInt, content: [] };
      scenes.push(currentScene);
      return;
    }
    
    if (!currentScene) {
      sceneNumber++;
      currentScene = { sceneNumber, heading: 'OPENING', location: 'UNKNOWN', timeOfDay: 'DAY', interior: true, content: [] };
      scenes.push(currentScene);
    }
    
    if (type === 'character') {
      const char = textContent.replace(/\s*\(.*\)$/, '').trim();
      characters.add(char);
      currentScene.content.push({ type: 'character', content: textContent, character: char });
      return;
    }
    
    if (type === 'dialogue') {
      const lastChar = currentScene.content.findLast(e => e.type === 'character');
      currentScene.content.push({ type: 'dialogue', content: textContent, character: lastChar?.character });
      return;
    }
    
    if (type === 'parenthetical') {
      currentScene.content.push({ type: 'parenthetical', content: textContent });
      return;
    }
    
    if (type === 'transition') {
      currentScene.content.push({ type: 'transition', content: textContent });
      return;
    }
    
    currentScene.content.push({ type: 'action', content: textContent });
  });
  
  let rawText = '';
  scenes.forEach(scene => {
    rawText += scene.heading + '\n\n';
    scene.content.forEach(element => {
      if (element.type === 'character') rawText += '\n' + element.content + '\n';
      else if (element.type === 'dialogue') rawText += element.content + '\n';
      else if (element.type === 'parenthetical') rawText += element.content + '\n';
      else rawText += element.content + '\n\n';
    });
    rawText += '\n';
  });
  
  return {
    title, authors, rawText, scenes,
    characters: Array.from(characters),
    locations: Array.from(locations),
    metadata: { format: 'fdx', importedAt: Date.now() },
  };
};

// ============================================
// PDF TEXT EXTRACTION
// ============================================

const parsePDF = async (file: File): Promise<ParsedScript> => {
  // Try server-side extraction first
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
    if (response.ok) {
      const { text } = await response.json();
      const parsed = parseFountain(text);
      parsed.metadata.format = 'pdf';
      return parsed;
    }
  } catch (e) {
    console.warn('Server PDF extraction failed, trying browser fallback');
  }
  
  // Browser-based extraction using PDF.js
  if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
    const pdfjsLib = (window as any).pdfjsLib;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    const parsed = parseFountain(fullText);
    parsed.metadata.format = 'pdf';
    parsed.metadata.pageCount = pdf.numPages;
    return parsed;
  }
  
  throw new Error('PDF extraction not available. Install PDF.js or enable server extraction.');
};

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

export const importScript = async (file: File): Promise<ParsedScript> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'fdx') {
    const text = await file.text();
    return parseFDX(text);
  }
  
  if (extension === 'fountain' || extension === 'txt') {
    const text = await file.text();
    return parseFountain(text);
  }
  
  if (extension === 'pdf') {
    return parsePDF(file);
  }
  
  // Try to detect format from content
  const text = await file.text();
  if (text.trim().startsWith('<?xml') || text.includes('<FinalDraft')) {
    return parseFDX(text);
  }
  
  return parseFountain(text);
};

// ============================================
// EXPORT TO DIRECTOR FORMAT
// ============================================

export interface DirectorExport {
  script: string;
  characters: Array<{ name: string; handle: string; role: string; traits: string[]; visuals: string; }>;
  locations: Array<{ name: string; handle: string; visuals: string; }>;
  beats: Array<{ beat_id: string; characters: string[]; action: string; dialogue?: string; location: string; camera: string; lighting: string; }>;
}

export const exportToDirector = (parsed: ParsedScript): DirectorExport => {
  const beats: DirectorExport['beats'] = [];
  let beatCounter = 0;
  
  parsed.scenes.forEach(scene => {
    let currentBeat: DirectorExport['beats'][0] | null = null;
    const sceneCharacters: string[] = [];
    
    scene.content.forEach(element => {
      if (element.type === 'character') sceneCharacters.push(element.character!);
      
      if (element.type === 'action') {
        beatCounter++;
        currentBeat = {
          beat_id: `beat_${Date.now()}_${beatCounter}`,
          characters: [...new Set(sceneCharacters)].map(c => `@${c.replace(/\s/g, '')}`),
          action: element.content,
          location: scene.location,
          camera: 'Standard',
          lighting: scene.interior ? 'Interior' : 'Natural',
        };
        beats.push(currentBeat);
      }
      
      if (element.type === 'dialogue' && currentBeat) {
        currentBeat.dialogue = element.content;
        if (element.character) {
          const handle = `@${element.character.replace(/\s/g, '')}`;
          if (!currentBeat.characters.includes(handle)) currentBeat.characters.push(handle);
        }
      }
    });
    
    if (beats.filter(b => b.location === scene.location).length === 0) {
      beatCounter++;
      beats.push({
        beat_id: `beat_${Date.now()}_${beatCounter}`,
        characters: [...new Set(sceneCharacters)].map(c => `@${c.replace(/\s/g, '')}`),
        action: scene.heading,
        location: scene.location,
        camera: 'Establishing',
        lighting: scene.interior ? 'Interior' : 'Natural',
      });
    }
  });
  
  return {
    script: parsed.rawText,
    characters: parsed.characters.map(name => ({
      name, handle: `@${name.replace(/\s/g, '')}`, role: 'Character', traits: [], visuals: `Character: ${name}`,
    })),
    locations: parsed.locations.map(name => ({
      name, handle: `@${name.replace(/\s/g, '')}`, visuals: `Location: ${name}`,
    })),
    beats,
  };
};

// ============================================
// FILE UPLOAD HANDLER
// ============================================

export const handleScriptFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
): Promise<{ parsed: ParsedScript; directorExport: DirectorExport } | null> => {
  const file = event.target.files?.[0];
  if (!file) return null;
  
  try {
    const parsed = await importScript(file);
    const directorExport = exportToDirector(parsed);
    
    console.log('📜 Script imported successfully');
    console.log(`   - Title: ${parsed.title}`);
    console.log(`   - Scenes: ${parsed.scenes.length}`);
    console.log(`   - Characters: ${parsed.characters.length}`);
    console.log(`   - Locations: ${parsed.locations.length}`);
    console.log(`   - Beats: ${directorExport.beats.length}`);
    
    return { parsed, directorExport };
  } catch (error) {
    console.error('Script import failed:', error);
    throw error;
  }
};
