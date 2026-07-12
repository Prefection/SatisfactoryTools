<script setup lang="ts">
import {markRaw, onMounted, ref, watch} from 'vue';
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

interface FactoryPort {
	id: string;   // item className — the handle id edges connect to
	name: string; // item display name (title/tooltip)
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

const props = defineProps<{result: ProductionResult}>();

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
const {fitView, onNodesInitialized, onNodeDragStop, getNodes, updateNodeData} = useVueFlow(flowId);

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
		type: 'smoothstep',
		markerEnd: {type: MarkerType.ArrowClosed, color: '#5f7183', width: 18, height: 18},
		label: `${data.getItemByClassName(e.itemAmount.item)?.name ?? e.itemAmount.item}  ${Strings.formatNumber(e.itemAmount.amount)}/min`,
	}));
}

// Order each node's ports by the vertical position of the node they connect to, so an
// edge to a higher node plugs into a higher port (fewer crossings). Reads live positions,
// so it also re-settles after a node is dragged.
function reorderPorts(): void {
	// Order by each node's CENTRE y (top + half height), so mixed-height nodes sort by where
	// their body actually sits, not their top edge.
	const y = new Map<number, number>();
	for (const n of getNodes.value) y.set(Number(n.id), (n.position?.y ?? 0) + (n.dimensions?.height ?? 0) / 2);
	const byConnected = (endpoint: 'source' | 'target') => (a: FactoryPort, b: FactoryPort) => {
		const ya = y.get(edgeEnds.get(a.id)?.[endpoint] ?? -1) ?? 0;
		const yb = y.get(edgeEnds.get(b.id)?.[endpoint] ?? -1) ?? 0;
		return ya - yb;
	};
	for (const n of getNodes.value) {
		const d = n.data as {inputs: FactoryPort[]; outputs: FactoryPort[]};
		if (!d || (d.inputs.length < 2 && d.outputs.length < 2)) continue;
		updateNodeData(n.id, {
			inputs: [...d.inputs].sort(byConnected('source')), // ordered by the source node's height
			outputs: [...d.outputs].sort(byConnected('target')), // ordered by the target node's height
		});
	}
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
			:edges="edges"
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
