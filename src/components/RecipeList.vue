<script setup lang="ts">
import {computed, ref} from 'vue';
import data from '@src/Data/Data';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import {toggleInArray} from '@src/utils/toggleInArray';
import ItemIcon from '@src/components/ItemIcon.vue';

const props = defineProps<{mode: 'alternate' | 'base'}>();

const {data: tabData} = useActiveTab();
const {version} = useGameData();

const query = ref('');
const collapsed = ref(false);

const title = computed(() => (props.mode === 'alternate' ? 'Alternate recipes' : 'Base recipes'));

// Recipe list for this mode, name-sorted; re-resolve on version switch (same pattern as ProductionForm).
const recipes = computed(() => {
	void version.value;
	return (props.mode === 'alternate' ? data.getAlternateRecipes() : data.getBaseItemRecipes())
		.slice().sort((a, b) => a.name.localeCompare(b.name));
});

function targetArray(): string[] {
	return props.mode === 'alternate' ? tabData.request.allowedAlternateRecipes : tabData.request.blockedRecipes;
}

// alternate = opt-in (must be present in allowedAlternateRecipes); base = opt-out (enabled unless blocked)
function isEnabled(className: string): boolean {
	return props.mode === 'alternate'
		? tabData.request.allowedAlternateRecipes.includes(className)
		: !tabData.request.blockedRecipes.includes(className);
}

function toggle(className: string): void {
	toggleInArray(targetArray(), className);
}

const filtered = computed(() => recipes.value.filter((r) => r.name.toLowerCase().includes(query.value.toLowerCase())));

function setAll(enabled: boolean): void {
	for (const r of recipes.value) if (isEnabled(r.className) !== enabled) toggle(r.className);
}
</script>

<template>
	<div class="hud-panel">
		<div class="hud-section-header">
			<span class="hud-section-header__title">{{ title }}</span>
			<span class="hud-section-header__help">Choose which recipes the planner may use.</span>
			<span class="hud-section-header__actions">
				<input type="text" v-model="query" class="form-control" placeholder="Search for a recipe">
				<span class="btn-group">
					<span class="btn btn-secondary px-3" @click="setAll(true)">All</span>
					<span class="btn btn-secondary px-3" @click="setAll(false)">None</span>
					<span class="btn btn-secondary" @click="collapsed = !collapsed">
						<span class="fas fa-fw" :class="collapsed ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
					</span>
				</span>
			</span>
		</div>

		<div v-show="!collapsed">
			<table class="alternate-recipe-list">
				<tr v-for="recipe in filtered" :key="recipe.className" @click="toggle(recipe.className)" :class="{disabled: !isEnabled(recipe.className)}">
					<td>
						<span class="fas" :class="isEnabled(recipe.className) ? 'fa-check-square' : 'fa-square'"></span>
					</td>
					<td class="d-flex justify-content-between">
						<span>
							<ItemIcon :item="recipe.products[0].item" :size="20" />
							{{ recipe.name }}
						</span>
						<span>
							<span v-for="ingredient in recipe.ingredients" :key="ingredient.item" class="recipe-item">
								{{ ingredient.amount }}&times;
								<ItemIcon :item="ingredient.item" :size="20" />
							</span>
						</span>
					</td>
					<td>
						<span class="fas fa-fw fa-chevron-right"></span>
						<span v-for="product in recipe.products" :key="product.item" class="recipe-item">
							{{ product.amount }}&times;
							<ItemIcon :item="product.item" :size="20" />
						</span>
					</td>
				</tr>
			</table>
		</div>
	</div>
</template>
