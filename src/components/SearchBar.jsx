import React from 'react';
import { Search } from './icons';
import { Button } from './ui/Button';

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
      <Button
        onClick={onSearch}
        disabled={disabled || !value.trim()}
        icon={Search}
      >
        Visualize
      </Button>
    </div>
  );
};