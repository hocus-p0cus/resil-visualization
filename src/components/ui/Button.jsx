import React from 'react';

export const Button = ({ 
  children,
  onClick, 
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconSize = 18,
  className = '' 
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-700 text-slate-300',
    close: 'text-slate-400 hover:text-white'  // For modal close buttons
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2 text-base',
    lg: 'px-8 py-3 text-lg',
    icon: 'p-0'  // For icon-only buttons like close (×)
  };

  const fontWeight = variant === 'close' ? '' : 'font-medium';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizes[size]}
        ${variants[variant]}
        rounded ${fontWeight}
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
        transition-colors
        ${className}
      `.trim()}
    >
      {Icon && <Icon size={iconSize} />}
      {children}
    </button>
  );
};