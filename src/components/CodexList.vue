<script setup lang="ts">
import {RouterLink} from 'vue-router';
import {Strings} from '@src/Utils/Strings';

// Loosely typed like the original codex component — serves items, buildings, and schematics.
defineProps<{filtered: any[]; routeName: string}>();
</script>

<template>
	<div class="recipe-list">
		<div v-for="e in filtered" :key="e.slug" class="card text-center item-card">
			<RouterLink class="recipe-name stretched-link" :class="{'pt-2': e.requiredSchematics}"
			            :to="{name: routeName, params: {item: e.slug}}">
				<img class="recipe-image" :src="`/assets/images/items/${e.icon || e.slug}_64.png`" loading="lazy" alt="" />
				{{ e.name }}
				<small v-if="e.requiredSchematics" class="text-muted d-block">{{ Strings.convertSchematicType(e.type) }}</small>
			</RouterLink>
		</div>
	</div>
</template>
