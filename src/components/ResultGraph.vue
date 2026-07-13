<script setup lang="ts">
import {computed, markRaw, nextTick, onMounted, ref, watch} from 'vue';
import {MarkerType, useVueFlow, VueFlow} from '@vue-flow/core';
import {Background} from '@vue-flow/background';
import {Controls} from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/controls/dist/style.css';
import {layoutGraph} from '@src/utils/networkLayout';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';
import {GraphNode} from '@src/Tools/Production/Result/Nodes/GraphNode';
import {RecipeNode} from '@src/Tools/Production/Result/Nodes/RecipeNode';
import {MinerNode} from '@src/Tools/Production/Result/Nodes/MinerNode';
import {InputNode} from '@src/Tools/Production/Result/Nodes/InputNode';
import {ProductNode} from '@src/Tools/Production/Result/Nodes/ProductNode';
import {ByproductNode} from '@src/Tools/Production/Result/Nodes/ByproductNode';
import {SinkNode} from '@src/Tools/Production/Result/Nodes/SinkNode';
import data from '@src/Data/Data';
import {Strings} from '@src/Utils/Strings';
import FactoryNode from '@src/components/FactoryNode.vue';

type Side = 'left' | 'right' | 'top' | 'bottom';

interface FactoryPort {
	id: string;   // edge id — the handle id edges connect to
	name: string; // item display name (title/tooltip)
	side?: Side;  // single-port leaf nodes face their neighbour to shorten the edge
}

interface FactoryNodeData {
	kind: string;
	icon: string;
	title: string;
	machine?: string;
	machineIcon?: string;
	machineCount?: number;
	rate?: string;
	accent: string;
	inputs: FactoryPort[];  // one target handle per distinct incoming item
	outputs: FactoryPort[]; // one source handle per distinct outgoing item
}

const props = defineProps<{result: ProductionResult; straight?: boolean}>();

// The side (of 4) a leaf node's single port should sit on to point at its neighbour.
function sideToNeighbour(cx: number, cy: number, nx: number, ny: number): Side {
	const dx = nx - cx, dy = ny - cy;
	if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
	return dy >= 0 ? 'bottom' : 'top';
}

// Vue Flow's Node/Edge generics instantiate too deeply for the object literals below
// (TS2589), so the flow arrays and node-types map stay loose — the same tradeoff the
// brief took. The view-model above is fully typed, which is where correctness matters.
const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);
const height = ref(460);
const nodeTypes: Record<string, any> = {factory: markRaw(FactoryNode)};
// A unique id keeps this flow's store isolated so a tab switch that remounts the
// component can't inherit stale nodes or duplicate init handlers.
const flowId = `result-graph-${Math.random().toString(36).slice(2)}`;
const {fitView, onNodesInitialized, onNodeDragStop, getNodes, updateNodeData, updateNodeInternals} = useVueFlow(flowId);

// edge id -> its endpoints, so a port can be ordered by the node it connects to.
const edgeEnds = new Map<string, {source: number; target: number}>();

// elk lays nodes out on a 100px-tall grid; size the frame to the chain instead of a
// fixed height so small graphs don't leave a black void and big ones still get room.
const NODE_H = 100, H_MIN = 440, H_MAX = 820;

function rate(amount: number): string {
	return `${Strings.formatNumber(amount)} / min`;
}

// Build the FactoryNode view-model from a result graph node. Titles and icons read
// straight off the domain objects (recipe/resource) — not getTitle(), which folds in
// HTML and machine/amount lines meant for the old flat graph label.
function viewModel(node: GraphNode): FactoryNodeData {
	const accent = node.getVisNode().color?.background ?? '#5f7183';

	if (node instanceof RecipeNode) {
		const product = node.products[0];
		return {
			kind: 'recipe',
			accent,
			title: node.recipeData.recipe.name,
			icon: product?.resource.className ?? '',
			machine: node.recipeData.machine.name,
			machineIcon: node.recipeData.machine.className,
			machineCount: node.machineData.countMachines(),
			rate: product ? rate(product.maxAmount) : undefined,
			inputs: [],
			outputs: [],
		};
	}

	const amount = node.getOutputs()[0] ?? node.getInputs()[0];
	const name = amount?.resource.name ?? '';
	let kind = 'node';
	let title = name;
	if (node instanceof MinerNode) {
		kind = 'miner';
	} else if (node instanceof InputNode) {
		kind = 'input';
		title = `Input: ${name}`;
	} else if (node instanceof ProductNode) {
		kind = 'product';
	} else if (node instanceof ByproductNode) {
		kind = 'byproduct';
		title = `Byproduct: ${name}`;
	} else if (node instanceof SinkNode) {
		kind = 'sink';
		title = `Sink: ${name}`;
	}

	return {
		kind,
		accent,
		title,
		icon: amount?.resource.className ?? '',
		rate: amount ? rate(amount.maxAmount) : undefined,
		inputs: [],
		outputs: [],
	};
}

