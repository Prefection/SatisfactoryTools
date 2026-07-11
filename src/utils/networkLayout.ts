import ELK from 'elkjs/lib/elk-api';

export interface GraphNode {id: number; label: string; slug?: string; color?: string; x?: number; y?: number}
export interface GraphEdge {from: number; to: number}

const NODE_W = 300, NODE_H = 100;

// elkjs's bundled fallback (elk.bundled.js) runs its GWT-compiled layout code with a bare
// `g = null` assignment that was never declared `var g`. That's a silent implicit global in
// sloppy mode (Bun/Node's CJS loader), but ES modules are always strict, so Vite serving it to
// the browser turns it into `ReferenceError: g is not defined`. Loading elkjs's real Worker
// instead sidesteps the question entirely: workers run as classic (non-module) scripts, so the
// same sloppy-mode assignment works there exactly as elkjs intends, in Bun and the browser alike.
async function workerUrl(): Promise<string> {
	if (typeof window !== 'undefined') {
		return (await import('elkjs/lib/elk-worker.min.js?url')).default;
	}
	// ponytail: cast around `@types/node`'s (optional, Promise-returning) ImportMeta.resolve
	// augmentation clobbering DOM's synchronous one in this program's merged global types.
	return (import.meta as unknown as {resolve(specifier: string): string}).resolve('elkjs/lib/elk-worker.min.js');
}

export async function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): Promise<GraphNode[]> {
	const elk = new ELK({workerUrl: await workerUrl()});
	const graph = {
		id: 'root',
		layoutOptions: {'elk.algorithm': 'org.eclipse.elk.layered', 'org.eclipse.elk.spacing.nodeNode': '40'},
		children: nodes.map((n) => ({id: String(n.id), width: NODE_W, height: NODE_H})),
		edges: edges.map((e, i) => ({id: `e${i}`, sources: [String(e.from)], targets: [String(e.to)]})),
	};
	const laid = await elk.layout(graph as any);
	// ponytail: real Worker means a real OS thread per call; terminateWorker() exists on the
	// runtime instance but isn't in elkjs's ELK type, hence the cast.
	(elk as unknown as {terminateWorker(): void}).terminateWorker();
	const pos = new Map((laid.children ?? []).map((c: any) => [c.id, {x: c.x, y: c.y}]));
	return nodes.map((n) => ({...n, ...pos.get(String(n.id))}));
}
