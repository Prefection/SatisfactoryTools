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

// field is optional in the type only for legacy persisted data pre-dating it; self-heal in place like ProductionTab did.
function blockedMachines(): string[] {
	return tabData.request.blockedMachines ??= [];
}

function isEnabled(className: string): boolean {
	return !blockedMachines().includes(className);
}

function resetMachines(): void {
	tabData.request.blockedMachines = [];
}
</script>

<template>
	<div class="hud-panel">
		<div class="hud-section-header">
			<span class="hud-section-header__title">Available machines</span>
			<span class="hud-section-header__help">Turn off machines you don't have yet — their recipes switch off too.</span>
			<span class="hud-section-header__actions">
				<span class="btn btn-secondary px-3" title="Re-enable all machines" @click="resetMachines">Reset</span>
			</span>
		</div>

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
</template>
