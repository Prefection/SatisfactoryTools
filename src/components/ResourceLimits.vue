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
	<div class="hud-panel">
		<div class="hud-section-header">
			<span class="hud-section-header__title">Raw resources</span>
			<span class="hud-section-header__help">Cap the raw resources your map or plan allows.</span>
			<span class="hud-section-header__actions">
				<button class="btn btn-secondary px-3" @click="setFromMapLimits">Set from map limits</button>
				<button class="btn btn-secondary px-3" @click="setToZero">Set to 0</button>
			</span>
		</div>
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
</template>
