import React from 'react';

export const ConfigurationPanel = ({
  config,
  onConfigChange,
  availableConfigs,
  showNonResil,
  onToggleNonResil
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      {/* Region Select */}
      <div>
        <label className="block text-sm mb-1 text-slate-300">Region</label>
        <select
          value={config.region}
          onChange={(e) => {
            const newRegion = e.target.value;
            onConfigChange({ region: newRegion });
          }}
          className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
        >
          {availableConfigs.regions.map(r => (
            <option key={r} value={r}>{r.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Season Select */}
      <div>
        <label className="block text-sm mb-1 text-slate-300">Season</label>
        <select
          value={config.season}
          onChange={(e) => {
            const newSeason = e.target.value;
            onConfigChange({ season: newSeason });
          }}
          disabled={!config.region}
          className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        >
          {(availableConfigs.seasons[config.region] || []).map(s => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Key Level Select */}
      <div>
        <label className="block text-sm mb-1 text-slate-300">Key Level</label>
        <select
          value={config.keyLevel}
          onChange={(e) => 
            onConfigChange({ keyLevel: parseInt(e.target.value) })
          }
          disabled={!config.season}
          className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        >
          {(availableConfigs.keyLevels[`${config.region}-${config.season}`] || []).map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {/* Non-Resilient Nodes Toggle */}
      <div>
        <label className="block text-sm mb-1 text-slate-300">Non-Resilient Nodes</label>
        <button
          onClick={onToggleNonResil}
          className={`w-full h-10 px-4 py-2 rounded border transition-colors ${
            showNonResil 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'bg-slate-700 border-slate-600 text-slate-400'
          }`}
        >
          {showNonResil ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
};