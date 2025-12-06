import React from 'react';

export const ToggleButton = ({ 
  label, 
  value, 
  onChange, 
  onLabel = 'ON', 
  offLabel = 'OFF',
  className = '' 
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm mb-1 text-slate-300 lg:text-base">
          {label}
        </label>
      )}
      <button
        onClick={onChange}
        className={`
          w-full h-10 px-4 py-2 
          rounded border transition-colors
          text-sm lg:text-base
          ${value 
            ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
            : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
          }
          ${className}
        `.trim()}
      >
        {value ? onLabel : offLabel}
      </button>
    </div>
  );
};