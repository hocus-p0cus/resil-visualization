import React from 'react';

export const IconButton = ({ 
  icon: Icon, 
  onClick, 
  title,
  size = 'md',
  variant = 'glass',
  className = '' 
}) => {
  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const variants = {
    glass: 'bg-slate-800/80 backdrop-blur hover:bg-slate-700',
    solid: 'bg-slate-700 hover:bg-slate-600',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        ${sizes[size]} 
        ${variants[variant]}
        rounded 
        transition-colors
        ${className}
      `.trim()}
    >
      <Icon size={iconSizes[size]} />
    </button>
  );
};