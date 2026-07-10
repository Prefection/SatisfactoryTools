<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {Constants} from '@src/Constants';
import type {ItemFilter} from '@src/utils/entityFilters';

defineProps<{filter: ItemFilter}>();

const stackSizes = Object.values(Constants.STACK_SIZE);
const physicalStates = Object.values(Constants.PHYSICAL_STATE);

const showAdvanced = ref(false);
const queryInput = ref<HTMLInputElement>();
onMounted(() => queryInput.value?.focus());
</script>

<template>
	<div class="input-group filter">
		<input ref="queryInput" type="text" class="form-control" placeholder="Search for an item"
		       v-model="filter.query" id="queryInput" />
		<div class="input-group-append">
			<a class="clear-filter" :class="{'has-content': filter.query.length > 0}" @click="filter.query = ''">
				<i class="fa fa-times"></i>
			</a>
			<a class="btn btn-secondary" @click="showAdvanced = !showAdvanced">
				{{ showAdvanced ? 'Hide' : 'Show' }} advanced filters
				<i :class="{'fas fa-chevron-down': !showAdvanced, 'fas fa-chevron-up': showAdvanced}"></i>
			</a>
		</div>
	</div>
	<div class="d-flex flex-row">
		<div v-show="showAdvanced">
			<div class="d-flex flex-row justify-content-start align-items-center">
				<div class="d-flex flex-column justify-content-center align-items-start" style="margin-right: 10px;">
					<div class="form-check">
						<label class="form-check-label">
							<input type="checkbox" class="form-check-input" v-model="filter.onlyRadioactive" />
							<span>Show only radioactive</span>
						</label>
					</div>
					<div class="form-check">
						<label class="form-check-label">
							<input type="checkbox" class="form-check-input" v-model="filter.onlyWithEnergyValue" />
							<span>With energy value only</span>
						</label>
					</div>
				</div>
				<div class="form-group" style="margin-right: 10px;">
					<label>Stack size
						<select v-model="filter.stackSize" class="form-control">
							<option :value="null">any</option>
							<option v-for="size in stackSizes" :key="size" :value="size">{{ size }}</option>
						</select>
					</label>
				</div>
				<div class="form-group" style="margin-right: 10px;">
					<label>Physical state
						<select v-model="filter.physicalState" class="form-control">
							<option :value="null">any</option>
							<option v-for="state in physicalStates" :key="state" :value="state">{{ state }}</option>
						</select>
					</label>
				</div>
			</div>
		</div>
		<div class="mr-auto"></div>
	</div>
</template>
