import React from 'react';

export const Input = ({ 
  value, 
  onChange, 
  onKeyDown,
  placeholder,
  disabled = false,
  type = 'text',
  className = '' 
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={`
        px-4 py-2 
        bg-slate-700 rounded 
        border border-slate-600 
        focus:border-blue-500 focus:outline-none 
        disabled:opacity-50
        text-sm lg:text-base
        ${className}
      `.trim()}
    />
  );
};