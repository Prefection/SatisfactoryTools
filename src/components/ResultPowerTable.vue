<script setup lang="ts">
import {ref} from 'vue';
import data from '@src/Data/Data';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';
import ItemIcon from '@src/components/ItemIcon.vue';

defineProps<{result: ProductionResult}>();

const expanded = ref(new Set<string>());
const toggle = (k: string) => { expanded.value.has(k) ? expanded.value.delete(k) : expanded.value.add(k); };

const buildingName = (cls: string) => data.getBuildingByClassName(cls)?.name ?? cls;
const recipeName = (cls: string) => data.getRecipeByClassName(cls)?.name ?? cls;
const recipeProducts = (cls: string) => data.getRecipeByClassName(cls)?.products ?? [];
</script>

<template>
	<table class="hud-table">
		<thead>
			<tr>
				<th class="table-cell-micro"></th>
				<th>Machine</th>
				<th class="table-cell-adjust-size">Power usage</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			<template v-for="(machineData, machine) in result.details.power.byBuilding" :key="machine">
				<tr class="cursor-pointer" @click="toggle(String(machine))">
					<td>
						<span :class="expanded.has(String(machine)) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></span>
					</td>
					<td class="text-right table-cell-adjust-size">
						<span class="mr-1 hud-mono">{{ machineData.amount }}x</span>
						<ItemIcon :item="String(machine)" :size="24" /> {{ buildingName(String(machine)) }}
					</td>
					<td class="text-right table-cell-adjust-size hud-mono">{{ machineData.power.average }} MW</td>
					<td class="text-left">
						<span class="text-muted">
							<span v-if="machineData.power.isVariable" class="hud-mono">(up to {{ machineData.power.max }} MW)</span>&nbsp;
						</span>
						<table v-if="expanded.has(String(machine))" class="hud-table hud-table--nested mt-2">
							<tbody>
								<tr v-for="(recipeData, recipe) in machineData.recipes" :key="recipe">
									<td class="text-right table-cell-adjust-size">
										<span class="mr-1 hud-mono">{{ recipeData.amount }}x</span> <ItemIcon :item="String(machine)" :size="24" />
									</td>
									<td class="text-right table-cell-adjust-size hud-mono">{{ recipeData.power.average }} MW</td>
									<td class="text-left table-cell-adjust-size">
										<span v-if="recipeData.power.isVariable" class="text-muted hud-mono">(up to {{ recipeData.power.max }} MW)</span>
									</td>
									<td class="text-right table-cell-adjust-size">
										<span v-for="product in recipeProducts(String(recipe))" :key="product.item"><ItemIcon :item="product.item" :size="24" /></span>
									</td>
									<td class="text-left table-cell-adjust-size">{{ recipeName(String(recipe)) }}</td>
									<td></td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</template>
		</tbody>
		<tfoot class="table-secondary">
			<tr>
				<td></td>
				<td class="text-left table-cell-adjust-size"><b>Total:</b></td>
				<td class="text-right table-cell-adjust-size"><b class="hud-value">{{ result.details.power.total.average }} MW</b></td>
				<td class="text-left">
					<span v-if="result.details.power.total.isVariable" class="text-muted hud-mono">(up to {{ result.details.power.total.max }} MW)</span>
				</td>
			</tr>
		</tfoot>
	</table>
</template>
