<script setup lang="ts">
import {useProductionSolve} from '@src/composables/useProductionSolve';
import {ResultStatus} from '@src/Tools/Production/ResultStatus';
import ProductionForm from '@src/components/ProductionForm.vue';
import ResultOverview from '@src/components/ResultOverview.vue';

const {resultStatus, resultNew} = useProductionSolve();
</script>

<template>
	<div class="row">
		<div class="col-lg-5"><ProductionForm /></div>
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
