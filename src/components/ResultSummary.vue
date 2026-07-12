<script setup lang="ts">
import {computed} from 'vue';
import data from '@src/Data/Data';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';
import ItemIcon from '@src/components/ItemIcon.vue';

const props = defineProps<{result: ProductionResult}>();

const round = (n: number) => Math.round(n * 100) / 100;
const itemName = (cls: string) => data.getItemByClassName(cls)?.name ?? cls;

const products = computed(() =>
	Object.entries(props.result.details.output).map(([item, rate]) => ({item, rate})),
);
const power = computed(() => props.result.details.power.total);
const rawInputs = computed(() =>
	Object.values(props.result.details.rawResources).filter((r) => r.used > 0).length,
);
</script>

<template>
	<aside class="hud-panel hud-panel--cyan hud-summary">
		<span class="hud-label">At a glance</span>

		<p class="hud-lead" v-if="products.length">You'll produce:</p>
		<p class="hud-lead" v-else>Nothing yet — pick an item to produce.</p>

		<div class="hud-summary__products">
			<div v-for="p in products" :key="p.item" class="hud-product-line">
				<ItemIcon :item="p.item" :size="24" hide-tooltip />
				<span class="hud-product-line__name">{{ itemName(p.item) }}</span>
				<span class="hud-product-line__rate">{{ round(p.rate) }} /min</span>
			</div>
		</div>

		<div class="hud-stat">
			<div class="hud-stat-card hud-stat-card--orange">
				<span class="hud-stat-card__value">{{ result.details.buildings.amount }}</span>
				<span class="hud-stat-card__label">Buildings</span>
			</div>
			<div class="hud-stat-card hud-stat-card--cyan">
				<span class="hud-stat-card__value">
					{{ round(power.average) }}<span class="hud-stat-card__unit"> MW</span>
				</span>
				<span class="hud-stat-card__label">
					Power<template v-if="power.isVariable"> · up to {{ round(power.max) }}</template>
				</span>
			</div>
			<div class="hud-stat-card">
				<span class="hud-stat-card__value">{{ rawInputs }}</span>
				<span class="hud-stat-card__label">Raw inputs</span>
			</div>
			<div class="hud-stat-card">
				<span class="hud-stat-card__value">{{ result.details.alternatesNeeded.length }}</span>
				<span class="hud-stat-card__label">Alt recipes used</span>
			</div>
		</div>
	</aside>
</template>

<style scoped>
.hud-summary__products {
	margin-bottom: 14px;
}
</style>
