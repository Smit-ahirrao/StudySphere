import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Brain, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import * as d3 from 'd3';
import { StudyPack, WeakArea } from '../../types';

interface Props {
  studyPack: StudyPack;
  weakAreas?: WeakArea[];
}

interface MapNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'center' | 'topic' | 'detail';
  radius: number;
  color: string;
  confidence?: number;
  flashcardCount?: number;
  isWeak?: boolean;
}

interface MapLink extends d3.SimulationLinkDatum<MapNode> {
  sourceId: string;
  targetId: string;
}

const PALETTE = [
  '#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

const buildGraphData = (pack: StudyPack, weakAreas: WeakArea[] = []) => {
  const nodes: MapNode[] = [];
  const links: MapLink[] = [];

  // Center node
  nodes.push({
    id: 'center', label: pack.summary.headline.slice(0, 50),
    type: 'center', radius: 45, color: '#0f172a',
  });

  // Topic nodes
  const topics = pack.keyTopics.slice(0, 8);
  topics.forEach((topic, i) => {
    const weak = weakAreas.find(w => w.topic.toLowerCase().includes(topic.toLowerCase().slice(0, 8)));
    const confidence = weak ? weak.corrects / Math.max(1, weak.corrects + weak.misses) : undefined;
    const fcCount = pack.flashcards.filter(f => f.topic.toLowerCase().includes(topic.toLowerCase().slice(0, 6))).length;
    nodes.push({
      id: `topic-${i}`, label: topic, type: 'topic',
      radius: 28 + Math.min(fcCount * 3, 12), color: PALETTE[i % PALETTE.length],
      confidence, flashcardCount: fcCount, isWeak: confidence !== undefined && confidence < 0.45,
    });
    links.push({ sourceId: 'center', targetId: `topic-${i}`, source: 'center', target: `topic-${i}` });
  });

  // Detail nodes from flashcards
  pack.flashcards.slice(0, 12).forEach((card, i) => {
    const topicIdx = topics.findIndex(t => t.toLowerCase().includes(card.topic.toLowerCase().slice(0, 6)));
    const parentIdx = topicIdx >= 0 ? topicIdx : i % Math.max(1, topics.length);
    const parentId = `topic-${parentIdx}`;
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;
    const detailId = `detail-${i}`;
    nodes.push({
      id: detailId, label: card.question.slice(0, 40), type: 'detail',
      radius: 16, color: parent.color,
    });
    links.push({ sourceId: parentId, targetId: detailId, source: parentId, target: detailId });
  });

  return { nodes, links };
};

const TopicMindMap: React.FC<Props> = ({ studyPack, weakAreas = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<MapNode, MapLink> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; type: string; confidence?: number; fcCount?: number } | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const render = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes, links } = buildGraphData(studyPack, weakAreas);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 560;

    // Defs
    const defs = svg.append('defs');
    PALETTE.forEach((c, i) => {
      const grad = defs.append('radialGradient').attr('id', `rg-${i}`);
      grad.append('stop').attr('offset', '0%').attr('stop-color', c).attr('stop-opacity', 0.95);
      grad.append('stop').attr('offset', '100%').attr('stop-color', d3.color(c)!.darker(0.6).toString()).attr('stop-opacity', 0.85);
    });
    const centerGrad = defs.append('radialGradient').attr('id', 'rg-center');
    centerGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1e293b');
    centerGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a');

    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Container group for zoom/pan
    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    // Force simulation
    const simulation = d3.forceSimulation<MapNode>(nodes)
      .force('link', d3.forceLink<MapNode, MapLink>(links).id(d => d.id).distance(d => {
        const t = (d.target as MapNode).type;
        return t === 'detail' ? 90 : 140;
      }).strength(0.8))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'center' ? -400 : d.type === 'topic' ? -200 : -80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<MapNode>().radius(d => d.radius + 12).strength(0.7));
    simRef.current = simulation;

    // Links (bezier curves)
    const linkSel = g.append('g').selectAll<SVGPathElement, MapLink>('path')
      .data(links).enter().append('path')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', d => (d.target as MapNode).type === 'detail' ? 1 : 1.8)
      .attr('stroke-dasharray', d => (d.target as MapNode).type === 'detail' ? '5 5' : 'none')
      .attr('opacity', 0.35);

    // Node groups
    const nodeSel = g.append('g').selectAll<SVGGElement, MapNode>('g')
      .data(nodes).enter().append('g')
      .attr('cursor', 'grab')
      .call(d3.drag<SVGGElement, MapNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }));

    // Pulse ring for weak areas
    nodeSel.filter(d => d.type === 'topic' && !!d.isWeak)
      .append('circle')
      .attr('r', d => d.radius + 8)
      .attr('fill', 'none').attr('stroke', '#f43f5e').attr('stroke-width', 2)
      .attr('opacity', 0.6)
      .each(function pulse() {
        d3.select(this)
          .attr('r', (d: any) => d.radius + 8).attr('opacity', 0.6)
          .transition().duration(1200).ease(d3.easeSinInOut)
          .attr('r', (d: any) => d.radius + 16).attr('opacity', 0)
          .transition().duration(0)
          .on('end', pulse);
      });

    // Confidence ring
    nodeSel.filter(d => d.type === 'topic' && d.confidence !== undefined)
      .append('circle')
      .attr('r', d => d.radius + 5)
      .attr('fill', 'none')
      .attr('stroke', d => d.confidence! >= 0.7 ? '#10b981' : d.confidence! >= 0.4 ? '#f59e0b' : '#f43f5e')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', d => {
        const circ = 2 * Math.PI * (d.radius + 5);
        return `${d.confidence! * circ} ${(1 - d.confidence!) * circ}`;
      })
      .attr('stroke-dashoffset', d => 2 * Math.PI * (d.radius + 5) * 0.25)
      .attr('opacity', 0.75);

    // Main circle
    nodeSel.append('circle')
      .attr('r', 0)
      .attr('fill', d => d.type === 'center' ? 'url(#rg-center)' : d.type === 'topic'
        ? `url(#rg-${PALETTE.indexOf(d.color) >= 0 ? PALETTE.indexOf(d.color) : 0})`
        : d.color)
      .attr('opacity', d => d.type === 'detail' ? 0.12 : 0.92)
      .attr('filter', d => d.type !== 'detail' ? 'url(#glow)' : null)
      .transition().duration(600).delay((_, i) => i * 40).ease(d3.easeBackOut)
      .attr('r', d => d.radius);

    // Stroke ring for topic/detail
    nodeSel.filter(d => d.type !== 'center')
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', 'none').attr('stroke', d => d.color)
      .attr('stroke-width', d => d.type === 'detail' ? 1.5 : 2)
      .attr('opacity', 0.7);

    // Labels
    nodeSel.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', d => d.type === 'detail' ? '#334155' : 'white')
      .attr('font-size', d => d.type === 'center' ? 11 : d.type === 'topic' ? 9 : 7)
      .attr('font-weight', d => d.type === 'detail' ? 500 : 700)
      .attr('pointer-events', 'none')
      .text(d => {
        const max = d.type === 'center' ? 30 : d.type === 'topic' ? 14 : 18;
        return d.label.length > max ? d.label.slice(0, max - 1) + '…' : d.label;
      });

    // Hover interactions
    nodeSel
      .on('mouseenter', function(event, d) {
        // Dim unconnected
        const connectedIds = new Set([d.id]);
        links.forEach(l => {
          if ((l.source as MapNode).id === d.id) connectedIds.add((l.target as MapNode).id);
          if ((l.target as MapNode).id === d.id) connectedIds.add((l.source as MapNode).id);
        });
        nodeSel.attr('opacity', n => connectedIds.has(n.id) ? 1 : 0.2);
        linkSel.attr('opacity', l =>
          (l.source as MapNode).id === d.id || (l.target as MapNode).id === d.id ? 0.8 : 0.08
        ).attr('stroke', l =>
          (l.source as MapNode).id === d.id || (l.target as MapNode).id === d.id ? (l.target as MapNode).color : '#cbd5e1'
        ).attr('stroke-width', l =>
          (l.source as MapNode).id === d.id || (l.target as MapNode).id === d.id ? 2.5 : 1
        );
        d3.select(this).select('circle').attr('filter', 'url(#glow)');

        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const transform = d3.zoomTransform(svgRef.current!);
          const screenX = transform.applyX(d.x!) - svgRect.left;
          const screenY = transform.applyY(d.y!) - svgRect.top;
          setTooltip({
            text: d.label, x: screenX, y: screenY - d.radius - 16,
            type: d.type, confidence: d.confidence, fcCount: d.flashcardCount,
          });
        }
      })
      .on('mouseleave', function() {
        nodeSel.attr('opacity', 1);
        linkSel.attr('opacity', 0.35).attr('stroke', '#cbd5e1')
          .attr('stroke-width', (d: any) => (d.target as MapNode).type === 'detail' ? 1 : 1.8);
        d3.select(this).select('circle').attr('filter', (d: any) => d.type !== 'detail' ? 'url(#glow)' : null);
        setTooltip(null);
      });

    // Tick
    simulation.on('tick', () => {
      linkSel.attr('d', d => {
        const s = d.source as MapNode, t = d.target as MapNode;
        const dx = t.x! - s.x!, dy = t.y! - s.y!;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
        return `M${s.x},${s.y}A${dr},${dr} 0 0,1 ${t.x},${t.y}`;
      });
      nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }, [studyPack, weakAreas]);

  useEffect(() => { render(); return () => { simRef.current?.stop(); }; }, [render]);

  const handleZoom = (scale: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomRef.current.scaleBy, scale);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-purple-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Topic Mind Map</h3>
          <span className="text-[10px] text-slate-400">Interactive · Drag nodes · Scroll to zoom</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handleZoom(1.3)} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700" title="Zoom in"><ZoomIn size={14} /></button>
          <button onClick={() => handleZoom(0.7)} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700" title="Zoom out"><ZoomOut size={14} /></button>
          <button onClick={handleReset} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700" title="Reset"><RotateCcw size={14} /></button>
          <button onClick={toggleFullscreen} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700" title="Fullscreen">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white dark:border-slate-800 dark:from-slate-950 dark:to-slate-900" style={{ height: isFullscreen ? '100vh' : 560 }}>
        <svg ref={svgRef} className="h-full w-full" style={{ cursor: 'grab' }} />

        {/* Tooltip */}
        {tooltip && (
          <div className="pointer-events-none absolute z-50 animate-in fade-in" style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}>
            <div className="rounded-xl bg-slate-900/95 px-3 py-2 text-center shadow-xl backdrop-blur-sm">
              <div className="text-[11px] font-bold text-white">{tooltip.text}</div>
              {tooltip.type === 'topic' && (
                <div className="mt-1 flex items-center justify-center gap-2 text-[9px]">
                  {tooltip.confidence !== undefined && (
                    <span className={`font-bold ${tooltip.confidence >= 0.7 ? 'text-emerald-400' : tooltip.confidence >= 0.4 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {Math.round(tooltip.confidence * 100)}% mastery
                    </span>
                  )}
                  {tooltip.fcCount !== undefined && <span className="text-slate-400">{tooltip.fcCount} cards</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-900" /> Core topic</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-indigo-500" /> Subtopics</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-indigo-300 bg-indigo-50" /> Flashcards</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-emerald-400" /> High confidence</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-rose-400" /> Weak area</span>
        <span className="text-[9px] italic text-slate-400">Drag nodes to rearrange · Scroll to zoom · Click & drag background to pan</span>
      </div>
    </div>
  );
};

export default TopicMindMap;
