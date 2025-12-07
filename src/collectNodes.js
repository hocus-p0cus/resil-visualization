export function collectNodes(target, edges, maxDistance = Infinity) {
  const adj = {};
  edges.forEach(([a, b]) => {
    if (!adj[a]) adj[a] = [];
    adj[a].push(b);
  });

  const visited = new Set([target]);
  const queue = [target];
  
  let currentDistance = 0;
  let currentGen = 1; // nodes at current distance
  let nextGen = 0;    // nodes at next distance
  
  while (queue.length > 0 && currentDistance < maxDistance) {
    const node = queue.shift();
    const neighbors = adj[node] || [];
    
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        nextGen++;
      }
    });
    
    currentGen--;
    
    // Move to next distance level
    if (currentGen === 0) {
      currentDistance++;
      currentGen = nextGen;
      nextGen = 0;
    }
  }

  return visited;
};