<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {Network, type Edge, type Node} from 'vis-network';
import {layoutGraph, type GraphEdge, type GraphNode} from '@src/utils/networkLayout';

const props = defineProps<{nodes: GraphNode[]; edges: GraphEdge[]}>();
const emit = defineEmits<{navigate: [slug: string]}>();

const container = ref<HTMLElement>();
let network: Network | undefined;

onMounted(async () => {
	const laidOut = await layoutGraph(props.nodes, props.edges);
	const nodes: Node[] = laidOut.map((n) => ({id: n.id, label: n.label, x: n.x, y: n.y, color: n.color}));
	const edges: Edge[] = props.edges.map((e) => ({from: e.from, to: e.to}));

	if (!container.value) {
		return;
	}

	network = new Network(container.value, {nodes, edges}, {
		edges: {
			labelHighlightBold: false,
			color: '#697d91',
			font: {
				size: 14,
				multi: 'html',
				color: '#eeeeee',
				strokeColor: 'rgba(0, 0, 0, 0.2)',
			},
			arrows: 'to',
			smooth: false,
		},
		nodes: {
			labelHighlightBold: false,
			font: {
				size: 14,
				multi: 'html',
				color: '#eeeeee',
			},
			color: {
				background: '#df691a',
				border: 'rgba(0,0,0,0)',
				highlight: {
					background: '#e77a31',
					border: '#eeeeee',
				},
			},
			margin: {
				top: 10,
				left: 10,
				right: 10,
				bottom: 10,
			},
			shape: 'box',
		},
		physics: false,
		layout: {
			hierarchical: false,
		},
	});

	network.on('doubleClick', (p) => {
		const n = props.nodes.find((x) => x.id === p.nodes[0]);
		if (n?.slug) {
			emit('navigate', n.slug);
		}
	});
});

onBeforeUnmount(() => {
	network?.destroy();
});
</script>

<template>
	<div ref="container" class="visualization"></div>
</template>
