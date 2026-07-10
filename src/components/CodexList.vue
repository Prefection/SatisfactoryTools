<script setup lang="ts">
import ItemIcon from '@src/components/ItemIcon.vue';

defineProps<{filtered: {slug: string; name: string}[]; routeName: string}>();
</script>

<template>
	<div class="list-group">
		<RouterLink v-for="e in filtered" :key="e.slug" class="list-group-item d-flex align-items-center"
		            :to="{name: routeName, params: {item: e.slug}}">
			<ItemIcon :item="(e as any)" :size="32" hide-tooltip />
			<span class="ml-2">{{ e.name }}</span>
		</RouterLink>
	</div>
</template>
