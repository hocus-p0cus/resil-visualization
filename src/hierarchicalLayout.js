import { topologicalSort } from "./topologicalSort";

export function hierarchicalLayout(nodes, edges, targetNode = null) {
  const sorted = topologicalSort(nodes, edges);
  if (!sorted) return null;

  const layerMap = {};
  const adj = {};
  
  edges.forEach(([from, to]) => {
    if (!adj[to]) adj[to] = [];
    adj[to].push(from);
  });
  
  sorted.forEach(node => {
    const predecessors = adj[node] || [];
    layerMap[node] = predecessors.length === 0 
      ? 0 
      : 1 + Math.max(...predecessors.map(p => layerMap[p]));
  });

  const layers = {};
  Object.entries(layerMap).forEach(([node, layer]) => {
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(node);
  });

  const pos = {};
  const horizontalSpread = 120;
  const layerSpacing = 100;
  
  const yOffset = targetNode && layerMap[targetNode] !== undefined
    ? layerMap[targetNode] * layerSpacing
    : 0;
  
  Object.entries(layers).forEach(([layer, layerNodes]) => {
    const n = layerNodes.length;
    layerNodes.forEach((node, i) => {
      const x = (i - (n - 1) / 2) * horizontalSpread;
      const y = parseInt(layer) * layerSpacing - yOffset;
      pos[node] = { x, y };
    });
  });

  return { pos, layers: Object.values(layers) };
};