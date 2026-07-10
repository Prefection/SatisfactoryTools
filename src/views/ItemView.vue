<script setup lang="ts">
import {computed, watchEffect} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import data from '@src/Data/Data';
import {useGameData} from '@src/composables/useGameData';
import ItemIcon from '@src/components/ItemIcon.vue';
import RecipesTable from '@src/components/RecipesTable.vue';

const route = useRoute();
const router = useRouter();
const {version} = useGameData();

const item = computed(() => {
	void version.value; // re-resolve on version switch
	return data.getItemBySlug(route.params.item as string);
});

watchEffect(() => {
	if (!item.value) {
		router.replace({name: 'items'});
	}
});

const recipes = computed(() => item.value ? Object.values(data.getRecipesForItem(item.value)) : []);
const usagesAsIngredient = computed(() => item.value ? Object.values(data.getUsagesAsIngredientForItem(item.value)) : []);
const usagesForBuilding = computed(() => item.value ? Object.values(data.getUsagesForBuildingForItem(item.value)) : []);
const usagesForSchematics = computed(() => item.value ? Object.values(data.getUsagesForSchematicsForItem(item.value)) : []);

function getBuilding(className: string) {
	return data.getBuildingByClassName(className);
}

function getItem(className: string) {
	return data.getItemByClassName(className);
}
</script>

<template>
	<template v-if="item">
		<RouterLink :to="{name: 'items'}">&larr; Back to items</RouterLink>

		<div class="row">
			<div class="col-md-6">
				<div class="card mb-3">
					<h2 class="card-header">{{ item.name }}</h2>
					<div class="card-body">
						<span class="float-left mr-3">
							<ItemIcon :item="item" :size="128" />
						</span>
						<p style="white-space: pre-line;">{{ item.description }}</p>
					</div>
				</div>
			</div>

			<div class="col-md-6">
				<div class="card mb-3">
					<h2 class="card-header">{{ item.name }} details</h2>
					<div class="card-body">
						<table class="table">
							<tbody>
								<tr>
									<td>Sink points</td>
									<td>{{ item.sinkPoints ? item.sinkPoints : 'Can\'t be put into the sink.' }}</td>
								</tr>
								<tr>
									<td>Form</td>
									<td>{{ item.liquid ? 'Liquid' : 'Solid' }}</td>
								</tr>
								<tr v-if="!item.liquid">
									<td>Stack size</td>
									<td>{{ item.stackSize }}</td>
								</tr>
								<tr v-if="item.energyValue && item.liquid">
									<td>Energy value</td>
									<td>{{ item.energyValue * 1000 }} MJ/m<sup>3</sup></td>
								</tr>
								<tr v-if="item.energyValue && !item.liquid">
									<td>Energy value</td>
									<td>{{ item.energyValue }} MJ</td>
								</tr>
								<tr>
									<td>Radioactive</td>
									<td>{{ item.radioactiveDecay > 0 ? 'Yes' : 'No' }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col-lg-6">
				<div class="card mb-3">
					<h2 class="card-header">Recipes</h2>
					<div class="card-body">
						<RecipesTable :recipes="recipes" />
					</div>
				</div>
			</div>

			<div class="col-lg-6">
				<div class="card mb-3">
					<h2 class="card-header">Usages as ingredient</h2>
					<div class="card-body">
						<RecipesTable :recipes="usagesAsIngredient" />
					</div>
				</div>
			</div>

			<div class="col-lg-6">
				<div class="card mb-3">
					<h2 class="card-header">Usages for building</h2>
					<div class="card-body">
						<div class="table-responsive">
							<table class="table recipe-table table-hover two-columns">
								<thead>
									<tr>
										<th>Building name</th>
										<th>Ingredients</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="recipe in usagesForBuilding" :key="recipe.className">
										<td>
											<div v-for="product in recipe.products" :key="product.item" class="d-inline-block p-2">
												<RouterLink v-if="getBuilding(product.item)" :to="{name: 'building', params: {item: getBuilding(product.item)!.slug}}">
													<ItemIcon :item="getBuilding(product.item)!" :size="32" />
													{{ getBuilding(product.item)!.name }}
												</RouterLink>
											</div>
										</td>
										<td>
											<div v-for="ingredient in recipe.ingredients" :key="ingredient.item" class="d-inline-block p-2">
												<span class="item-amount">
													{{ ingredient.amount }}x
													<RouterLink v-if="getItem(ingredient.item)" :to="{name: 'item', params: {item: getItem(ingredient.item)!.slug}}">
														<ItemIcon :item="ingredient.item" />
													</RouterLink>
												</span>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<div class="col-lg-6">
				<div class="card mb-3">
					<h2 class="card-header">Usages for schematics</h2>
					<div class="card-body">
						<div class="table-responsive">
							<table class="table recipe-table table-hover two-columns">
								<thead>
									<tr>
										<th>Schematic</th>
										<th>Ingredients</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="schematic in usagesForSchematics" :key="schematic.className">
										<td>
											<RouterLink class="btn btn-link" :to="{name: 'schematic', params: {item: schematic.slug}}">
												{{ schematic.name }}
											</RouterLink>
										</td>
										<td>
											<div v-for="ingredient in schematic.cost" :key="ingredient.item" class="d-inline-block p-2">
												<span class="item-amount">
													{{ ingredient.amount }}x
													<RouterLink v-if="getItem(ingredient.item)" :to="{name: 'item', params: {item: getItem(ingredient.item)!.slug}}">
														<ItemIcon :item="ingredient.item" />
													</RouterLink>
												</span>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</template>
</template>
