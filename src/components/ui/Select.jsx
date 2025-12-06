import React from 'react';

export const Select = ({ 
  label, 
  value, 
  onChange, 
  options, 
  disabled = false,
  formatLabel = (val) => val.toUpperCase(),
  className = '' 
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm mb-1 text-slate-300 lg:text-base">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-4 py-2 
          bg-slate-700 rounded 
          border border-slate-600 
          focus:border-blue-500 focus:outline-none 
          disabled:opacity-50
          text-sm lg:text-base
          ${className}
        `.trim()}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {formatLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  );
};