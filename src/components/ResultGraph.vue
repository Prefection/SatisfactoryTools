<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {Network, type Edge, type Node} from 'vis-network';
import {layoutGraph} from '@src/utils/networkLayout';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';
import data from '@src/Data/Data';
import {Strings} from '@src/Utils/Strings';

const props = defineProps<{result: ProductionResult}>();
const container = ref<HTMLElement>();
const height = ref(460);
let network: Network | undefined;

// elk lays nodes out on a 100px-tall grid; size the frame to the chain instead of
// a fixed 800px so small graphs don't leave a black void and big ones still scroll.
const NODE_H = 100, H_MIN = 440, H_MAX = 820;

async function draw(): Promise<void> {
	const graph = props.result.graph;
	// elk layout on a flat {id,label} view; getVisNode() supplies the real styling.
	const laid = await layoutGraph(
		graph.nodes.map((n) => ({id: n.id, label: n.getTitle()})),
		graph.edges.map((e) => ({from: e.from.id, to: e.to.id})),
	);
	const pos = new Map(laid.map((n) => [n.id, {x: n.x, y: n.y}]));
	const ys = laid.map((n) => n.y ?? 0);
	height.value = ys.length
		? Math.min(Math.max(Math.max(...ys) - Math.min(...ys) + NODE_H + 48, H_MIN), H_MAX)
		: H_MIN;
	const nodes: Node[] = graph.nodes.map((n) => {
		const v = n.getVisNode();
		return {...v, x: pos.get(n.id)?.x, y: pos.get(n.id)?.y} as unknown as Node;
	});
	const edges: Edge[] = graph.edges.map((e) => ({
		id: e.id, from: e.from.id, to: e.to.id,
		label: `${data.getItemByClassName(e.itemAmount.item)?.name ?? e.itemAmount.item}\n${Strings.formatNumber(e.itemAmount.amount)} / min`,
		// curve apart when a reverse edge also exists (bidirectional pair)
		smooth: e.to.hasOutputTo(e.from) ? {enabled: true, type: 'curvedCW', roundness: 0.2} : false,
	} as unknown as Edge));

	network?.destroy();
	// let the container adopt the new height before vis-network measures it
	await nextTick();
	if (!container.value) return;
	network = new Network(container.value, {nodes, edges}, {
		edges: {
			arrows: 'to',
			width: 1.5,
			color: {color: '#5f7183', highlight: '#f99549', hover: '#f99549'},
			font: {size: 13, multi: 'html', color: '#e8eaed', strokeWidth: 0, background: '#10131a'},
		},
		nodes: {
			shape: 'box',
			borderWidth: 1,
			font: {size: 14, multi: 'html', color: '#eeeeee', face: 'system-ui, sans-serif'},
			margin: {top: 10, left: 12, right: 12, bottom: 10},
			shapeProperties: {borderRadius: 4},
		},
		interaction: {hover: true, tooltipDelay: 150},
		physics: false,
		layout: {hierarchical: false},
	});
}

onMounted(draw);
watch(() => props.result, draw); // re-draw when a new solve replaces the result
onBeforeUnmount(() => network?.destroy());
</script>

<template>
	<div ref="container" class="visualization" :style="{height: height + 'px'}"></div>
</template>
