<script setup lang="ts">
import {Handle, Position} from '@vue-flow/core';

defineProps<{
	data: {
		label: string;
		color: string;
	};
}>();
</script>

<template>
	<div class="schematic-node" :style="{'--node-accent': data.color}">
		<Handle type="target" :position="Position.Left" class="schematic-node__port" />
		<!-- label is a trusted game-data string (`<b>name</b>\nTier: n`): bold name + tier line -->
		<div class="schematic-node__label" v-html="data.label"></div>
		<Handle type="source" :position="Position.Right" class="schematic-node__port" />
	</div>
</template>

<style scoped>
/* A label-only HUD readout tile for the schematic dependency tree — the same signature
   FactoryNode carries: near-black surface, the node's colour on the left accent bar and a
   single bracketed corner. Boldness spent only on the accent; the schematic name reads
   bright, its tier line dim, so hierarchy survives a dense tree. */
.schematic-node {
	--node-accent: var(--hud-orange, #f99549);
	position: relative;
	box-sizing: border-box;
	min-width: 168px;
	max-width: 240px;
	padding: 10px 14px;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.16)), var(--hud-surface, #191d24);
	border: 1px solid var(--hud-border, rgba(255, 255, 255, 0.1));
	border-left: 3px solid var(--node-accent);
	border-radius: 5px;
	color: var(--hud-text, #e8eaed);
	font-family: var(--hud-font-sans, system-ui, sans-serif);
	cursor: grab;
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.schematic-node:hover {
	border-color: var(--node-accent);
	box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}

/* Bracketed-corner signature, one tick, echoing .hud-panel. */
.schematic-node::before {
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

.schematic-node__label {
	font-size: 12px;
	line-height: 1.35;
	white-space: pre-line;
	color: var(--hud-text-dim, #8f99a6);
}

.schematic-node__label :deep(b) {
	font-size: 13px;
	font-weight: 600;
	color: var(--hud-text, #e8eaed);
}

.schematic-node__port {
	width: 8px;
	height: 8px;
	background: var(--hud-surface-2, #10131a);
	border: 1.5px solid var(--node-accent);
	border-radius: 2px;
}
</style>
