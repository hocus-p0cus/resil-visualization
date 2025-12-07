import React from 'react';
import { Select } from './ui/Select';
import { ToggleButton } from './ui/ToggleButton';
import { Input } from './ui/Input';

export const ConfigurationPanel = ({
  config,
  onConfigChange,
  availableConfigs,
  showNonResil,
  onToggleNonResil,
  maxDistance,
  onMaxDistanceChange
}) => {

  const handleMaxDistanceInput = (e) => {
    const value = e.target.value;
    
    if (value === '') {
      onMaxDistanceChange('');
      return;
    }
    
    if (!/^\d+$/.test(value)) {
      return;
    }
    
    const num = parseInt(value, 10);
    if (num > 0 && num <= 99) {
      onMaxDistanceChange(value);
    }
  };

  const handleMaxDistanceKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = maxDistance === '' ? 0 : parseInt(maxDistance, 10);
      const next = Math.min(current + 1, 99);
      onMaxDistanceChange(next.toString());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = maxDistance === '' ? 0 : parseInt(maxDistance, 10);
      const next = Math.max(current - 1, 0);
      onMaxDistanceChange(next === 0 ? '' : next.toString());
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      {/* Region Select */}
      <Select
        label="Region"
        value={config.region}
        onChange={(e) => onConfigChange({ region: e.target.value })}
        options={availableConfigs.regions}
      />

      {/* Season Select */}
      <Select
        label="Season"
        value={config.season}
        onChange={(e) => onConfigChange({ season: e.target.value })}
        options={availableConfigs.seasons[config.region] || []}
        disabled={!config.region}
      />

      {/* Key Level Select */}
      <Select
        label="Key Level"
        value={config.keyLevel}
        onChange={(e) => onConfigChange({ keyLevel: parseInt(e.target.value) })}
        options={availableConfigs.keyLevels[`${config.region}-${config.season}`] || []}
        disabled={!config.season}
        formatLabel={(level) => level.toString()}
      />

      {/* Graph Controls */}
      <div className="flex gap-2">
        {/* Toggle */}
        <div className="flex-1">
          <ToggleButton
            label="Non-Resilient Nodes"
            value={showNonResil}
            onChange={onToggleNonResil}
          />
        </div>

        {/* Max Distance */}
        <div className="flex-1 flex flex-col">
          <label className="block text-sm mb-1 text-slate-300 lg:text-base">
            Max Distance
          </label>
          <Input
            type="text"
            value={maxDistance}
            onChange={handleMaxDistanceInput}
            onKeyDown={handleMaxDistanceKeyDown}
            placeholder="∞"
            className="w-full text-center h-10"
          />
        </div>
      </div>
    </div>
  );
};