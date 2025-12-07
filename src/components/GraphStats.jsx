import React from 'react';
import { formatCharacterId } from '../formatCharacterId';

export const GraphStats = ({ targetChar, nodeCount, edgeCount }) => {

  const { full } = formatCharacterId(targetChar);
  return (
    <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur rounded px-4 py-2 z-10">
      <div className="text-sm">
        <span className="font-semibold">{full}</span>
        <div className="text-slate-300 text-xs mt-1">
          {nodeCount} nodes • {edgeCount} edges
        </div>
      </div>
    </div>
  );
};