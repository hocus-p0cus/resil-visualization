const { useState, useRef, useEffect } = React;

// Inline SVG icons
const Upload = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
);

const Search = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const Info = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>
);

const ZoomIn = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
  </svg>
);

const ZoomOut = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M8 11h6"/>
  </svg>
);

const Maximize2 = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);

const WoWGraphVisualizer = () => {
  // Configuration state
  const [availableConfigs, setAvailableConfigs] = useState({
    regions: [],
    seasons: {},
    keyLevels: {}
  });
  const [region, setRegion] = useState('');
  const [season, setSeason] = useState('');
  const [keyLevel, setKeyLevel] = useState(0);
  const [showNonResil, setShowNonResil] = useState(false);
  
  // Season slug mapping
  const seasonSlugs = {
    'tww-season2': 'season-tww-2',
    'tww-season3': 'season-tww-3',
  };
  
  // Data state
  const [timestamps, setTimestamps] = useState(null);
  const [downEdges, setDownEdges] = useState(null);
  const [nonResilEdges, setNonResilEdges] = useState(null);
  const [slugMapping, setSlugMapping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [targetChar, setTargetChar] = useState('');
  const [graph, setGraph] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Load slug mapping on mount
  useEffect(() => {
    fetch('slug_mapping.json')
      .then(response => response.json())
      .then(data => setSlugMapping(data))
      .catch(err => console.error('Failed to load slug mapping:', err));
  }, []);

  // Discover available configurations on mount
  useEffect(() => {
    const discoverConfigs = async () => {
      try {
        const response = await fetch('data/config.json');
        const config = await response.json();
        
        setAvailableConfigs(config);
        
        // Set defaults to first available options
        if (config.regions.length > 0) {
          const firstRegion = config.regions[0];
          setRegion(firstRegion);
          
          if (config.seasons[firstRegion] && config.seasons[firstRegion].length > 0) {
            const firstSeason = config.seasons[firstRegion][0];
            setSeason(firstSeason);
            
            const key = `${firstRegion}-${firstSeason}`;
            if (config.keyLevels[key] && config.keyLevels[key].length > 0) {
              setKeyLevel(config.keyLevels[key][0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load config:', err);
        setLoadError('Failed to load available configurations');
      }
    };
    
    discoverConfigs();
  }, []);

  // Load data files when region/season/keyLevel changes
  useEffect(() => {
    if (!region || !season || !keyLevel) return;
    
    const loadData = async () => {
      setLoading(true);
      setLoadError(null);
      
      const prefix = `${season}-${region}-resi${keyLevel}`;
      const basePath = `data/${region}/${season}`;
      
      try {
        const [timestampsRes, downEdgesRes, nonResilEdgesRes] = await Promise.all([
          fetch(`${basePath}/${prefix}_timestamps.json`),
          fetch(`${basePath}/${prefix}_down_edges.json`),
          fetch(`${basePath}/${prefix}_non_resil_edges.json`)
        ]);
        
        if (!timestampsRes.ok || !downEdgesRes.ok || !nonResilEdgesRes.ok) {
          throw new Error('Failed to load one or more data files');
        }
        
        const [timestampsData, downEdgesData, nonResilEdgesData] = await Promise.all([
          timestampsRes.json(),
          downEdgesRes.json(),
          nonResilEdgesRes.json()
        ]);
        
        setTimestamps(timestampsData);
        setDownEdges(downEdgesData);
        setNonResilEdges(nonResilEdgesData);
        setLoading(false);
      } catch (err) {
        setLoadError(err.message);
        setLoading(false);
        console.error('Error loading data:', err);
      }
    };
    
    loadData();
  }, [region, season, keyLevel]);

  const collectNodes = (target, edges) => {
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

  const topologicalSort = (nodes, edges) => {
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

  const hierarchicalLayout = (nodes, edges) => {
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

  const buildGraph = (target) => {
    if (!downEdges || !nonResilEdges || !target) return;

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
      alert('Graph contains cycles - cannot create hierarchical layout');
      return;
    }

    setGraph({
      nodes: Array.from(allNodes),
      edges: filteredEdges,
      positions: layout.pos
    });
  };

  const drawGraph = () => {
    if (!graph || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    const parsedTimes = {};
    if (timestamps) {
      Object.entries(timestamps).forEach(([char, time]) => {
        parsedTimes[char] = new Date(time).getTime();
      });
    }
    
    const times = Object.values(parsedTimes);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const getColor = (charId) => {
      if (!parsedTimes[charId]) return 'rgba(128, 128, 128, 0.4)';
      const t = (parsedTimes[charId] - minTime) / (maxTime - minTime);
      const r = Math.floor(68 + t * (253 - 68));
      const g = Math.floor(1 + t * (231 - 1));
      const b = Math.floor(84 + t * (37 - 84));
      return `rgb(${r}, ${g}, ${b})`;
    };

    graph.edges.forEach(edge => {
      const from = graph.positions[edge.from];
      const to = graph.positions[edge.to];

      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const arrowSize = 8;
      const offset = 20; // distance from node center to arrow tip
      const arrowDepth = arrowSize * Math.cos(Math.PI / 6); // ≈ 6.93

      // shorten the line so it ends where the arrowhead base begins
      const lineEndX = to.x - Math.cos(angle) * (offset + arrowDepth);
      const lineEndY = to.y - Math.sin(angle) * (offset + arrowDepth);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(lineEndX, lineEndY);

      if (edge.type === 'resil') {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // draw arrowhead (tip still at `offset` from target center)
      const arrowX = to.x - Math.cos(angle) * offset;
      const arrowY = to.y - Math.sin(angle) * offset;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    });

    graph.nodes.forEach(node => {
      const pos = graph.positions[node];
      const label = node.split('-')[0];
      const color = getColor(node);
      
      ctx.font = '12px sans-serif';
      const metrics = ctx.measureText(label);
      const padding = 8;
      const boxWidth = metrics.width + padding * 2;
      const boxHeight = 24;
      
      ctx.fillStyle = 'white';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.75;
      
      ctx.beginPath();
      ctx.roundRect(
        pos.x - boxWidth / 2,
        pos.y - boxHeight / 2,
        boxWidth,
        boxHeight,
        4
      );
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = node === targetChar ? '#e11d48' : '#1f2937';
      ctx.font = node === targetChar ? 'bold 12px sans-serif' : '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pos.x, pos.y);
    });

    ctx.restore();
  };

  useEffect(() => {
    drawGraph();
  }, [graph, zoom, pan]);

  useEffect(() => {
    const handleResize = () => drawGraph();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [graph, zoom, pan]);

  const parseRioLink = (input) => {
    const match = input.match(/^(?:https?:\/\/)?raider\.io\/characters\/(eu|us|kr|tw|cn)\/([^\/]+)\/([^\/?#]+)/i);
    
    if (match && slugMapping) {
      const slug = decodeURIComponent(match[2]).toLowerCase();
      const name = decodeURIComponent(match[3]);
      
      const realm = slugMapping[slug];
      
      if (!realm) {
        alert(`Realm slug "${slug}" not found in mapping. Using slug as-is.`);
        const fallbackRealm = slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        return `${capitalizedName}-${fallbackRealm}`;
      }
      
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      return `${capitalizedName}-${realm}`;
    }
    
    return input.trim();
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    const parsedChar = parseRioLink(searchTerm);
    setTargetChar(parsedChar);
    buildGraph(parsedChar);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Rebuild graph when toggle changes
  useEffect(() => {
    if (targetChar) {
      buildGraph(targetChar);
    }
  }, [showNonResil]);

  // Rebuild graph when season or key level changes
  useEffect(() => {
    if (targetChar && dataLoaded) {
      buildGraph(targetChar);
    }
  }, [season, keyLevel, timestamps, downEdges, nonResilEdges]);

  const handleMouseDown = (e) => {
    if (hoveredEdge) {
      // Click on edge - open modal
      setSelectedEdge(hoveredEdge);
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Check for edge hover
    if (!graph || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Transform mouse coordinates to canvas coordinates
    const canvasX = (mouseX - rect.width / 2 - pan.x) / zoom;
    const canvasY = (mouseY - rect.height / 2 - pan.y) / zoom;
    
    // Check each edge
    let foundEdge = null;
    const threshold = 10 / zoom; // Hit detection threshold
    
    for (const edge of graph.edges) {
      const from = graph.positions[edge.from];
      const to = graph.positions[edge.to];
      
      // Calculate distance from point to line segment
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) continue;
      
      const t = Math.max(0, Math.min(1, ((canvasX - from.x) * dx + (canvasY - from.y) * dy) / (length * length)));
      const projX = from.x + t * dx;
      const projY = from.y + t * dy;
      
      const distance = Math.sqrt((canvasX - projX) ** 2 + (canvasY - projY) ** 2);
      
      if (distance < threshold) {
        foundEdge = edge;
        break;
      }
    }
    
    if (foundEdge) {
      setHoveredEdge(foundEdge);
      setTooltipPos({ x: e.clientX, y: e.clientY });
      canvas.style.cursor = 'pointer';
    } else {
      setHoveredEdge(null);
      canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  const dataLoaded = timestamps && downEdges && nonResilEdges;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700 p-4">
        <h1 className="text-2xl font-bold mb-4">WoW M+ Resilient Key Graph Visualizer</h1>
        
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1 text-slate-300">Region</label>
            <select
              value={region}
              onChange={(e) => {
                const newRegion = e.target.value;
                setRegion(newRegion);
                // Reset season and key level when region changes
                const seasons = availableConfigs.seasons[newRegion] || [];
                if (seasons.length > 0) {
                  const firstSeason = seasons[0];
                  setSeason(firstSeason);
                  const key = `${newRegion}-${firstSeason}`;
                  const levels = availableConfigs.keyLevels[key] || [];
                  if (levels.length > 0) setKeyLevel(levels[0]);
                }
              }}
              className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {availableConfigs.regions.map(r => (
                <option key={r} value={r}>{r.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Season</label>
            <select
              value={season}
              onChange={(e) => {
                const newSeason = e.target.value;
                setSeason(newSeason);
                // Reset key level when season changes
                const key = `${region}-${newSeason}`;
                const levels = availableConfigs.keyLevels[key] || [];
                if (levels.length > 0) setKeyLevel(levels[0]);
              }}
              disabled={!region}
              className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              {(availableConfigs.seasons[region] || []).map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Key Level</label>
            <select
              value={keyLevel}
              onChange={(e) => setKeyLevel(parseInt(e.target.value))}
              disabled={!season}
              className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              {(availableConfigs.keyLevels[`${region}-${season}`] || []).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Non-Resilient Nodes</label>
            <button
              onClick={() => setShowNonResil(!showNonResil)}
              className={`w-full h-10 px-4 py-2 rounded border transition-colors ${
                showNonResil 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-slate-700 border-slate-600 text-slate-400'
              }`}
            >
              {showNonResil ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="mb-4 text-yellow-400 text-sm">Loading data...</div>
        )}
        
        {loadError && (
          <div className="mb-4 text-red-400 text-sm">Error: {loadError}</div>
        )}
        
        {dataLoaded && (
          <div className="mb-4 text-green-400 text-xs">
            ✓ Data loaded for {region.toUpperCase()} - {season} - Level {keyLevel}
          </div>
        )}

        {/* Search Section */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste RIO profile link or Character-Server (e.g., Kyrasis-Area 52)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={!dataLoaded}
            className="flex-1 px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSearch}
            disabled={!dataLoaded || !searchTerm.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search size={18} />
            Visualize
          </button>
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex-1 relative h-full" ref={containerRef} style={{ minHeight: 0 }}>
        {graph ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
            
            {/* Hover Tooltip */}
            {hoveredEdge && !selectedEdge && (
              <div
                className="fixed bg-slate-900/95 backdrop-blur border border-slate-600 rounded px-3 py-2 text-xs pointer-events-none z-50"
                style={{
                  left: tooltipPos.x + 15,
                  top: tooltipPos.y + 15,
                }}
              >
                <div className="font-semibold mb-1">
                  {hoveredEdge.from.split('-')[0]} → {hoveredEdge.to.split('-')[0]}
                </div>
                <div className="text-slate-400 text-[10px]">Click to view runs</div>
              </div>
            )}
            
            {/* Modal for run links */}
            {selectedEdge && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                  onClick={() => setSelectedEdge(null)}
                />
                
                {/* Modal */}
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 max-w-lg w-full mx-4">
                  <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {selectedEdge.from.split('-')[0]} → {selectedEdge.to.split('-')[0]}
                      </h3>
                      <button
                        onClick={() => setSelectedEdge(null)}
                        className="text-slate-400 hover:text-white text-2xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {selectedEdge.type === 'resil' ? 'Resilient' : 'Non-resilient'} edge
                    </div>
                  </div>
                  
                  <div className="p-4 max-h-96 overflow-y-auto">
                    {selectedEdge.labels && selectedEdge.labels.length > 0 ? (
                      <div className="space-y-2">
                        {selectedEdge.labels.map((runId, i) => {

                          const numericId = runId.includes('#') ? runId.split('#').pop().trim() : runId.trim();

                          const seasonSlug = seasonSlugs[season] || season;
                          const runUrl = `https://raider.io/mythic-plus-runs/${seasonSlug}/${numericId}`;
                          return (
                            <a
                              key={i}
                              href={runUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 hover:border-blue-500 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Run {i + 1}</span>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                </svg>
                              </div>
                              <div className="text-xs text-slate-400 mt-1 truncate">ID: {runId}</div>
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-8">
                        No run data available
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
                className="p-2 bg-slate-800/80 backdrop-blur rounded hover:bg-slate-700"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
                className="p-2 bg-slate-800/80 backdrop-blur rounded hover:bg-slate-700"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="p-2 bg-slate-800/80 backdrop-blur rounded hover:bg-slate-700"
                title="Reset View"
              >
                <Maximize2 size={20} />
              </button>
            </div>

            {/* Stats */}
            <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur rounded px-4 py-2 z-10">
              <div className="text-sm">
                <span className="font-semibold">{targetChar}</span>
                <div className="text-slate-300 text-xs mt-1">
                  {graph.nodes.length} nodes • {graph.edges.length} edges
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur rounded px-4 py-2 text-xs z-10">
              <div className="mb-2 font-semibold">Legend</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-0.5 bg-gray-500"></div>
                <span>Resilient</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-400 opacity-30"></div>
                <span>Non-resilient</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Upload size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select region, season, and key level, then search for a character</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<WoWGraphVisualizer />);