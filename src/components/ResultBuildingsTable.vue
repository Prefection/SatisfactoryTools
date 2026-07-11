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
	<table class="table table-hover">
		<thead>
			<tr>
				<th class="table-cell-micro"></th>
				<th class="text-right">Building</th>
				<th class="text-left">Building cost</th>
			</tr>
		</thead>
		<tbody>
			<template v-for="(buildingData, building) in result.details.buildings.buildings" :key="building">
				<tr class="cursor-pointer" @click="toggle(String(building))">
					<td>
						<span :class="expanded.has(String(building)) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></span>
					</td>
					<td class="text-right table-cell-adjust-size">
						<span class="mr-1">{{ buildingData.amount }}x</span>
						<ItemIcon :item="String(building)" :size="24" /> {{ buildingName(String(building)) }}
					</td>
					<td class="text-left">
						<span v-for="(amount, item) in buildingData.resources" :key="item" class="mx-2">
							<span class="mr-1">{{ amount }}x</span>
							<ItemIcon :item="String(item)" :size="24" />
						</span>

						<table v-if="expanded.has(String(building))" class="table table-hover mt-2">
							<tbody>
								<tr v-for="(recipeData, recipe) in buildingData.recipes" :key="recipe">
									<td class="text-right table-cell-adjust-size">
										<span class="mr-1">{{ recipeData.amount }}x</span> <ItemIcon :item="String(building)" :size="24" />
									</td>
									<td class="text-right table-cell-adjust-size">
										<span v-for="product in recipeProducts(String(recipe))" :key="product.item"><ItemIcon :item="product.item" :size="24" /></span>
									</td>
									<td class="text-left table-cell-adjust-size">{{ recipeName(String(recipe)) }}</td>
									<td v-for="(amount, item) in recipeData.resources" :key="item" class="text-right table-cell-adjust-size">
										<span class="mr-1">{{ amount }}x</span>
										<ItemIcon :item="String(item)" :size="24" />
									</td>
									<td></td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</template>
		</tbody>
		<tfoot>
			<tr class="table-secondary">
				<td></td>
				<td class="text-right"><b>Total cost:</b></td>
				<td class="text-left">
					<span v-for="(amount, item) in result.details.buildings.resources" :key="item" class="mx-2">
						<span class="mr-1">{{ amount }}x</span>&nbsp;<ItemIcon :item="String(item)" :size="24" />
					</span>
				</td>
			</tr>
		</tfoot>
	</table>
</template>