async function draw(): Promise<void> {
	const graph = props.result.graph;

	// Per-node port counts drive the card's real height, so elk can space rows without overlap
	// (a node with 4 inputs is much taller than a one-line miner card).
	const inCount = new Map<number, number>();
	const outCount = new Map<number, number>();
	for (const e of graph.edges) {
		outCount.set(e.from.id, (outCount.get(e.from.id) ?? 0) + 1);
		inCount.set(e.to.id, (inCount.get(e.to.id) ?? 0) + 1);
	}
	const nodeHeight = (id: number) => {
		const ports = Math.max(inCount.get(id) ?? 0, outCount.get(id) ?? 0);
		return Math.max(78, ports * 26 + 16); // ~card base, grown by stacked ports
	};

	// elk layout on a flat {id,label} view; the view-model supplies the real card content.
	const laid = await layoutGraph(
		graph.nodes.map((n) => ({id: n.id, label: n.getTitle(), width: 224, height: nodeHeight(n.id)})),
		graph.edges.map((e) => ({from: e.from.id, to: e.to.id})),
	);
	const pos = new Map(laid.map((n) => [n.id, {x: n.x ?? 0, y: n.y ?? 0}]));
	const ys = laid.map((n) => n.y ?? 0);
	height.value = ys.length
		? Math.min(Math.max(Math.max(...ys) - Math.min(...ys) + NODE_H + 48, H_MIN), H_MAX)
		: H_MIN;

	// One port per EDGE, not per item: every outgoing edge gets its own source handle and
	// every incoming edge its own target handle (keyed by edge id), so two connections
	// carrying the same item don't merge into a single point.
	const outPorts = new Map<number, FactoryPort[]>();
	const inPorts = new Map<number, FactoryPort[]>();
	const portList = (m: Map<number, FactoryPort[]>, id: number) => {
		let list = m.get(id);
		if (!list) m.set(id, (list = []));
		return list;
	};
	edgeEnds.clear();
	for (const e of graph.edges) {
		const name = data.getItemByClassName(e.itemAmount.item)?.name ?? e.itemAmount.item;
		portList(outPorts, e.from.id).push({id: String(e.id), name});
		portList(inPorts, e.to.id).push({id: String(e.id), name});
		edgeEnds.set(String(e.id), {source: e.from.id, target: e.to.id});
	}

	// Order ports up-front by the connected node's centre y from the elk layout — deterministic
	// (no dependency on when Vue Flow applies positions). A higher target -> higher output port.
	const centreY = (id: number) => (pos.get(id)?.y ?? 0) + nodeHeight(id) / 2;
	const centreX = (id: number) => (pos.get(id)?.x ?? 0) + 224 / 2;
	for (const list of outPorts.values()) {
		list.sort((a, b) => centreY(edgeEnds.get(a.id)!.target) - centreY(edgeEnds.get(b.id)!.target));
	}
	for (const list of inPorts.values()) {
		list.sort((a, b) => centreY(edgeEnds.get(a.id)!.source) - centreY(edgeEnds.get(b.id)!.source));
	}

	// Leaf nodes with a single port: face that port toward its one neighbour to shorten the edge.
	for (const n of graph.nodes) {
		const ins = inPorts.get(n.id) ?? [];
		const outs = outPorts.get(n.id) ?? [];
		if (ins.length + outs.length !== 1) continue;
		const port = ins[0] ?? outs[0];
		const ends = edgeEnds.get(port.id)!;
		const nb = ins.length ? ends.source : ends.target;
		port.side = sideToNeighbour(centreX(n.id), centreY(n.id), centreX(nb), centreY(nb));
	}

	nodes.value = graph.nodes.map((n) => ({
		id: String(n.id),
		type: 'factory',
		position: pos.get(n.id) ?? {x: 0, y: 0},
		data: {...viewModel(n), inputs: inPorts.get(n.id) ?? [], outputs: outPorts.get(n.id) ?? []},
	}));
	edges.value = graph.edges.map((e) => ({
		id: String(e.id),
		source: String(e.from.id),
		target: String(e.to.id),
		sourceHandle: String(e.id), // each edge attaches to its own dedicated port
		targetHandle: String(e.id),
		markerEnd: {type: MarkerType.ArrowClosed, color: '#5f7183', width: 18, height: 18},
		label: `${data.getItemByClassName(e.itemAmount.item)?.name ?? e.itemAmount.item}  ${Strings.formatNumber(e.itemAmount.amount)}/min`,
	}));
}

// Edge shape is a per-tab view pref, applied without rebuilding the graph.
const displayEdges = computed(() => edges.value.map((e) => ({...e, type: props.straight ? 'straight' : 'smoothstep'})));

