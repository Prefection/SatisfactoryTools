<script setup lang="ts">
import {ref} from 'vue';
import {useProductionSolve} from '@src/composables/useProductionSolve';
import {useActiveTab} from '@src/composables/useActiveTab';
import {ResultStatus} from '@src/Tools/Production/ResultStatus';
import TabBar from '@src/components/TabBar.vue';
import ProductionForm from '@src/components/ProductionForm.vue';
import ResourceLimits from '@src/components/ResourceLimits.vue';
import InputList from '@src/components/InputList.vue';
import RecipeList from '@src/components/RecipeList.vue';
import MachineToggles from '@src/components/MachineToggles.vue';
import ResultOverview from '@src/components/ResultOverview.vue';
import ResultGraph from '@src/components/ResultGraph.vue';
import ResultItemsTable from '@src/components/ResultItemsTable.vue';
import ResultBuildingsTable from '@src/components/ResultBuildingsTable.vue';
import ResultPowerTable from '@src/components/ResultPowerTable.vue';

const {resultStatus, resultNew} = useProductionSolve();
const {data} = useActiveTab();

const leftTab = ref<'production' | 'items' | 'recipes' | 'machines'>('production');
const resultTab = ref<'overview' | 'visualization' | 'items' | 'buildings' | 'power'>('overview');
</script>

<template>
	<TabBar />
	<input class="form-control mb-3" placeholder="Factory name" v-model="data.metadata.name" style="max-width: 300px" />

	<!-- Editor: full-width card with a vertical sidebar nav -->
	<div class="card mb-4">
		<div class="card-body">
			<div class="row">
				<div class="col-md-2 border-right border-secondary">
					<ul class="nav nav-tabs flex-column">
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
				</div>
				<div class="col-md-10">
					<ProductionForm v-if="leftTab === 'production'" />
					<div v-else-if="leftTab === 'items'" class="row">
						<div class="col-md-6"><ResourceLimits /></div>
						<div class="col-md-6"><InputList /></div>
					</div>
					<template v-else-if="leftTab === 'recipes'">
						<p>Select which recipes you want to allow to be used. The tool will automatically pick best possible combination of recipes from the selected ones.</p>
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
			</div>
		</div>
	</div>

	<!-- Result: full-width section below -->
	<p v-if="resultStatus === ResultStatus.NO_INPUT" class="text-secondary">Select an item to calculate.</p>
	<p v-else-if="resultStatus === ResultStatus.NO_RESULT" class="text-secondary">Couldn't calculate a production line for this request.</p>
	<div v-else-if="resultNew" :class="{calculating: resultStatus === ResultStatus.CALCULATING}">
		<div v-if="resultStatus === ResultStatus.CALCULATING" class="alert alert-info">Calculating…</div>

		<ul class="nav nav-pills nav-justified mb-3">
			<li class="nav-item">
				<a href="javascript:void(0)" class="nav-link" :class="{active: resultTab === 'overview'}" @click="resultTab = 'overview'">Overview</a>
			</li>
			<li class="nav-item">
				<a href="javascript:void(0)" class="nav-link" :class="{active: resultTab === 'visualization'}" @click="resultTab = 'visualization'">Visualization</a>
			</li>
			<li class="nav-item">
				<a href="javascript:void(0)" class="nav-link" :class="{active: resultTab === 'power'}" @click="resultTab = 'power'">Power</a>
			</li>
			<li class="nav-item">
				<a href="javascript:void(0)" class="nav-link" :class="{active: resultTab === 'items'}" @click="resultTab = 'items'">Items</a>
			</li>
			<li class="nav-item">
				<a href="javascript:void(0)" class="nav-link" :class="{active: resultTab === 'buildings'}" @click="resultTab = 'buildings'">Buildings</a>
			</li>
		</ul>

		<ResultOverview v-if="resultTab === 'overview'" :result="resultNew" />
		<ResultGraph v-else-if="resultTab === 'visualization'" :result="resultNew" />
		<ResultItemsTable v-else-if="resultTab === 'items'" :result="resultNew" />
		<ResultBuildingsTable v-else-if="resultTab === 'buildings'" :result="resultNew" />
		<ResultPowerTable v-else-if="resultTab === 'power'" :result="resultNew" />
	</div>
</template>
