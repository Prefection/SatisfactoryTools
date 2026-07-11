<script setup lang="ts">
import {computed} from 'vue';
import data, {Data} from '@src/Data/Data';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import {toggleInArray} from '@src/utils/toggleInArray';
import ItemIcon from '@src/components/ItemIcon.vue';

const {data: tabData} = useActiveTab();
const {version} = useGameData();

// Raw resources with map limits, name-sorted; re-resolve on version switch.
const resources = computed(() => {
	void version.value;
	return data.getResources();
});

function isEnabled(item: string): boolean {
	return !tabData.request.blockedResources.includes(item);
}

function setFromMapLimits(): void {
	Object.assign(tabData.request.resourceMax, Data.resourceAmounts);
}

function setToZero(): void {
	for (const resource of resources.value) {
		tabData.request.resourceMax[resource.item] = 0;
	}
}
</script>

<template>
	<div class="card">
		<h3 class="card-header card-header-with-buttons">
			<span class="card-header-text">Raw resources</span>
			<span class="btn-group">
				<button class="btn btn-secondary px-3" @click="setFromMapLimits">Set from map limits</button>
				<button class="btn btn-secondary px-3" @click="setToZero">Set to 0</button>
			</span>
		</h3>
		<div class="card-body">
			<p>Select which raw resources you want to use and their limits. By default it's populated with map limits, but you can easily change that.</p>
			<table class="item-list">
				<thead>
					<tr>
						<th>Resource</th>
						<th>Limit</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="resource in resources" :key="resource.item">
						<td class="cursor-pointer" @click="toggleInArray(tabData.request.blockedResources, resource.item)">
							<span class="fas" :class="isEnabled(resource.item) ? 'fa-check-square' : 'fa-square'"></span>
							<span class="ml-2">
								<ItemIcon :item="resource.item" :size="32" />
								{{ data.getItemByClassName(resource.item)?.name }}
							</span>
						</td>
						<td>
							<input type="number" class="form-control" :disabled="!isEnabled(resource.item)" v-model.number="tabData.request.resourceMax[resource.item]" />
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>
