<script setup lang="ts">
import {computed} from 'vue';
import data from '@src/Data/Data';
import {useGameData} from '@src/composables/useGameData';
import type {IItemSchema} from '@src/Schema/IItemSchema';
import type {IBuildingSchema} from '@src/Schema/IBuildingSchema';
import type {ISchematicSchema} from '@src/Schema/ISchematicSchema';

type Entity = IItemSchema | IBuildingSchema | ISchematicSchema;

const props = withDefaults(defineProps<{
	item: Entity | string;
	size?: number;
	hideTooltip?: boolean;
}>(), {size: 32, hideTooltip: false});

const {version} = useGameData();

const entity = computed<Entity | null>(() => {
	void version.value; // re-resolve when the game version changes
	if (typeof props.item === 'object') {
		return props.item;
	}
	return data.getItemByClassName(props.item)
		?? data.getBuildingByClassName(props.item)
		?? data.getSchematicByClassName(props.item)
		?? null;
});

const imageSize = computed(() => (props.size > 64 ? 256 : 64));
// icon/slug live on the concrete schema types; the union is loose here as in the original directive
const src = computed(() => {
	const e = entity.value as unknown as {icon?: string; slug?: string} | null;
	return e ? `/assets/images/items/${e.icon || e.slug}_${imageSize.value}.png` : '';
});
const label = computed(() => (entity.value as unknown as {name?: string} | null)?.name ?? null);
const missing = computed(() => (typeof props.item === 'string' ? props.item : (props.item as {className?: string})?.className));
</script>

<template>
	<img v-if="entity" :src="src" :width="size" :height="size" loading="lazy"
	     :alt="label ?? ''" :title="hideTooltip ? undefined : (label ?? undefined)" />
	<span v-else class="fas fa-question" :title="missing"></span>
</template>
