// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import {
  Background,
  BaseEdge,
  type EdgeProps,
  Handle,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  borderPoint,
  type GraphInput,
  NODE_HEIGHT,
  NODE_WIDTH,
  type Orientation,
  type PersonNode,
  socialLayout,
} from './socialLayout';
import { type LegendEntry, TIE_LEGEND } from './legend';

// Both handles sit at the node's centre, unseen, so a tie runs centre to centre in any direction.
const CENTRED_HANDLE = { top: '50%', left: '50%', opacity: 0, pointerEvents: 'none' } as const;
/** Room round the rings when the graph first fits its box, as a fraction of the box. */
const FIT_PADDING = 0.08;
/** Below this width (a phone) the graph runs top to bottom, so names stay readable. */
const PORTRAIT_BELOW = 640;
/** The shortest a wide canvas gets, however flat the layout, in pixels. */
const MIN_HEIGHT = 288;
const MIN_ZOOM = 0.3;
// No bigger than life: a small network keeps the same size of names as a large one.
const MAX_ZOOM = 1;

function PersonNodeView({ data }: NodeProps<PersonNode>): ReactElement {
  return (
    <>
      <Handle type='target' position={Position.Top} style={CENTRED_HANDLE} isConnectable={false} />
      <span className='genealogy-node__label'>{data.label}</span>
      <Handle type='source' position={Position.Top} style={CENTRED_HANDLE} isConnectable={false} />
    </>
  );
}

const NODE_TYPES = { person: PersonNodeView };

/** Width over height of the box round `nodes`, with the fit's padding. */
export function aspectOf(nodes: readonly PersonNode[]): number {
  if (nodes.length === 0) {
    return 1;
  }
  const xs = nodes.map((node) => node.position.x);
  const ys = nodes.map((node) => node.position.y);
  const width = Math.max(...xs) - Math.min(...xs) + NODE_WIDTH;
  const height = Math.max(...ys) - Math.min(...ys) + NODE_HEIGHT;
  return width / height;
}

/**
 * Whether the graph in `element` runs side to side or, on a narrow box, top to bottom, kept
 * current as it resizes (side to side until measured). Width alone decides, as the box's height
 * follows the layout.
 */
function useOrientation(element: RefObject<HTMLDivElement | null>): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  useEffect(() => {
    const box = element.current;
    if (box === null) {
      return undefined;
    }
    const measure = (): void => {
      setOrientation(box.clientWidth < PORTRAIT_BELOW ? 'portrait' : 'landscape');
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => {
      observer.disconnect();
    };
  }, [element]);
  return orientation;
}

// A tie label's background box: its padding round the text, and its corner radius.
const LABEL_PADDING_X = 4;
const LABEL_PADDING_Y = 2;
const LABEL_PADDING: [number, number] = [LABEL_PADDING_X, LABEL_PADDING_Y];
const LABEL_RADIUS = 3;

/** A straight tie from border to border of the two boxes, its label midway. */
function TieEdge({ sourceX, sourceY, targetX, targetY, markerEnd, label, style }: EdgeProps): ReactElement {
  const source = { x: sourceX, y: sourceY };
  const target = { x: targetX, y: targetY };
  const start = borderPoint(source, target);
  const end = borderPoint(target, source);
  return (
    <BaseEdge
      path={`M ${String(start.x)},${String(start.y)} L ${String(end.x)},${String(end.y)}`}
      {...(markerEnd === undefined ? {} : { markerEnd })}
      {...(style === undefined ? {} : { style })}
      label={label}
      labelX={(start.x + end.x) / 2}
      labelY={(start.y + end.y) / 2}
      labelShowBg
      labelBgPadding={LABEL_PADDING}
      labelBgBorderRadius={LABEL_RADIUS}
    />
  );
}

const EDGE_TYPES = { tie: TieEdge };

/**
 * `graph` drawn round its centre, along the longer side of its box, each tie a line labelled with its subkind (an arrow when it is
 * directed), each group branching off on its own side. Clicking someone opens their page.
 * Kinds an app adds are drawn in the default tie colour, named by `legend`. The graph is a picture of the lists beside it, which carry the same
 * people for keyboards and screen readers, so nothing in it takes focus.
 */
export function NetworkGraph({
  graph,
  legend = TIE_LEGEND,
}: {
  graph: GraphInput;
  legend?: readonly LegendEntry[];
}): ReactElement {
  const router = useRouter();
  const canvas = useRef<HTMLDivElement>(null);
  const orientation = useOrientation(canvas);
  const { nodes, edges } = useMemo(() => {
    const layout = socialLayout(graph, orientation);
    return { nodes: layout.nodes.map((node) => ({ ...node, type: 'person' })), edges: layout.edges };
  }, [graph, orientation]);
  // A wide canvas takes the layout's shape, so a flat network doesn't sit in a tall empty box.
  const shape = orientation === 'landscape' ? { aspectRatio: String(aspectOf(nodes)), minHeight: MIN_HEIGHT } : undefined;
  const kinds = new Set(graph.ties.map((tie) => tie.kind));

  return (
    <figure className='genealogy-network grid gap-2'>
      <div
        ref={canvas}
        className={`genealogy-network__canvas genealogy-network__canvas--${orientation}`}
        style={shape}
        aria-hidden='true'
      >
        <ReactFlowProvider>
          <ReactFlow
            // Laid out again for a box turned the other way, so fit the new layout afresh.
            key={orientation}
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            fitView
            fitViewOptions={{ padding: FIT_PADDING }}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            nodesFocusable={false}
            edgesFocusable={false}
            // The page scrolls past the graph; pinching or dragging still zooms and pans it.
            zoomOnScroll={false}
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, node) => {
              if (node.data.href !== undefined) {
                router.push(node.data.href);
              }
            }}
          >
            <Background gap={24} size={1} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <figcaption className='flex flex-wrap gap-4 text-xs text-muted-foreground'>
        {legend
          .filter((entry) => kinds.has(entry.kind))
          .map((entry) => (
            <span key={entry.kind} className='flex items-center gap-1'>
              <span className={`genealogy-legend genealogy-legend--${entry.kind}`} />
              {entry.label}
            </span>
          ))}
      </figcaption>
    </figure>
  );
}
