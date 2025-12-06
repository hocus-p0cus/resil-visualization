export const Tooltip = ({ interaction }) => {
  if (interaction.selectedEdge || (!interaction.hoveredNode && !interaction.hoveredEdge)) {
    return null;
  }

  return (
    <div
      className="fixed bg-slate-900/95 backdrop-blur border border-slate-600 rounded px-3 py-2 text-xs pointer-events-none z-50"
      style={{
        left: interaction.tooltip.x + 15,
        top: interaction.tooltip.y + 15,
      }}
    >
      {interaction.tooltip.type === 'edge' && interaction.hoveredEdge && (
        <>
          <div className="font-semibold mb-1">
            {interaction.hoveredEdge.from.split('-')[0]} → {interaction.hoveredEdge.to.split('-')[0]}
          </div>
          <div className="text-slate-400 text-[10px]">Click to view runs</div>
        </>
      )}

      {interaction.tooltip.type === 'node' && interaction.hoveredNode && (
        <>
          <div className="font-semibold mb-1">
            Click to see character report
          </div>
          <div className="text-slate-400 text-[10px]">Is it resilient?</div>
        </>
      )}
    </div>
  );
};