// Order each node's ports by the vertical position of the node they connect to, so an
// edge to a higher node plugs into a higher port (fewer crossings). Reads live positions,
// so it also re-settles after a node is dragged.
function reorderPorts(): void {
	// Live node centres (x and y) from the current positions.
	const cx = new Map<number, number>();
	const cy = new Map<number, number>();
	for (const n of getNodes.value) {
		cx.set(Number(n.id), (n.position?.x ?? 0) + (n.dimensions?.width ?? 224) / 2);
		cy.set(Number(n.id), (n.position?.y ?? 0) + (n.dimensions?.height ?? 0) / 2);
	}
	// Multi-port nodes: order ports by the connected node's centre y (higher target -> higher port).
	const byConnected = (endpoint: 'source' | 'target') => (a: FactoryPort, b: FactoryPort) => {
		const ya = cy.get(edgeEnds.get(a.id)?.[endpoint] ?? -1) ?? 0;
		const yb = cy.get(edgeEnds.get(b.id)?.[endpoint] ?? -1) ?? 0;
		return ya - yb;
	};
	const changed: string[] = [];
	for (const n of getNodes.value) {
		const id = Number(n.id);
		const d = n.data as {inputs: FactoryPort[]; outputs: FactoryPort[]};
		if (!d) continue;
		if (d.inputs.length + d.outputs.length === 1) {
			// Single-port leaf: reface the one port toward its neighbour.
			const isInput = d.inputs.length === 1;
			const port = isInput ? d.inputs[0] : d.outputs[0];
			const ends = edgeEnds.get(port.id);
			if (!ends) continue;
			const nb = isInput ? ends.source : ends.target;
			const side = sideToNeighbour(cx.get(id) ?? 0, cy.get(id) ?? 0, cx.get(nb) ?? 0, cy.get(nb) ?? 0);
			if (port.side === side) continue;
			const refaced = [{...port, side}];
			updateNodeData(n.id, (isInput ? {inputs: refaced} : {outputs: refaced}) as any);
			changed.push(n.id);
		} else if (d.inputs.length >= 2 || d.outputs.length >= 2) {
			updateNodeData(n.id, {inputs: [...d.inputs].sort(byConnected('source')), outputs: [...d.outputs].sort(byConnected('target'))});
			changed.push(n.id);
		}
	}
	// Handles moved (new slot or side); Vue Flow caches handle bounds, so re-measure next tick
	// (after the handles re-render) or edges keep routing to the old positions.
	if (changed.length) nextTick(() => updateNodeInternals(changed));
}

// fit + order ports once nodes are measured — covers the initial layout and every re-solve.
onNodesInitialized(() => {
	fitView({padding: 0.2});
	reorderPorts();
});
onNodeDragStop(reorderPorts); // re-settle ports when the user repositions a node
onMounted(draw);
watch(() => props.result, draw); // re-draw when a new solve replaces the result
</script>

<template>
	<div class="visualization" :style="{height: height + 'px'}">
		<VueFlow
			:id="flowId"
			:nodes="nodes"
			:edges="displayEdges"
			:node-types="nodeTypes"
			:min-zoom="0.2"
			:max-zoom="2"
			:nodes-connectable="false"
		>
			<Background :gap="18" pattern-color="#2a313c" />
			<Controls :show-interactive="false" />
		</VueFlow>
	</div>
</template>

<style scoped>
.visualization {
	overflow: hidden;
}

.visualization :deep(.vue-flow) {
	height: 100%;
	background: var(--hud-surface-2, #10131a);
}

/* Edges: HUD slate hairline, orange on hover/selection. */
.visualization :deep(.vue-flow__edge-path) {
	stroke: #5f7183;
	stroke-width: 1.5;
}

.visualization :deep(.vue-flow__edge:hover .vue-flow__edge-path),
.visualization :deep(.vue-flow__edge.selected .vue-flow__edge-path) {
	stroke: var(--hud-orange, #f99549);
}

/* Edge labels: near-black chip + light mono, replacing Vue Flow's white pill. */
.visualization :deep(.vue-flow__edge-text) {
	fill: var(--hud-text, #e8eaed);
	font-family: var(--hud-font-mono, ui-monospace, monospace);
	font-size: 11px;
}

.visualization :deep(.vue-flow__edge-textbg) {
	fill: var(--hud-surface-2, #10131a);
	fill-opacity: 0.85;
}

/* Controls: dark HUD buttons instead of the default white stack. */
.visualization :deep(.vue-flow__controls) {
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	border-radius: 4px;
	overflow: hidden;
}

.visualization :deep(.vue-flow__controls-button) {
	width: 26px;
	height: 26px;
	background: var(--hud-surface, #191d24);
	border-bottom: 1px solid var(--hud-border, rgba(255, 255, 255, 0.1));
}

.visualization :deep(.vue-flow__controls-button:hover) {
	background: var(--hud-surface-2, #10131a);
}

.visualization :deep(.vue-flow__controls-button svg) {
	max-width: 12px;
	max-height: 12px;
	fill: var(--hud-text-dim, #8f99a6);
}

.visualization :deep(.vue-flow__controls-button:hover svg) {
	fill: var(--hud-orange, #f99549);
}
</style>
