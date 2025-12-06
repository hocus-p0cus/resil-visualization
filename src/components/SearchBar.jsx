// src/components/SearchBar.jsx
import React from 'react';
import { Search } from './icons';

export const SearchBar = ({ 
  value,
  onChange, 
  onSearch, 
  disabled,
  placeholder = "Paste RIO profile link or Character-Server (e.g., Graliboar-Outland)"
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1 px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={onSearch}
        disabled={disabled || !value.trim()}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Search size={18} />
        Visualize
      </button>
    </div>
  );
};