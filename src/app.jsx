import React, { useState, useRef, useEffect, useCallback, useReducer } from "react";

import { SearchBar } from "./components/SearchBar";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { InfoBox } from "./components/InfoBox";
import { GraphStats } from "./components/GraphStats"
import { ZoomControls } from "./components/ZoomControls";
import { Tooltip } from "./components/Tooltip";
import { EdgeSelectionModal } from "./components/EdgeSelectionModal";
import { RunLinksModal } from "./components/RunLinksModal";
import { EmptyState } from "./components/EmptyState";

import { useViridis } from "./hooks/useViridis";
import { useSlugMapping } from "./hooks/useSlugMapping";
import { useConfig } from "./hooks/useConfig";
import { useGraphData } from "./hooks/useGraphData";

import { interactionReducer, initialInteractionState } from "./interactionState";
import { readUrlParams } from "./readUrlParams";
import { buildGraphCore } from "./buildGraphCore";
import { parseCharacterInput, isRioCharacterURL, resolveRealm } from "./parseCharacterInput";
import { safeConfigState } from "./safeConfigState";
import { formatCharacterId } from "./formatCharacterId";


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
      alert('Graph contains cycles - cannot create hierarchical layout'); // if this ever triggers - something went really wrong
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

    if (!qp.character || !qp.realm) return

    const realmName = resolveRealm(qp.realm, slugMapping);
    const targetId = `${qp.character}-${realmName}`;
    setSearchTerm(formatCharacterId(targetId).full);
    setTargetChar(targetId);
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
      const label = formatCharacterId(node).name;
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
      setSearchTerm(formatCharacterId(interaction.hoveredNode).full);

      dispatchInteraction({ type: 'RESET' });
      return;
    }

    if (interaction.nearbyEdges.length > 0 && e.button !== 2) {

      // Click on edge - open modal
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
      const label = formatCharacterId(node).name;

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
    
    // Check each edge - this is horrible
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
        <InfoBox />
        
        {/* Configuration Section */}
        <ConfigurationPanel
          config={config}
          onConfigChange={updateConfig}
          availableConfigs={availableConfigs}
          showNonResil={showNonResil}
          onToggleNonResil={() => setShowNonResil(!showNonResil)}
        />

        {/* Data Loading Text Status */}
        <LoadingIndicator
          loading={graphDataLoading}
          error={graphDataError}
          dataLoaded={dataLoaded}
          config={config}
        />

        {/* Search Section */}
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          disabled={!dataLoaded}
        />
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
            <Tooltip interaction={interaction} />
            
            {/* Edge selection dropdown when multiple edges overlap */}
            <EdgeSelectionModal
              edgeOptions={interaction.edgeOptions}
              hoveredNode={interaction.hoveredNode}
              onSelectEdge={(edge) => dispatchInteraction({ type: 'SELECT_EDGE', edge })}
              onClose={() => dispatchInteraction({ type: 'CLOSE_MODAL' })}
            />

            {/* Modal for run links */}
            <RunLinksModal
              selectedEdge={interaction.selectedEdge}
              season={config.season}
              onClose={() => dispatchInteraction({ type: 'RESET' })}
            />
            
            {/* Controls */}
            <ZoomControls
              onZoomIn={() => setZoom(prev => Math.min(5, prev * 1.2))}
              onZoomOut={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
              onReset={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            />

            {/* Stats */}
            <GraphStats
              targetChar={targetChar}
              nodeCount={graph.nodes.length}
              edgeCount={graph.edges.length}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default WoWGraphVisualizer;