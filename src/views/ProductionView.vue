<script setup lang="ts">
import {ref, computed} from 'vue';
import {VueDraggable} from 'vue-draggable-plus';
import {useProductionSolve} from '@src/composables/useProductionSolve';
import {useActiveTab, useTabs} from '@src/composables/useActiveTab';
import {ResultStatus} from '@src/Tools/Production/ResultStatus';
import {encodeTabs, decodeTabs, patchImportedTab} from '@src/utils/tabsCodec';
import {Strings} from '@src/Utils/Strings';
import ItemIcon from '@src/components/ItemIcon.vue';
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
const {
	tabs, activeId, selectedIds, setActive, toggleSelected, selectAll, clearSelected,
	resetTab, addTab, cloneTab, removeTab, removeSelected, tabName, tabIcon, addTabFromData, persist,
} = useTabs();

const manage = ref(false);
const expanded = ref(true);
const renaming = ref(false);
const copied = ref(false);
const leftTab = ref<'production' | 'items' | 'recipes' | 'machines'>('production');
const resultTab = ref<'overview' | 'visualization' | 'power' | 'items' | 'buildings'>('visualization');

const active = computed(() => tabs.find((t) => t.id === activeId.value));

function selectTab(id: string): void {
	manage.value = false;
	renaming.value = false;
	setActive(id);
}
function addAndSelect(): void {
	manage.value = false;
	addTab();
}
function onReorder(next: {id: string; data: unknown}[]): void {
	tabs.splice(0, tabs.length, ...(next as typeof tabs));
	persist();
}

function exportTabs(): void {
	const chosen = selectedIds.size > 0 ? tabs.filter((t) => selectedIds.has(t.id)) : tabs;
	Strings.downloadFile('satisfactory-tools-export', 'sft', encodeTabs(chosen.map((t) => t.data), true));
}
function importTabs(e: Event): void {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = () => {
		try {
			for (const t of decodeTabs(reader.result as string)) addTabFromData(patchImportedTab(t), false);
		} catch (err) {
			alert('Couldn\'t import file: ' + (err as Error).message);
		}
	};
	reader.readAsText(file, 'utf-8');
	(e.target as HTMLInputElement).value = '';
}
function copyShareLink(): void {
	if (!active.value) return;
	const url = `${window.location.origin}/production?f=${encodeURIComponent(encodeTabs([active.value.data]))}`;
	navigator.clipboard.writeText(url).then(() => {
		copied.value = true;
		setTimeout(() => { copied.value = false; }, 2000);
	}).catch(() => {
		window.prompt('Copy this share link:', url);
	});
}
</script>

