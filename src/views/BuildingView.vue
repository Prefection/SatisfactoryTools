<script setup lang="ts">
import {computed, watchEffect} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import data from '@src/Data/Data';
import {useGameData} from '@src/composables/useGameData';
import ItemIcon from '@src/components/ItemIcon.vue';
import ManufacturerDetails from '@src/components/building/ManufacturerDetails.vue';
import GeneratorDetails from '@src/components/building/GeneratorDetails.vue';
import ExtractorDetails from '@src/components/building/ExtractorDetails.vue';
import OtherBuildingDetails from '@src/components/building/OtherBuildingDetails.vue';
import ManufacturerRecipes from '@src/components/building/ManufacturerRecipes.vue';
import GeneratorFuels from '@src/components/building/GeneratorFuels.vue';
import ExtractorResources from '@src/components/building/ExtractorResources.vue';
import type {IRecipeSchema} from '@src/Schema/IRecipeSchema';

const route = useRoute();
const router = useRouter();
const {version} = useGameData();

const building = computed(() => {
	void version.value; // re-resolve on version switch
	return data.getBuildingBySlug(route.params.item as string);
});

watchEffect(() => {
	if (!building.value) {
		router.replace({name: 'buildings'});
	}
});

const buildingRecipe = computed<IRecipeSchema | null>(() => {
	const current = building.value;
	if (!current) {
		return null;
	}
	return Object.values(data.getRawData().recipes).find((recipe) => {
		return recipe.products.some((product) => product.item === current.className);
	}) ?? null;
});

function getItem(className: string) {
	return data.getItemByClassName(className);
}

// order matters — generator/extractor checked before manufacturer (matches AppModule.ts:244-271)
const detailsComponent = computed(() => {
	const b = building.value!;
	if (data.isGeneratorBuilding(b)) return GeneratorDetails;
	if (data.isExtractorBuilding(b)) return ExtractorDetails;
	if (data.isManufacturerBuilding(b)) return ManufacturerDetails;
	return OtherBuildingDetails;
});
const relatedComponent = computed(() => {
	const b = building.value!;
	if (data.isGeneratorBuilding(b)) return GeneratorFuels;
	if (data.isExtractorBuilding(b)) return ExtractorResources;
	if (data.isManufacturerBuilding(b)) return ManufacturerRecipes;
	return null;
});
</script>

<template>
	<template v-if="building">
		<RouterLink :to="{name: 'buildings'}">&larr; Back to buildings</RouterLink>

		<div class="row">
			<div class="col-md-6">
				<div class="card mb-3">
					<h2 class="card-header">{{ building.name }}</h2>
					<div class="card-body">
						<span class="float-left mr-3">
							<ItemIcon :item="building" :size="128" />
						</span>
						<p style="white-space: pre-line;">{{ building.description }}</p>
						<div class="clearfix"></div>
						<div v-if="buildingRecipe">
							<hr>
							<h4>Cost</h4>
							<div v-for="ingredient in buildingRecipe.ingredients" :key="ingredient.item" class="d-inline-block p-2">
								<span class="item-amount">
									{{ ingredient.amount }}x
									<RouterLink v-if="getItem(ingredient.item)" :to="{name: 'item', params: {item: getItem(ingredient.item)!.slug}}">
										<ItemIcon :item="ingredient.item" />
									</RouterLink>
								</span>
							</div>
							<span v-if="building.metadata.lengthPerCost">/ {{ building.metadata.lengthPerCost / 100 }} m</span>
						</div>
					</div>
				</div>
			</div>

			<div class="col-md-6">
				<div class="card mb-3">
					<h2 class="card-header">{{ building.name }} details</h2>
					<div class="card-body">
						<component :is="detailsComponent" :key="`details-${route.params.item}`" :building="building" />
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col-lg-12">
				<component v-if="relatedComponent" :is="relatedComponent" :key="`related-${route.params.item}`" :building="building" />
			</div>
		</div>
	</template>
</template>
