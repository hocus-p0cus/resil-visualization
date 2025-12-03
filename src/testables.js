export function collectNodes(target, edges) {
  const adj = {};
  edges.forEach(([a, b]) => {
    if (!adj[a]) adj[a] = [];
    adj[a].push(b);
  });

  const visited = new Set([target]);
  const stack = [target];

  while (stack.length > 0) {
    const node = stack.pop();
    const neighbors = adj[node] || [];
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        stack.push(neighbor);
      }
    });
  }

  return visited;
};

export function getDungeonCode(runId) {
  if (runId.includes('#')) {
    return runId.split('#')[0].trim();
  }
  return null;
};

export function readUrlParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    region: params.get("region")?.toLowerCase() || null,
    season: params.get("season") || null,
    character: params.get("character")?.toLowerCase() || null,
    realm: params.get("realm")?.toLowerCase() || null,
    level: params.get("level") ? Number(params.get("level")) : null,
  };
}

export function topologicalSort(nodes, edges) {
  const inDegree = {};
  const adj = {};
  
  nodes.forEach(node => {
    inDegree[node] = 0;
    adj[node] = [];
  });
  
  edges.forEach(([from, to]) => {
    adj[from].push(to);
    inDegree[to] = (inDegree[to] || 0) + 1;
  });
  
  const queue = nodes.filter(node => inDegree[node] === 0);
  const result = [];
  
  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);
    
    adj[node].forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  return result.length === nodes.length ? result : null;
};

export function hierarchicalLayout(nodes, edges)  {
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
  
  Object.entries(layers).forEach(([layer, layerNodes]) => {
    const n = layerNodes.length;
    layerNodes.forEach((node, i) => {
      const x = (i - (n - 1) / 2) * horizontalSpread;
      const y = parseInt(layer) * layerSpacing;
      pos[node] = { x, y };
    });
  });

  return { pos, layers: Object.values(layers) };
};

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