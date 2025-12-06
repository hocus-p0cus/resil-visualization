import React from 'react';
import { Button } from './Button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
}) => {
  if (!isOpen) return null;

  // sm  -> max-w-sm  (edge selection)
  // md  -> max-w-lg  (run links)
  // lg  -> max-w-2xl
  // xl  -> max-w-4xl
  const containerSizeClass = (() => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'md':
      default:
        return 'max-w-lg';
    }
  })();

  // sm  -> p-3 max-h-80
  // others -> p-4 max-h-96
  const bodyClass =
    size === 'sm'
      ? 'p-3 max-h-80'
      : 'p-4 max-h-96';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        className={`
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          bg-slate-800 border border-slate-600 rounded-lg shadow-2xl
          z-50 w-full mx-4
          ${containerSizeClass}
        `}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              {title && (
                <h3 className="text-lg font-semibold">
                {title}
                </h3>
              )}
              <Button
                variant="close"
                size="icon"
                onClick={onClose}
                className="text-2xl leading-none"
              >
                ×
              </Button>
            </div>
            {subtitle && (
              <div className="text-xs text-slate-400 mt-1">
                {subtitle}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`${bodyClass} overflow-y-auto`}>
          {children}
        </div>
      </div>
    </>
  );
};
