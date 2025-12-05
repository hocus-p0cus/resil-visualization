import React, { useState, useRef, useEffect, useCallback, useReducer } from "react";

import { Upload, Search, ZoomIn, ZoomOut, Maximize2 } from "./components/icons_index";

import { useViridis } from "./hooks/useViridis";
import { useSlugMapping } from "./hooks/useSlugMapping";
import { useConfig } from "./hooks/useConfig";
import { useGraphData } from "./hooks/useGraphData";

import { interactionReducer, initialInteractionState } from "./interactionState";
import { getDungeonCode } from "./getDungeonCode";
import { readUrlParams } from "./readUrlParams";
import { buildGraphCore } from "./buildGraphCore";
import { parseCharacterInput, isRioCharacterURL } from "./parseCharacterInput";
import { safeConfigState } from "./safeConfigState";


const WoWGraphVisualizer = () => {
  // Configuration state
  const { availableConfigs, defaults, loading: configLoading, error: configError } = useConfig();

  const [config, setConfig] = useState({
    region: '',
    season: '',
    keyLevel: 0
  });

  const updateConfig = ({ region, season, keyLevel }) => {
    setConfig(prev => 
      safeConfigState(prev, availableConfigs, { region, season, keyLevel })
    );
  };

  const [showNonResil, setShowNonResil] = useState(false);

  useEffect(() => {
    if (configLoading) return;

    setConfig({
      region: defaults.region,
      season: defaults.season,
      keyLevel: defaults.keyLevel
    });
  }, [defaults]);

  // one more effect to merge errors ?
  
  // Season slug mapping
  const seasonSlugs = {
    'tww-season2': 'season-tww-2',
    'tww-season3': 'season-tww-3',
  };
  
  // Data state
  const { timestamps, downEdges, nonResilEdges, loading: graphDataLoading, error: graphDataError } = useGraphData(config);

  const dataLoaded = timestamps && downEdges && nonResilEdges;
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [targetChar, setTargetChar] = useState('');

  const [graph, setGraph] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [interaction, dispatchInteraction] = useReducer(
    interactionReducer,
    initialInteractionState
  );

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const { slugMapping, error: slugError } = useSlugMapping();
  const { viridis: viridis256, error: viridisError } = useViridis();

  const buildGraph = useCallback((target) => {
    const graph = buildGraphCore({
        target, 
        downEdges, 
        nonResilEdges, 
        showNonResil
    });
  
    if (!graph) {
      alert('Graph contains cycles - cannot create hierarchical layout');
      return;
    }
    
    setGraph(graph);
  }, [downEdges, nonResilEdges, showNonResil]);

  // runs only once, supposed to trigger a graph build for data from URL params
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!slugMapping) return;
    if (!downEdges || !nonResilEdges) return;

    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const qp = readUrlParams();

    if (qp.character && qp.realm) {

      if (slugMapping && slugMapping[qp.realm]) {
        const realmName = slugMapping[qp.realm].toLowerCase();
        const targetId = `${qp.character}-${realmName}`;
        setSearchTerm(targetId);
        setTargetChar(targetId);
      }
    }
  }, [slugMapping, downEdges, nonResilEdges]); // this edge dependency is hacky (maybe dataloaded instead ?)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const disableContextMenu = e => e.preventDefault();
    canvas.addEventListener('contextmenu', disableContextMenu);

    return () => canvas.removeEventListener('contextmenu', disableContextMenu);
  }, [canvasRef.current, graph]);

  const handlePaste = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const pastedText = e.clipboardData?.getData('text') || '';
    if (!isRioCharacterURL(pastedText)) return;
    
    e.preventDefault();
    if (!dataLoaded) return;
    
    setSearchTerm(pastedText.trim());
    const parsed = parseCharacterInput(
      pastedText.trim(),
      slugMapping,
      downEdges,
      nonResilEdges
    );

    updateConfig( { region: parsed.region } );
    setTargetChar(parsed.charId);
  }, [
    dataLoaded,
    slugMapping,
    downEdges,
    nonResilEdges
  ]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

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

      if (maxTime === minTime) {

        const [r0, g0, b0] = viridis256[0];
        return `rgb(${r0}, ${g0}, ${b0})`;
      }

      const t = (parsedTimes[charId] - minTime) / (maxTime - minTime);
      const clampedT = Math.min(Math.max(t, 0), 1);
      const idx = Math.floor(clampedT * (viridis256.length - 1));

      const [r, g, b] = viridis256[idx];
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
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
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

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    const parsed = parseCharacterInput(
        searchTerm,
        slugMapping,
        downEdges,
        nonResilEdges
      );

    updateConfig({ region: parsed.region });
    setTargetChar(parsed.charId);
  };

  // Rebuild graph when targetChar, season or key level changes
  // (configuration change implies reload of edge data)

  // but if a link is pasted for another region
  // - it changes region first, redraws the graph once (fake graph)
  // - then draws the right one
  // although I think it was doing that before anyway
  useEffect(() => {
    if (!targetChar || !dataLoaded) return;

    buildGraph(targetChar);
  }, [targetChar, dataLoaded, buildGraph]);

  useEffect(() => {
    if (!targetChar) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [targetChar]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); // Prevent page scroll
        setZoom(1);
        setPan({ x: 0, y: 0 });
        dispatchInteraction({ type: 'RESET' });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleMouseDown = (e) => {

    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.button === 2 && interaction.hoveredNode) {
      setTargetChar(interaction.hoveredNode);
      setSearchTerm(interaction.hoveredNode);

      dispatchInteraction({ type: 'RESET' });
      return;
    }

    if (interaction.nearbyEdges.length > 0 && e.button !== 2) {
      // Click on edge - open modal
      //setSelectedEdge(hoveredEdge);

      if (interaction.nearbyEdges.length === 1) {
        // Only one edge nearby → open its modal directly
        dispatchInteraction({
          type: 'SELECT_EDGE',
          edge: interaction.nearbyEdges[0],
        });
      } else {
        // Multiple overlapping edges → show selection list
        dispatchInteraction({
          type: 'SHOW_EDGE_OPTIONS',
          edges: interaction.nearbyEdges,
        });
      }
      return;
    }

    if (interaction.hoveredNode) {
      // Parse character name and realm from node format "charName-realm"
      const [characterName, ...realmParts] = interaction.hoveredNode.split('-');
      const realmName = realmParts.join('-'); // In case realm has hyphens
      
      // Construct the URL with query parameters
      const params = new URLSearchParams({
        region: config.region,
        season: config.season,
        character: characterName,
        realm: realmName
      });
      
      window.open(`https://hocus-p0cus.github.io/?${params.toString()}`, '_blank');
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

    // Check for edge and node hover
    if (!graph || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Transform mouse coordinates to canvas coordinates
    const canvasX = (mouseX - rect.width / 2 - pan.x) / zoom;
    const canvasY = (mouseY - rect.height / 2 - pan.y) / zoom;

     // Check for node hover first (higher priority)

    let foundNode = null;
    for (const node of graph.nodes) {
      const pos = graph.positions[node];
      const label = node.split('-')[0];

      // Approximate node dimensions
      const ctx = canvas.getContext('2d');
      ctx.font = '12px sans-serif';

      const metrics = ctx.measureText(label);
      const padding = 8;
      const boxWidth = metrics.width + padding * 2;
      const boxHeight = 24;

      // Check if mouse is within node bounds

      if (canvasX >= pos.x - boxWidth / 2 && 
          canvasX <= pos.x + boxWidth / 2 &&
          canvasY >= pos.y - boxHeight / 2 && 
          canvasY <= pos.y + boxHeight / 2) {
        foundNode = node;
        break;
      }
    }

    if (foundNode) {
      dispatchInteraction({
        type: 'HOVER_NODE',
        node: foundNode,
        x: e.clientX,
        y: e.clientY,
      });
      canvas.style.cursor = 'pointer';
      return;
    }
    
    // Check each edge
    const edgesNear = [];
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
        edgesNear.push(edge);
      }
    }
    
    if (edgesNear.length > 0) {
      dispatchInteraction({
        type: 'HOVER_EDGE',
        edge: edgesNear[0],
        nearbyEdges: edgesNear,
        x: e.clientX,
        y: e.clientY,
      });
      canvas.style.cursor = 'pointer';
      return;
    }
    dispatchInteraction({ type: 'HOVER_NOTHING' });
    canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700 p-4">
        <h1 className="text-2xl font-bold mb-4">Resilient key Relations Visualizer</h1>

        {/* Info Box - Top Right */}
        <div className="fixed top-3 right-4 bg-slate-100/90 border border-slate-300 rounded-lg px-3 py-2.5 text-sm shadow-md z-[1000]">
          <div className="flex flex-col gap-0.4">
            <a 
              href="https://github.com/hocus-p0cus/resil-visualization#readme" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              📄 Project README
            </a>
            <div className="text-slate-700">
              Made by: <a 
                href="https://raider.io/characters/eu/outland/Graliboar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                hocus_p0cus
              </a>
            </div>
          </div>
        </div>
        
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1 text-slate-300">Region</label>
            <select
              value={config.region}
              onChange={(e) => {
                const newRegion = e.target.value;
                updateConfig({ region: newRegion });
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
              value={config.season}
              onChange={(e) => {
                const newSeason = e.target.value;
                updateConfig({ season: newSeason });
              }}
              disabled={!config.region}
              className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              {(availableConfigs.seasons[config.region] || []).map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Key Level</label>
            <select
              value={config.keyLevel}
              onChange={(e) => 
                updateConfig({ keyLevel: parseInt(e.target.value) })
              }
              disabled={!config.season}
              className="w-full px-4 py-2 bg-slate-700 rounded border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              {(availableConfigs.keyLevels[`${config.region}-${config.season}`] || []).map(level => (
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

        <div className="mb-4 h-5">
          {graphDataLoading && (
            <div className="text-yellow-400 text-sm">Loading data...</div>
          )}
          
          {!graphDataLoading && graphDataError && (
            <div className="text-red-400 text-sm">Error: {graphDataError}</div>
          )}
          
          {!graphDataLoading && !graphDataError && dataLoaded && (
            <div className="text-green-400 text-xs">
              ✓ Data loaded for {config.region.toUpperCase()} - {config.season} - Level {config.keyLevel}
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste RIO profile link or Character-Server (e.g., Graliboar-Outland)"
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
            
            {/* Hover Tooltip for edges*/}
            {interaction.hoveredEdge && !interaction.selectedEdge && (
              <div
                className="fixed bg-slate-900/95 backdrop-blur border border-slate-600 rounded px-3 py-2 text-xs pointer-events-none z-50"
                style={{
                  left: interaction.tooltip.x + 15,
                  top: interaction.tooltip.y + 15,
                }}
              >
                <div className="font-semibold mb-1">
                  {interaction.hoveredEdge.from.split('-')[0]} → {interaction.hoveredEdge.to.split('-')[0]}
                </div>
                <div className="text-slate-400 text-[10px]">Click to view runs</div>
              </div>
            )}

            {/* Hover Tooltip for Nodes */}
            {interaction.hoveredNode && !interaction.selectedEdge && (
              <div
                className="fixed bg-slate-900/95 backdrop-blur border border-slate-600 rounded px-3 py-2 text-xs pointer-events-none z-50"
                style={{
                  left: interaction.tooltip.x + 15,
                  top: interaction.tooltip.y + 15,
                }}
              >
                <div className="font-semibold mb-1">
                  Click to see character report
                </div>
                <div className="text-slate-400 text-[10px]">Is it resilient?</div>
              </div>
            )}
            
            {/* Edge selection dropdown when multiple edges overlap */}
            {!interaction.hoveredNode && interaction.edgeOptions.length > 0 && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                  onClick={() => dispatchInteraction({ type: 'CLOSE_MODAL' })}
                />

                {/* Small centered selection box */}
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                bg-slate-800 border border-slate-600 rounded-lg shadow-2xl
                                z-50 max-w-sm w-full mx-4">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Select an edge</h3>
                    <button
                      onClick={() => dispatchInteraction({ type: 'CLOSE_MODAL' })}
                      className="text-slate-400 hover:text-white text-2xl leading-none"
                    >
                      ×
                    </button>
                  </div>

                  <div className="p-3 max-h-80 overflow-y-auto">
                    {interaction.edgeOptions.map((edge, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center px-3 py-2 mb-2 rounded-md border border-slate-700 hover:border-blue-500 hover:bg-slate-700/40 transition-colors cursor-pointer"
                        onClick={() => dispatchInteraction({
                          type: 'SELECT_EDGE',
                          edge: edge,
                        })}
                      >
                        <span className="font-medium">
                          {edge.from.split('-')[0]} → {edge.to.split('-')[0]}
                        </span>
                        <span className="text-xs text-slate-400">
                          {edge.type === 'resil' ? 'Resilient' : 'Non-resilient'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Modal for run links */}
            {interaction.selectedEdge && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                  onClick={() => dispatchInteraction({ type: 'RESET' })}
                />
                
                {/* Modal */}
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 max-w-lg w-full mx-4">
                  <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {interaction.selectedEdge.from.split('-')[0]} → {interaction.selectedEdge.to.split('-')[0]}
                      </h3>
                      <button
                        onClick={() => dispatchInteraction({ type: 'RESET' })}
                        className="text-slate-400 hover:text-white text-2xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {interaction.selectedEdge.type === 'resil' ? 'Resilient' : 'Non-resilient'} edge
                    </div>
                  </div>
                  
                  <div className="p-4 max-h-96 overflow-y-auto">
                    {interaction.selectedEdge.labels && interaction.selectedEdge.labels.length > 0 ? (
                      <div className="space-y-2">
                        {interaction.selectedEdge.labels.map((runId, i) => {

                          const numericId = runId.includes('#') ? runId.split('#').pop().trim() : runId.trim();

                          const dungeonCode = getDungeonCode(runId);
                          const seasonSlug = seasonSlugs[config.season] || config.season;
                          const runUrl = `https://raider.io/mythic-plus-runs/${seasonSlug}/${numericId}`;
                          return (
                            <a
                              key={i}
                              href={runUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative rounded border border-slate-600 hover:border-blue-500 transition-colors overflow-hidden group h-20"
                            >
                              {dungeonCode && (
                                <img 
                                  src={`images/${dungeonCode}.jpg`}
                                  alt={dungeonCode}
                                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="relative z-10 px-4 py-3 h-full flex flex-col justify-center bg-gradient-to-r from-slate-900/80 to-transparent">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-white drop-shadow-lg">{dungeonCode || 'Run'}</span>
                                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                  </svg>
                                </div>
                                <div className="text-xs text-slate-300 mt-1 truncate drop-shadow">ID: {numericId}</div>
                              </div>
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

export default WoWGraphVisualizer;