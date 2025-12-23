import React from 'react';
import { Phase } from '../types';
import { PHASE_NAMES } from '../constants';

interface PhaseIndicatorProps {
  currentPhase: Phase;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase }) => {
  return (
    <div className="w-full bg-cinematic-800 border-b border-cinematic-700 py-3 px-4 md:px-6">
      <div className="flex justify-between items-center max-w-6xl mx-auto overflow-x-auto no-scrollbar gap-4">
        {[1, 2, 3, 4, 5].map((step) => {
          const isActive = currentPhase === step;
          const isCompleted = currentPhase > step;
          const isPending = currentPhase < step;

          return (
            <div key={step} className={`flex items-center space-x-2 whitespace-nowrap opacity-${isPending ? '40' : '100'} transition-opacity duration-300`}>
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
                  isActive 
                    ? 'bg-cinematic-accent border-cinematic-accent text-white shadow-[0_0_10px_rgba(229,9,20,0.5)]' 
                    : isCompleted 
                      ? 'bg-green-500 border-green-500 text-black'
                      : 'bg-transparent border-cinematic-500 text-cinematic-500'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span className={`text-sm font-semibold tracking-wide ${isActive ? 'text-white' : 'text-cinematic-400'}`}>
                {PHASE_NAMES[step as Phase].split('(')[0].trim()}
              </span>
              {step < 5 && <div className="w-8 h-[1px] bg-cinematic-700 mx-2 hidden md:block"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseIndicator;