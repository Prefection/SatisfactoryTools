import ELK from 'elkjs/lib/elk.bundled.js';

// ponytail: elkjs's non-worker fallback treats "self defined, document undefined" as "I'm
// inside a real Worker" and skips exporting its constructor. Bun (and Node test runners that
// polyfill self) match that check outside any Worker, so `new ELK()` throws. Real browsers
// always have `window`, so this only fires under Bun/Node headless runs, never in the app.
if (typeof window === 'undefined' && typeof self !== 'undefined') {
	// @ts-expect-error -- deleting a runtime global, not a typed operation
	delete globalThis.self;
}

export interface GraphNode {id: number; label: string; slug?: string; color?: string; x?: number; y?: number}
export interface GraphEdge {from: number; to: number}

const NODE_W = 300, NODE_H = 100;

export async function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): Promise<GraphNode[]> {
	const elk = new ELK();
	const graph = {
		id: 'root',
		layoutOptions: {'elk.algorithm': 'org.eclipse.elk.layered', 'org.eclipse.elk.spacing.nodeNode': '40'},
		children: nodes.map((n) => ({id: String(n.id), width: NODE_W, height: NODE_H})),
		edges: edges.map((e, i) => ({id: `e${i}`, sources: [String(e.from)], targets: [String(e.to)]})),
	};
	const laid = await elk.layout(graph as any);
	const pos = new Map((laid.children ?? []).map((c: any) => [c.id, {x: c.x, y: c.y}]));
	return nodes.map((n) => ({...n, ...pos.get(String(n.id))}));
}
