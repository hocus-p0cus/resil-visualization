import { hierarchicalLayout } from "./hierarchicalLayout";
import { collectNodes } from "./collectNodes";

export function buildGraphCore({
  target,
  downEdges,
  nonResilEdges,
  showNonResil
}) {
  if (!downEdges || !nonResilEdges || !target) return null;

  const downEdgesList = downEdges.map(e => [e.source, e.target]);
  const nonResilEdgesList = nonResilEdges.map(e => [e.source, e.target]);
  
  const upEdges = downEdgesList.map(([a, b]) => [b, a]);
  const upNonResilEdges = nonResilEdgesList.map(([a, b]) => [b, a]);

  // When going up, always include both resilient and non-resilient edges
  const upNodes = collectNodes(target, [...upEdges, ...upNonResilEdges]);
  
  // When going down, conditionally include non-resilient edges based on toggle
  const downEdgesForCollection = showNonResil 
    ? [...downEdgesList, ...nonResilEdgesList]
    : downEdgesList;
  const downNodes = collectNodes(target, downEdgesForCollection);
  
  const allNodes = new Set([...upNodes, ...downNodes, target]);

  const filteredEdges = [];
  
  downEdges.forEach(e => {
    if (allNodes.has(e.source) && allNodes.has(e.target)) {
      filteredEdges.push({
        from: e.source,
        to: e.target,
        type: 'resil',
        labels: e.labels
      });
    }
  });
  
  // Handle non-resilient edges
  nonResilEdges.forEach(e => {
    const sourceInGraph = allNodes.has(e.source);
    const targetInGraph = allNodes.has(e.target);
    
    // Always include non-resilient edges that connect TO the target node
    const edgeToTarget = e.target === target;
    
    // Include if: (toggle is on AND both nodes in graph) OR (edge connects to target)
    if ((showNonResil && sourceInGraph && targetInGraph) || (edgeToTarget && sourceInGraph)) {
      filteredEdges.push({
        from: e.source,
        to: e.target,
        type: 'nonresil',
        labels: e.labels
      });
    }
  });

  const allEdgesForLayout = filteredEdges.map(e => [e.from, e.to]);
  const layout = hierarchicalLayout(Array.from(allNodes), allEdgesForLayout);
  
  if (!layout) {
    return null; // Caller handles the error (alert in UI, throw in tests, etc.)
  }

  return {
    nodes: Array.from(allNodes),
    edges: filteredEdges,
    positions: layout.pos
  };
}