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