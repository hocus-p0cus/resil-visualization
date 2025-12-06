import React from 'react';
import { Modal } from './ui/Modal';

export const EdgeSelectionModal = ({
  edgeOptions,
  hoveredNode,
  onSelectEdge,
  onClose,
}) => {
  return (
    <Modal
      isOpen={!hoveredNode && edgeOptions.length > 0}
      onClose={onClose}
      title="Select an edge"
      size="sm"
    >
      {edgeOptions.map((edge, i) => (
        <div
          key={i}
          className="flex justify-between items-center px-3 py-2 mb-2 rounded-md border border-slate-700 hover:border-blue-500 hover:bg-slate-700/40 transition-colors cursor-pointer"
          onClick={() => onSelectEdge(edge)}
        >
          <span className="font-medium">
            {edge.from.split('-')[0]} → {edge.to.split('-')[0]}
          </span>
          <span className="text-xs text-slate-400">
            {edge.type === 'resil' ? 'Resilient' : 'Non-resilient'}
          </span>
        </div>
      ))}
    </Modal>
  );
};