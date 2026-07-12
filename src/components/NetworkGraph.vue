<script setup lang="ts">
import {markRaw, onMounted, ref} from 'vue';
import {MarkerType, useVueFlow, VueFlow} from '@vue-flow/core';
import {Background} from '@vue-flow/background';
import {Controls} from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/controls/dist/style.css';
import {layoutGraph, type GraphEdge, type GraphNode} from '@src/utils/networkLayout';
import SchematicNode from '@src/components/SchematicNode.vue';

const props = defineProps<{nodes: GraphNode[]; edges: GraphEdge[]}>();
const emit = defineEmits<{navigate: [slug: string]}>();

// Vue Flow's Node/Edge generics instantiate too deeply for these object literals
// (TS2589), so the flow arrays stay loose; the GraphNode/GraphEdge props above are typed.
const vnodes = ref<any[]>([]);
const vedges = ref<any[]>([]);
const slugById = new Map<number, string>();
const nodeTypes: Record<string, any> = {schematic: markRaw(SchematicNode)};

// A unique id isolates this flow's store so the per-route remount (:key in SchematicView)
// can't inherit stale nodes or a duplicate init handler.
const flowId = `schematic-graph-${Math.random().toString(36).slice(2)}`;
const {fitView, onNodesInitialized} = useVueFlow(flowId);

onMounted(async () => {
	const laid = await layoutGraph(props.nodes, props.edges);
	slugById.clear();
	vnodes.value = laid.map((n) => {
		if (n.slug) {
			slugById.set(n.id, n.slug);
		}
		return {
			id: String(n.id),
			type: 'schematic',
			position: {x: n.x ?? 0, y: n.y ?? 0},
			data: {label: n.label, color: n.color ?? '#df691a'},
		};
	});
	vedges.value = props.edges.map((e, i) => ({
		id: `e${i}`,
		source: String(e.from),
		target: String(e.to),
		type: 'smoothstep',
		markerEnd: {type: MarkerType.ArrowClosed, color: '#5f7183', width: 18, height: 18},
	}));
});

// Custom nodes must be measured before the first fit — same reason ResultGraph waits.
onNodesInitialized(() => fitView({padding: 0.2}));

function onNodeDoubleClick(e: any): void {
	const slug = slugById.get(Number(e.node.id));
	if (slug) {
		emit('navigate', slug);
	}
}
</script>

<template>
	<div class="visualization">
		<VueFlow
			:id="flowId"
			:nodes="vnodes"
			:edges="vedges"
			:node-types="nodeTypes"
			:min-zoom="0.2"
			:max-zoom="2"
			:nodes-connectable="false"
			@node-double-click="onNodeDoubleClick"
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
