<script setup lang="ts">
import {reactive, computed} from 'vue';
import data from '@src/Data/Data';
import {useGameData} from '@src/composables/useGameData';
import {filterItems, ItemFilter} from '@src/utils/entityFilters';
import ItemFilters from '@src/components/ItemFilters.vue';
import CodexList from '@src/components/CodexList.vue';

const {version} = useGameData();
const filter = reactive<ItemFilter>({query: '', onlyRadioactive: false, onlyWithEnergyValue: false, stackSize: null, physicalState: null});
const filtered = computed(() => {
	void version.value; // recompute on version switch
	return filterItems(Object.values(data.getAllItems()), filter);
});
</script>

<template>
	<div class="row">
		<div class="col-md-9"><CodexList :filtered="filtered" route-name="item" /></div>
		<div class="col-md-3"><ItemFilters :filter="filter" /></div>
	</div>
</template>
