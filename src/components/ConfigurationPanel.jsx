import React from 'react';
import { Select } from './ui/Select';
import { ToggleButton } from './ui/ToggleButton';

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

      {/* Non-Resilient Nodes Toggle */}
      <ToggleButton
        label="Non-Resilient Nodes"
        value={showNonResil}
        onChange={onToggleNonResil}
      />
    </div>
  );
};