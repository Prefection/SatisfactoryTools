<script setup lang="ts">
import {ref} from 'vue';
import {useProductionSolve} from '@src/composables/useProductionSolve';
import {ResultStatus} from '@src/Tools/Production/ResultStatus';
import ProductionForm from '@src/components/ProductionForm.vue';
import ResourceLimits from '@src/components/ResourceLimits.vue';
import InputList from '@src/components/InputList.vue';
import RecipeList from '@src/components/RecipeList.vue';
import MachineToggles from '@src/components/MachineToggles.vue';
import ResultOverview from '@src/components/ResultOverview.vue';

const {resultStatus, resultNew} = useProductionSolve();

const leftTab = ref<'production' | 'items' | 'recipes' | 'machines'>('production');
</script>

<template>
	<div class="row">
		<div class="col-lg-5">
			<ul class="nav nav-tabs mb-3">
				<li class="nav-item">
					<a href="javascript:void(0)" class="nav-link" :class="{active: leftTab === 'production'}" @click="leftTab = 'production'">
						<span class="fas fa-fw fa-chart-line mr-1"></span>Production
					</a>
				</li>
				<li class="nav-item">
					<a href="javascript:void(0)" class="nav-link" :class="{active: leftTab === 'items'}" @click="leftTab = 'items'">
						<span class="fas fa-fw fa-box-open mr-1"></span>Items, Input
					</a>
				</li>
				<li class="nav-item">
					<a href="javascript:void(0)" class="nav-link" :class="{active: leftTab === 'recipes'}" @click="leftTab = 'recipes'">
						<span class="fas fa-fw fa-scroll mr-1"></span>Recipes
					</a>
				</li>
				<li class="nav-item">
					<a href="javascript:void(0)" class="nav-link" :class="{active: leftTab === 'machines'}" @click="leftTab = 'machines'">
						<span class="fas fa-fw fa-industry mr-1"></span>Machines
					</a>
				</li>
			</ul>

			<ProductionForm v-if="leftTab === 'production'" />
			<template v-else-if="leftTab === 'items'">
				<ResourceLimits />
				<InputList />
			</template>
			<template v-else-if="leftTab === 'recipes'">
				<p>
					Select which recipes you want to allow to be used. The tool will automatically pick best possible combination of recipes from the selected ones.
				</p>
				<div class="row">
					<div class="col-md-6"><RecipeList mode="alternate" /></div>
					<div class="col-md-6"><RecipeList mode="base" /></div>
				</div>
			</template>
			<template v-else>
				<p>Select machines you have available. Disabling a machine will automatically disable all recipes in that machine.</p>
				<MachineToggles />
			</template>
		</div>
		<div class="col-lg-7">
			<p v-if="resultStatus === ResultStatus.NO_INPUT" class="text-secondary">Select an item to calculate.</p>
			<p v-else-if="resultStatus === ResultStatus.NO_RESULT" class="text-secondary">Couldn't calculate a production line for this request.</p>
			<div v-else-if="resultNew" :class="{calculating: resultStatus === ResultStatus.CALCULATING}">
				<div v-if="resultStatus === ResultStatus.CALCULATING" class="alert alert-info">Calculating…</div>
				<ResultOverview :result="resultNew" />
			</div>
		</div>
	</div>
</template>
