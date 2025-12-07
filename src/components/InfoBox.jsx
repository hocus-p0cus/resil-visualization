import React from 'react';

export const InfoBox = () => {
  return (
    <div className="fixed top-3 right-4 bg-slate-100/90 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-md z-[1000]">
      <div className="flex flex-col gap-0.5">
        <a 
          href="https://github.com/hocus-p0cus/resil-visualization#readme" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          📄 Project README
        </a>
        <div className="text-slate-700">
          Made by: <a 
            href="https://raider.io/characters/eu/outland/Graliboar" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            hocus_p0cus
          </a>
        </div>
      </div>
    </div>
  );
};