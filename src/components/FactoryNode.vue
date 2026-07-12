<script setup lang="ts">
import {Handle, Position} from '@vue-flow/core';
import ItemIcon from '@src/components/ItemIcon.vue';

interface FactoryPort {
	id: string;
	name: string;
}

defineProps<{
	data: {
		kind: string;
		icon: string;
		title: string;
		machine?: string;
		machineIcon?: string;
		machineCount?: number;
		rate?: string;
		accent: string;
		inputs: FactoryPort[];
		outputs: FactoryPort[];
	};
}>();

// Spread N ports evenly along a node edge: 1 -> 50%, 2 -> 33%/66%, etc.
function portTop(index: number, count: number): string {
	return `${((index + 1) / (count + 1)) * 100}%`;
}
</script>

<template>
	<div class="factory-node" :data-kind="data.kind" :style="{'--node-accent': data.accent}">
		<Handle
			v-for="(port, i) in data.inputs" :key="'in-' + port.id"
			type="target" :id="port.id" :position="Position.Left"
			:style="{top: portTop(i, data.inputs.length)}" :title="port.name"
			class="factory-node__port"
		/>

		<div class="factory-node__head">
			<ItemIcon class="factory-node__icon" :item="data.icon" :size="26" hide-tooltip />
			<span class="factory-node__title">{{ data.title }}</span>
		</div>

		<div v-if="data.machine" class="factory-node__machine">
			<ItemIcon v-if="data.machineIcon" :item="data.machineIcon" :size="16" hide-tooltip />
			<span class="factory-node__count">{{ data.machineCount }}×</span>
			<span class="factory-node__machine-name">{{ data.machine }}</span>
		</div>

		<div v-if="data.rate" class="factory-node__rate">{{ data.rate }}</div>

		<Handle
			v-for="(port, i) in data.outputs" :key="'out-' + port.id"
			type="source" :id="port.id" :position="Position.Right"
			:style="{top: portTop(i, data.outputs.length)}" :title="port.name"
			class="factory-node__port"
		/>
	</div>
</template>

<style scoped>
/* A HUD readout tile: near-black surface, the node's type colour carried by the
   left accent bar + a single bracketed corner (echoing the .hud-panel signature),
   sans title, cyan mono data. Boldness spent only on the accent — the rest stays quiet. */
.factory-node {
	--node-accent: var(--hud-orange, #f99549);
	position: relative;
	box-sizing: border-box;
	min-width: 172px;
	max-width: 224px;
	padding: 9px 12px 10px 14px;
	background-color: var(--hud-surface, #191d24);
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.16)), var(--hud-surface, #191d24);
	border: 1px solid var(--hud-border, rgba(255, 255, 255, 0.1));
	border-left: 3px solid var(--node-accent);
	border-radius: 5px;
	color: var(--hud-text, #e8eaed);
	font-family: var(--hud-font-sans, system-ui, sans-serif);
	cursor: grab;
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.factory-node:hover {
	border-color: var(--node-accent);
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}

/* Bracketed-corner signature, scaled to a single tick so a dense chain stays calm. */
.factory-node::before {
	content: '';
	position: absolute;
	top: -1px;
	left: 2px;
	width: 8px;
	height: 8px;
	border-top: 2px solid var(--node-accent);
	border-left: 2px solid var(--node-accent);
	pointer-events: none;
}

.factory-node__head {
	display: flex;
	align-items: center;
	gap: 8px;
}

.factory-node__icon {
	flex: 0 0 auto;
}

.factory-node__title {
	min-width: 0;
	font-size: 13px;
	font-weight: 600;
	line-height: 1.25;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

.factory-node__machine {
	display: flex;
	align-items: center;
	gap: 5px;
	margin-top: 7px;
	font-size: 11px;
	color: var(--hud-text-dim, #8f99a6);
}

.factory-node__count {
	font-family: var(--hud-font-mono, ui-monospace, monospace);
	font-variant-numeric: tabular-nums;
	font-weight: 600;
	color: var(--hud-cyan, #37c6d0);
}

.factory-node__machine-name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.factory-node__rate {
	margin-top: 7px;
	font-family: var(--hud-font-mono, ui-monospace, monospace);
	font-variant-numeric: tabular-nums;
	font-size: 13px;
	font-weight: 600;
	color: var(--hud-cyan, #37c6d0);
}

.factory-node__port {
	width: 8px;
	height: 8px;
	background: var(--hud-surface-2, #10131a);
	border: 1.5px solid var(--node-accent);
	border-radius: 2px;
}
</style>
