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