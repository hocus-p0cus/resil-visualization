import React from 'react';
import { getDungeonCode } from '../getDungeonCode';
import { Button } from './ui/Button';

export const RunLinksModal = ({ 
  selectedEdge, 
  season,
  onClose 
}) => {
  // Season slug mapping
  const seasonSlugs = {
    'tww-season2': 'season-tww-2',
    'tww-season3': 'season-tww-3',
  };

  // Don't show if no edge is selected
  if (!selectedEdge) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 max-w-lg w-full mx-4">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedEdge.from.split('-')[0]} → {selectedEdge.to.split('-')[0]}
            </h3>
            <Button 
              variant="close" 
              size="icon"
              onClick={onClose}
              className="text-2xl leading-none"
            >
              ×
            </Button>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {selectedEdge.type === 'resil' ? 'Resilient' : 'Non-resilient'} edge
          </div>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {selectedEdge.labels && selectedEdge.labels.length > 0 ? (
            <div className="space-y-2">
              {selectedEdge.labels.map((runId, i) => {
                const numericId = runId.includes('#') ? runId.split('#').pop().trim() : runId.trim();
                const dungeonCode = getDungeonCode(runId);
                const seasonSlug = seasonSlugs[season] || season;
                const runUrl = `https://raider.io/mythic-plus-runs/${seasonSlug}/${numericId}`;
                
                return (
                  <a
                    key={i}
                    href={runUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded border border-slate-600 hover:border-blue-500 transition-colors overflow-hidden group h-20"
                  >
                    {dungeonCode && (
                      <img 
                        src={`images/${dungeonCode}.jpg`}
                        alt={dungeonCode}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="relative z-10 px-4 py-3 h-full flex flex-col justify-center bg-gradient-to-r from-slate-900/80 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white drop-shadow-lg">{dungeonCode || 'Run'}</span>
                        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </div>
                      <div className="text-xs text-slate-300 mt-1 truncate drop-shadow">ID: {numericId}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              No run data available
            </div>
          )}
        </div>
      </div>
    </>
  );
};