<template>
	<h2>Production</h2>
	<p>
		Each tab is a separate production line. You can have multiple tabs, and they are automatically saved in
		your browser. Share a line with the share button, or reorder tabs by dragging them.
	</p>

	<div class="nav nav-tabs production-nav-tabs">
		<div class="nav-item d-flex">
			<a class="nav-link align-self-center" :class="{active: manage}" title="Manage production lines, export and import" @click="manage = true">
				<span class="fas fa-tasks"></span>
			</a>
		</div>
		<VueDraggable :model-value="tabs" @update:model-value="onReorder" :animation="150" tag="div" class="d-flex">
			<div v-for="tab in tabs" :key="tab.id" class="nav-item">
				<span class="nav-link cursor-pointer" :class="{active: !manage && tab.id === activeId}" :title="tabName(tab)" @click="selectTab(tab.id)">
					<ItemIcon v-if="tabIcon(tab)" :item="tabIcon(tab)!" :size="32" hide-tooltip />
					<span v-else class="fas fa-fw fa-question"></span>
				</span>
			</div>
		</VueDraggable>
		<div class="nav-item d-flex new-tab">
			<a class="nav-link align-self-center" title="Add new production line" @click="addAndSelect">
				<span class="fas fa-plus"></span>
			</a>
		</div>
	</div>

	<!-- Manage: export / import / bulk-select -->
	<div v-if="manage" class="card production-input">
		<div class="card-header d-flex">
			<span class="mx-3 production-line-name">{{ selectedIds.size }} out of {{ tabs.length }} selected</span>
			<span class="btn-group">
				<a class="btn btn-dark w-auto" @click="selectAll">All</a>
				<a class="btn btn-dark w-auto" @click="clearSelected">None</a>
			</span>
			<span class="btn-group">
				<a class="btn btn-info" title="Export selected tabs" @click="exportTabs"><span class="fas fa-fw fa-file-export"></span></a>
				<a class="btn btn-danger" title="Remove selected tabs" @click="removeSelected"><span class="fas fa-fw fa-trash-alt"></span></a>
			</span>
		</div>
		<div class="card-body">
			<div class="row">
				<div class="col-md-9">
					<h4>Production lines</h4>
					<p>Select production lines that you want to export (or delete).</p>
					<table class="alternate-recipe-list">
						<tr v-for="tab in tabs" :key="tab.id" @click="toggleSelected(tab.id)">
							<td class="p-2"><span class="fas" :class="selectedIds.has(tab.id) ? 'fa-check-square' : 'fa-square'"></span></td>
							<td class="p-2">
								<ItemIcon v-if="tabIcon(tab)" :item="tabIcon(tab)!" :size="32" hide-tooltip />
								<span v-else class="fas fa-fw fa-question"></span>
							</td>
							<td class="p-2">{{ tabName(tab) }}</td>
						</tr>
					</table>
				</div>
				<div class="col-md-3 border-left border-light">
					<h4>Import (.sft file)</h4>
					<label><input type="file" accept=".sft" @change="importTabs" /></label>
				</div>
			</div>
		</div>
	</div>

	<!-- Edit the active tab -->
	<template v-else-if="active">
		<div class="card production-input">
			<div class="card-header d-flex">
				<div class="production-image d-flex">
					<span class="image-picker">
						<ItemIcon v-if="tabIcon(active)" :item="tabIcon(active)!" :size="32" hide-tooltip />
						<span v-else class="fas fa-fw fa-question"></span>
					</span>
				</div>
				<span class="production-line-name flex-grow-1">
					<span v-if="!renaming" class="production-line-name-title mr-2"><span>{{ tabName(active) }}</span></span>
					<form v-else class="mr-2 flex-grow-1" @submit.prevent="renaming = false">
						<input class="form-control" placeholder="Factory name" v-model="data.metadata.name" />
					</form>
					<span v-if="!renaming" class="btn btn-outline-light" title="Rename tab" @click="renaming = true"><span class="fas fa-pencil-alt"></span></span>
					<span v-else class="btn btn-outline-success" @click="renaming = false"><span class="fas fa-check"></span></span>
				</span>

				<span class="btn-group">
					<a class="btn btn-info" title="Share tab" @click="copyShareLink"><span class="fas fa-fw" :class="copied ? 'fa-check' : 'fa-share-alt'"></span></a>
					<a class="btn btn-success" title="Clone tab" @click="cloneTab(activeId)"><span class="far fa-fw fa-clone"></span></a>
					<a class="btn btn-warning" title="Reset tab to default" @click="resetTab(activeId)"><span class="fas fa-fw fa-eraser"></span></a>
					<a class="btn btn-danger" title="Remove tab" @click="removeTab(activeId)"><span class="fas fa-fw fa-trash-alt"></span></a>
					<a class="btn btn-secondary" :title="expanded ? 'Collapse' : 'Expand'" @click="expanded = !expanded">
						<span class="fas fa-fw" :class="expanded ? 'fa-chevron-up' : 'fa-chevron-down'"></span>
					</a>
				</span>
			</div>

			<div v-show="expanded" class="card-body">
				<div class="row">
					<div class="col-md-2 border-right border-light">
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

		<!-- Result -->
		<div v-if="resultStatus === ResultStatus.NO_INPUT" class="visualization-result">Select an item to calculate.</div>
		<div v-else-if="resultStatus === ResultStatus.NO_RESULT" class="visualization-result">
			Unfortunately we couldn't calculate any result.<br />
			<span>This can be due to many things: a missing resource, not enough resources for the requested amount, or a required recipe being disabled.</span>
		</div>
		<div v-else-if="resultNew" class="visualization-result-container" :class="{calculating: resultStatus === ResultStatus.CALCULATING}">
			<div class="calculating-alert"><span class="fas fa-spin fa-sync-alt"></span> Calculating ...</div>

			<ul class="nav nav-pills nav-justified result-nav">
				<li class="nav-item"><a class="nav-link" :class="{active: resultTab === 'overview'}" @click="resultTab = 'overview'"><span class="fas fa-info-circle mr-1"></span> Overview</a></li>
				<li class="nav-item"><a class="nav-link" :class="{active: resultTab === 'visualization'}" @click="resultTab = 'visualization'"><span class="fas fa-project-diagram mr-1"></span> Visualization</a></li>
				<li class="nav-item"><a class="nav-link" :class="{active: resultTab === 'power'}" @click="resultTab = 'power'"><span class="fas fa-bolt mr-1"></span> Power</a></li>
				<li class="nav-item"><a class="nav-link" :class="{active: resultTab === 'items'}" @click="resultTab = 'items'"><span class="fas fa-pallet mr-1"></span> Items</a></li>
				<li class="nav-item"><a class="nav-link" :class="{active: resultTab === 'buildings'}" @click="resultTab = 'buildings'"><span class="fas fa-industry mr-1"></span> Buildings</a></li>
			</ul>

			<ResultOverview v-if="resultTab === 'overview'" :result="resultNew" />
			<ResultGraph v-else-if="resultTab === 'visualization'" :result="resultNew" />
			<ResultPowerTable v-else-if="resultTab === 'power'" :result="resultNew" />
			<ResultItemsTable v-else-if="resultTab === 'items'" :result="resultNew" />
			<ResultBuildingsTable v-else-if="resultTab === 'buildings'" :result="resultNew" />
		</div>
	</template>
</template>
