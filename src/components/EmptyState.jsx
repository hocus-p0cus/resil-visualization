import React from 'react';
import { Upload } from './icons';

export const EmptyState = () => {
  return (
    <div className="flex items-center justify-center h-full text-slate-400">  
      <div className="text-center">
        <Upload size={48} className="mx-auto mb-4 opacity-50" />
        <p>Select region, season, and key level, then search for a character</p>
      </div>
    </div>
  );
};