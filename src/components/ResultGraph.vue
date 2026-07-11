<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {Network, type Edge, type Node} from 'vis-network';
import {layoutGraph} from '@src/utils/networkLayout';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';

const props = defineProps<{result: ProductionResult}>();
const container = ref<HTMLElement>();
let network: Network | undefined;

async function draw(): Promise<void> {
	const graph = props.result.graph;
	// elk layout on a flat {id,label} view; getVisNode() supplies the real styling.
	const laid = await layoutGraph(graph.nodes.map((n) => ({id: n.id, label: n.getTitle()})), []);
	const pos = new Map(laid.map((n) => [n.id, {x: n.x, y: n.y}]));
	const nodes: Node[] = graph.nodes.map((n) => {
		const v = n.getVisNode();
		return {...v, x: pos.get(n.id)?.x, y: pos.get(n.id)?.y} as unknown as Node;
	});
	const edges: Edge[] = graph.edges.map((e) => ({
		id: e.id, from: e.from.id, to: e.to.id,
		label: `${e.itemAmount.amount} / min`,
		// curve apart when a reverse edge also exists (bidirectional pair)
		smooth: e.to.hasOutputTo(e.from) ? {enabled: true, type: 'curvedCW', roundness: 0.2} : false,
	} as unknown as Edge));

	network?.destroy();
	if (!container.value) return;
	network = new Network(container.value, {nodes, edges}, {
		edges: {arrows: 'to', color: '#697d91', font: {size: 14, multi: 'html', color: '#eeeeee'}},
		nodes: {shape: 'box', font: {size: 14, multi: 'html', color: '#eeeeee'}, margin: {top: 10, left: 10, right: 10, bottom: 10}},
		physics: false,
		layout: {hierarchical: false},
	});
}

onMounted(draw);
watch(() => props.result, draw); // re-draw when a new solve replaces the result
onBeforeUnmount(() => network?.destroy());
</script>

<template>
	<div ref="container" class="visualization"></div>
</template>
