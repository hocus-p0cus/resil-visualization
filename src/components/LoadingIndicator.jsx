import React from 'react';

export const LoadingIndicator = ({ 
  loading, 
  error, 
  dataLoaded,
  config 
}) => {
  return (
    <div className="mb-4 h-5">
      {loading && (
        <div className="text-yellow-400 text-sm">Loading data...</div>
      )}
      
      {!loading && error && (
        <div className="text-red-400 text-sm">Error: {error}</div>
      )}
      
      {!loading && !error && dataLoaded && (
        <div className="text-green-400 text-xs">
          ✓ Data loaded for {config.region.toUpperCase()} - {config.season} - Level {config.keyLevel}
        </div>
      )}
    </div>
  );
};