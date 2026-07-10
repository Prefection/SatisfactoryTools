<script setup lang="ts">
defineProps<{title?: string; item?: string}>();
</script>

<template>
	<div class="py-4">
		<h2>{{ title ?? 'Detail' }}<span v-if="item"> — {{ item }}</span></h2>
		<p class="text-secondary">Coming in a later phase.</p>
	</div>
</template>
