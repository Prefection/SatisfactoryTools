<script setup lang="ts">
import ItemIcon from '@src/components/ItemIcon.vue';
import data from '@src/Data/Data';
import {Formula} from '@src/Formula';
import {Numbers} from '@src/Utils/Numbers';
import {Strings} from '@src/Utils/Strings';
import type {IRecipeSchema, IRecipeVariablePowerSchema} from '@src/Schema/IRecipeSchema';
import type {IManufacturerSchema} from '@src/Schema/IBuildingSchema';

defineProps<{recipes: IRecipeSchema[]}>();

// overclock is fixed at 100% here (no per-row overclock slider in the codex)
const OVERCLOCK = 100;

function workshop() {
	return data.getBuildingByClassName('Desc_Workshop_C');
}

function workbench() {
	return data.getBuildingByClassName('Desc_WorkBench_C');
}

function machine(recipe: IRecipeSchema): IManufacturerSchema | null {
	return data.getManufacturerByClassName(recipe.producedIn[0]);
}

function itemFor(className: string) {
	return data.getItemByClassName(className);
}

function rate(recipe: IRecipeSchema, amount: number): string {
	const m = machine(recipe);
	return m ? Strings.formatNumber(Formula.calculateProductAmountsPerMinute(m, recipe, amount, OVERCLOCK)) : '';
}

function cycleTime(recipe: IRecipeSchema): number {
	const m = machine(recipe);
	return m ? Formula.calculateBuildingRecipeProductionTime(recipe, m, OVERCLOCK) : 0;
}

function baseTime(recipe: IRecipeSchema): string {
	return Strings.formatNumber(recipe.time / OVERCLOCK * 100);
}

function cyclesPerMinute(recipe: IRecipeSchema): string {
	const time = cycleTime(recipe);
	return time ? Strings.formatNumber(60 / time) : '';
}

function minPower(recipe: IRecipeSchema): string {
	if (!recipe.isVariablePower) {
		return '';
	}
	const variable = recipe as IRecipeVariablePowerSchema;
	const exponent = machine(recipe)?.metadata.powerConsumptionExponent || 1.3;
	return Strings.formatNumber(Numbers.round(variable.minPower * Math.pow(OVERCLOCK / 100, 1 / exponent)));
}

function maxPower(recipe: IRecipeSchema): string {
	if (!recipe.isVariablePower) {
		return '';
	}
	const variable = recipe as IRecipeVariablePowerSchema;
	const exponent = machine(recipe)?.metadata.powerConsumptionExponent || 1.3;
	return Strings.formatNumber(Numbers.round(variable.maxPower * Math.pow(OVERCLOCK / 100, 1 / exponent)));
}
</script>

<template>
	<div class="table-responsive">
		<table class="table recipe-table table-hover">
			<thead>
				<tr>
					<th>Recipe name</th>
					<th>Ingredients</th>
					<th>Products</th>
					<th>Machine</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="recipe in recipes" :key="recipe.className">
					<td>
						{{ recipe.name }}
					</td>
					<td>
						<div v-for="ingredient in recipe.ingredients" :key="ingredient.item" class="d-inline-block p-2">
							<span class="item-amount">
								{{ ingredient.amount }}x
								<RouterLink v-if="itemFor(ingredient.item)" :to="{name: 'item', params: {item: itemFor(ingredient.item)!.slug}}">
									<ItemIcon :item="ingredient.item" />
								</RouterLink>
								<br>
							</span>
							<span v-if="recipe.inMachine">{{ rate(recipe, ingredient.amount) }}&nbsp;/&nbsp;min</span>
						</div>
					</td>
					<td>
						<div v-for="product in recipe.products" :key="product.item" class="d-inline-block p-2 font-weight-bold">
							<span class="item-amount">
								{{ product.amount }}x
								<RouterLink v-if="itemFor(product.item)" :to="{name: 'item', params: {item: itemFor(product.item)!.slug}}">
									<ItemIcon :item="product.item" />
								</RouterLink>
								<br>
							</span>
							<span v-if="recipe.inMachine">{{ rate(recipe, product.amount) }}&nbsp;/&nbsp;min</span>
						</div>
					</td>
					<td>
						<span class="item-amount" v-if="recipe.inMachine && machine(recipe)">
							<RouterLink :to="{name: 'building', params: {item: machine(recipe)!.slug}}">
								<ItemIcon :item="machine(recipe)!" :size="32" />
							</RouterLink>
						</span>
						<span class="item-amount" v-if="recipe.inWorkshop && workshop()">
							<RouterLink :to="{name: 'building', params: {item: workshop()!.slug}}">
								<ItemIcon :item="workshop()!" :size="32" />
							</RouterLink>
						</span>
						<span class="item-amount" v-if="!recipe.inWorkshop && recipe.inHand && workbench()">
							<RouterLink :to="{name: 'building', params: {item: workbench()!.slug}}">
								<ItemIcon :item="workbench()!" :size="32" />
							</RouterLink>
						</span>
						<br>
						<span v-if="recipe.inMachine">
							{{ baseTime(recipe) }}s ({{ cyclesPerMinute(recipe) }} cycles&nbsp;/&nbsp;min)
						</span>
						<span v-if="recipe.inMachine && recipe.isVariablePower" class="text-muted"><br>
							{{ minPower(recipe) }} - {{ maxPower(recipe) }} MW
						</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
