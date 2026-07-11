<script setup lang="ts">
import {ref, computed} from 'vue';
import data from '@src/Data/Data';
import {useGameData} from '@src/composables/useGameData';
import {byName} from '@src/utils/entityFilters';
import SchematicFilters from '@src/components/SchematicFilters.vue';
import CodexList from '@src/components/CodexList.vue';

const {version} = useGameData();
const query = ref('');
const filtered = computed(() => {
	void version.value; // recompute on version switch
	return byName(Object.values(data.getAllSchematics()), query.value);
});
</script>

<template>
	<div class="row">
		<div class="col-sm-6"></div>
		<div class="col-sm-6"><SchematicFilters v-model="query" /></div>
	</div>
	<CodexList :filtered="filtered" route-name="schematic" />
</template>
