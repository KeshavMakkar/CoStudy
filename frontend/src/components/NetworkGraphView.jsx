import React, { useEffect, useRef, useState } from 'react';
import { Share2, Info, Users, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { api } from '../api';

const COMMUNITY_COLORS = [
  '#f97316', // Vibrant Orange
  '#f59e0b', // Warm Amber
  '#ea580c', // Deep Tangerine
  '#fb923c', // Light Coral
  '#e11d48', // Rose Crimson
  '#d97706', // Golden Honey
  '#fbbf24', // Sunburst Gold
  '#c2410c', // Burnt Sienna
];

export default function NetworkGraphView({ onSelectStudent, activeStudent, theme = 'dark' }) {
  const canvasRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [minThreshold, setMinThreshold] = useState(0.20);
  const simulationRef = useRef({ nodes: [], edges: [], animId: null });

  const fetchGraph = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGraphData({ min_threshold: minThreshold });
      setGraphData(data);
      initPhysics(data.nodes, data.edges);
    } catch (err) {
      console.error('Failed to load graph:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [minThreshold]);

  const initPhysics = (nodes, edges) => {
    if (!canvasRef.current) return;
    const width = canvasRef.current.width || 800;
    const height = canvasRef.current.height || 500;

    // Group nodes by community/group_id for initial radial cluster positioning
    const groupCenters = {};
    const uniqueGroups = Array.from(new Set(nodes.map((n) => n.group_id || 0)));
    const numGroups = uniqueGroups.length || 1;

    uniqueGroups.forEach((gId, idx) => {
      const angle = (idx / numGroups) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.32;
      groupCenters[gId] = {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
      };
    });

    const simNodes = nodes.map((n) => {
      const center = groupCenters[n.group_id || 0] || { x: width / 2, y: height / 2 };
      return {
        ...n,
        x: center.x + (Math.random() - 0.5) * 80,
        y: center.y + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
        radius: String(n.id) === String(activeStudent?.id) ? 18 : 14,
      };
    });

    simulationRef.current.nodes = simNodes;
    simulationRef.current.edges = edges;
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      const { nodes, edges } = simulationRef.current;
      if (!nodes || nodes.length === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Simple force-directed relaxation step
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          // Repulsion
          if (dist < 140) {
            const force = (140 - dist) / dist * 0.04;
            nodes[i].vx -= dx * force;
            nodes[i].vy -= dy * force;
            nodes[j].vx += dx * force;
            nodes[j].vy += dy * force;
          }
        }
      }

      // Edge spring attraction
      edges?.forEach((e) => {
        const u = nodes.find((n) => String(n.id) === String(e.source));
        const v = nodes.find((n) => String(n.id) === String(e.target));
        if (u && v) {
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 90 / Math.max(0.3, e.weight);
          const force = (dist - desiredDist) * 0.015 * e.weight;
          u.vx += (dx / dist) * force;
          u.vy += (dy / dist) * force;
          v.vx -= (dx / dist) * force;
          v.vy -= (dy / dist) * force;
        }
      });

      // Damping & bound constraints
      nodes.forEach((n) => {
        n.vx *= 0.88;
        n.vy *= 0.88;
        n.x += n.vx;
        n.y += n.vy;

        // Bounding box
        n.x = Math.max(30, Math.min(width - 30, n.x));
        n.y = Math.max(30, Math.min(height - 30, n.y));
      });

      // Draw background
      ctx.clearRect(0, 0, width, height);

      // Draw Edges
      edges?.forEach((e) => {
        const u = nodes.find((n) => String(n.id) === String(e.source));
        const v = nodes.find((n) => String(n.id) === String(e.target));
        if (u && v) {
          const isHighlighted =
            (hoveredNode && (String(u.id) === String(hoveredNode.id) || String(v.id) === String(hoveredNode.id))) ||
            (hoveredEdge && hoveredEdge === e);

          ctx.beginPath();
          ctx.moveTo(u.x, u.y);
          ctx.lineTo(v.x, v.y);

          if (isHighlighted) {
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
            ctx.lineWidth = 2.5;
          } else {
            ctx.strokeStyle = theme === 'light' 
              ? `rgba(249, 115, 22, ${Math.max(0.18, e.weight * 0.45)})`
              : `rgba(249, 115, 22, ${Math.max(0.08, e.weight * 0.35)})`;
            ctx.lineWidth = Math.max(0.8, e.weight * 2.2);
          }
          ctx.stroke();
        }
      });

      // Draw Nodes
      nodes.forEach((n) => {
        const isHovered = hoveredNode && String(n.id) === String(hoveredNode.id);
        const isActive = activeStudent && String(n.id) === String(activeStudent.id);
        const color = COMMUNITY_COLORS[(n.group_id || 0) % COMMUNITY_COLORS.length];

        // Outer glow
        if (isHovered || isActive) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, 2 * Math.PI);
          ctx.fillStyle = `${color}40`;
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = isActive ? 3 : 1.5;
        ctx.strokeStyle = isActive ? '#ffffff' : (theme === 'light' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.7)');
        ctx.stroke();

        // Node Label Text
        ctx.font = isHovered || isActive ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.fillStyle = isHovered || isActive ? '#f97316' : (theme === 'light' ? '#0f172a' : '#cbd5e1');
        ctx.textAlign = 'center';
        ctx.fillText(n.name.split(' ')[0], n.x, n.y + n.radius + 13);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [hoveredNode, hoveredEdge, activeStudent, theme]);

  // Handle Canvas Mouse Move
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { nodes } = simulationRef.current;
    if (!nodes) return;

    const hitNode = nodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    setHoveredNode(hitNode || null);
  };

  const handleCanvasClick = () => {
    if (hoveredNode && onSelectStudent) {
      onSelectStudent(hoveredNode);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6 shadow-2xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Compatibility Network & Louvain Clusters</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time force-directed graph where nodes are students and color clusters represent modular study cohorts
          </p>
        </div>

        {/* Threshold Slider Control */}
        <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Min Edge Threshold:</span>
            <span className="font-mono text-orange-600 dark:text-orange-400 font-extrabold">{minThreshold.toFixed(2)}</span>
          </div>

          <input
            type="range"
            min="0.05"
            max="0.60"
            step="0.05"
            value={minThreshold}
            onChange={(e) => setMinThreshold(parseFloat(e.target.value))}
            className="w-28 accent-orange-500 cursor-pointer"
          />

          <button
            onClick={fetchGraph}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
            title="Recalculate Graph Layout"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas & Community Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Interactive Canvas */}
        <div className="lg:col-span-3 relative rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-inner flex items-center justify-center min-h-[480px]">
          <canvas
            ref={canvasRef}
            width={780}
            height={480}
            onMouseMove={handleMouseMove}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-pointer"
          />

          {/* Hovered Node Tooltip Card */}
          {hoveredNode && (
            <div className="absolute top-4 left-4 p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-orange-500/50 shadow-2xl text-xs space-y-1.5 backdrop-blur-md animate-fade-in pointer-events-none">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COMMUNITY_COLORS[(hoveredNode.group_id || 0) % COMMUNITY_COLORS.length] }}
                />
                <span className="font-black text-slate-900 dark:text-white">{hoveredNode.name}</span>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">Cohort #{hoveredNode.group_id}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">{hoveredNode.major}</p>
              <div className="flex flex-wrap gap-1">
                {(hoveredNode.courses || []).map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-slate-800 text-orange-700 dark:text-slate-300 font-bold text-[9px] border border-orange-200 dark:border-slate-700">
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-orange-500 font-semibold pt-1">💡 Click node to switch perspective</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Louvain Community Clusters Summary */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-orange-500" />
              Louvain Modularity Clusters
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Nodes with the same color belong to the same Louvain-detected partition.
            </p>

            <div className="space-y-2 pt-1">
              {(graphData.groups || []).map((g, idx) => {
                const color = COMMUNITY_COLORS[g.id % COMMUNITY_COLORS.length];
                return (
                  <div 
                    key={g.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{g.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-slate-900 text-orange-700 dark:text-slate-300 font-bold border border-orange-200 dark:border-slate-700">
                      {g.member_ids?.length || 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Graph Metrics */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Total Network Nodes:</span>
              <strong className="text-slate-900 dark:text-white">{graphData.nodes?.length || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Active Compatibility Edges:</span>
              <strong className="text-slate-900 dark:text-white">{graphData.edges?.length || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Partition Density:</span>
              <strong className="text-orange-600 dark:text-orange-400">High Modularity</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
