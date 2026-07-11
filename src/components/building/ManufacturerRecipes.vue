<script setup lang="ts">
import {computed} from 'vue';
import data from '@src/Data/Data';
import {Constants} from '@src/Constants';
import RecipesTable from '@src/components/RecipesTable.vue';
import type {IBuildingSchema} from '@src/Schema/IBuildingSchema';
import type {IRecipeSchema} from '@src/Schema/IRecipeSchema';

const props = defineProps<{building: IBuildingSchema}>();

const recipes = computed<IRecipeSchema[]>(() => {
	const recipeSchemas = Object.values(data.getRawData().recipes);
	const isManual = data.isManualManufacturer(props.building);
	if (isManual && Constants.WORKSHOP_CLASSNAME === props.building.className) {
		return recipeSchemas.filter((recipe) => recipe.inWorkshop);
	}
	if (isManual && Constants.WORKBENCH_CLASSNAME === props.building.className) {
		return recipeSchemas.filter((recipe) => !recipe.inWorkshop && recipe.inHand);
	}
	return recipeSchemas.filter((recipe) => recipe.producedIn.indexOf(props.building.className) > -1);
});
</script>

<template>
	<div class="card">
		<h2 class="card-header">Recipes</h2>
		<div class="card-body">
			<RecipesTable :recipes="recipes" />
		</div>
	</div>
</template>
