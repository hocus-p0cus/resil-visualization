import React from 'react';
import { Search } from './icons';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
      <Input
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1"
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