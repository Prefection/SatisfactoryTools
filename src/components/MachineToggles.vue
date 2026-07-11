<script setup lang="ts">
import {computed} from 'vue';
import data from '@src/Data/Data';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import {toggleInArray} from '@src/utils/toggleInArray';
import ItemIcon from '@src/components/ItemIcon.vue';

const {data: tabData} = useActiveTab();
const {version} = useGameData();

// Manufacturer buildings, already name-sorted by Data.getManufacturers(); re-resolve on version switch.
const machines = computed(() => {
	void version.value;
	return data.getManufacturers();
});

// ponytail: field is optional in the type only for legacy persisted data pre-dating it; self-heal in place like ProductionTab did.
function blockedMachines(): string[] {
	return tabData.request.blockedMachines ??= [];
}

function isEnabled(className: string): boolean {
	return !blockedMachines().includes(className);
}
</script>

<template>
	<div class="recipe-list-card card">
		<div class="card-header d-flex">
			<span class="recipe-list-card-title text-nowrap">Available machines</span>
		</div>

		<div class="card-body">
			<table class="alternate-recipe-list">
				<tr v-for="machine in machines" :key="machine.className" @click="toggleInArray(blockedMachines(), machine.className)">
					<td>
						<span class="fas" :class="isEnabled(machine.className) ? 'fa-check-square' : 'fa-square'"></span>
					</td>
					<td class="d-flex justify-content-between">
						<span>
							<ItemIcon :item="machine" :size="20" />
							{{ machine.name }}
						</span>
					</td>
				</tr>
			</table>
		</div>
	</div>
</template>
