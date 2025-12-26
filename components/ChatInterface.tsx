import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Paperclip, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { Message } from '../types';
import { MentionableInput } from './MentionableInput';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, files: File[]) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if ((inputText.trim() || selectedFiles.length > 0) && !isLoading) {
      onSendMessage(inputText, selectedFiles);
      setInputText('');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
            <div className="w-16 h-16 rounded-full bg-cinematic-800 flex items-center justify-center mb-4 border border-cinematic-700">
               <span className="text-2xl">🎬</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Welcome to Channel Changers</h3>
            <p className="text-sm text-gray-400 max-w-md">
              Your AI Showrunner is ready. Share a seed idea, a logline, or upload a moodboard to begin Phase 1.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] md:max-w-[75%] lg:max-w-[65%] rounded-2xl p-4 md:p-6 shadow-xl ${
                msg.role === 'user'
                  ? 'bg-cinematic-700 text-white rounded-br-sm'
                  : 'bg-cinematic-800 border border-cinematic-700 text-gray-100 rounded-bl-sm'
              }`}
            >
              {/* Images in message (User Uploads) */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                   {msg.images.map((img, idx) => (
                       <img key={idx} src={`data:image/png;base64,${img}`} alt="User upload" className="h-32 w-auto rounded-lg border border-cinematic-600 object-cover" />
                   ))}
                </div>
              )}

              {/* Generated Image (AI Output) */}
              {msg.generatedImage && (
                <div className="mb-4 relative group">
                  <img 
                    src={`data:image/png;base64,${msg.generatedImage}`} 
                    alt="AI Generated Concept" 
                    className="w-full rounded-lg border border-cinematic-600 shadow-2xl"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={`data:image/png;base64,${msg.generatedImage}`} 
                      download={`concept-art-${msg.id}.png`}
                      className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md flex items-center"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                  <div className="mt-2 text-xs text-cinematic-gold font-mono tracking-widest uppercase">
                    Generated with Gemini 3 Pro
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                {msg.role === 'model' && msg.isLoading ? (
                    <div className="flex items-center space-x-2 text-cinematic-400">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="typing-cursor text-xs">THINKING</span>
                    </div>
                ) : (
                    <ReactMarkdown
                        components={{
                            code({ node, className, children, ...props }) {
                                return (
                                    <code className={`${className} bg-cinematic-900 px-1 py-0.5 rounded text-cinematic-gold font-mono`} {...props}>
                                        {children}
                                    </code>
                                )
                            },
                            pre({ children }) {
                                return <pre className="bg-cinematic-900 p-4 rounded-lg overflow-x-auto border border-cinematic-600 my-4 font-mono text-sm shadow-inner">{children}</pre>
                            },
                            blockquote({ children }) {
                                return <blockquote className="border-l-4 border-cinematic-accent pl-4 italic text-gray-400 my-4">{children}</blockquote>
                            }
                        }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-cinematic-900 border-t border-cinematic-700 p-4">
        {selectedFiles.length > 0 && (
             <div className="flex gap-2 mb-2 px-2">
                 {selectedFiles.map((f, i) => (
                     <div key={i} className="bg-cinematic-700 text-xs px-2 py-1 rounded-full flex items-center gap-2 border border-cinematic-600 text-white">
                         <ImageIcon size={12} />
                         <span className="truncate max-w-[100px]">{f.name}</span>
                         <button onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))} className="hover:text-red-400">×</button>
                     </div>
                 ))}
             </div>
        )}
        <div className="max-w-5xl mx-auto flex items-end gap-2 bg-cinematic-800 rounded-xl border border-cinematic-600 p-2 shadow-lg focus-within:ring-2 focus-within:ring-cinematic-500 transition-all">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            multiple 
            accept="image/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-cinematic-400 hover:text-white transition-colors rounded-lg hover:bg-cinematic-700"
            title="Upload Reference Images"
          >
            <Paperclip size={20} />
          </button>
          
          <MentionableInput
            sourceApp="script-engine"
            contextType="chat"
            allowCreate={true}
          >
            {(ref) => (
              <textarea
                ref={ref as React.RefObject<HTMLTextAreaElement>}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or ask for 'Visual Concept Art'..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none max-h-32 min-h-[44px] py-2.5 px-2 focus:outline-none scrollbar-hide text-base"
                rows={1}
                style={{ minHeight: '44px' }}
              />
            )}
          </MentionableInput>
          
          <button
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && selectedFiles.length === 0)}
            className="p-2.5 bg-cinematic-accent text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <div className="text-center mt-2">
             <p className="text-[10px] text-cinematic-500 font-mono tracking-widest">GEMINI POWERED • CHANNEL CHANGERS v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;