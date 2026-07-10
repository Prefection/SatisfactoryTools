<script setup lang="ts">
const model = defineModel<string>({default: ''});
</script>

<template>
	<div class="input-group filter">
		<input type="text" class="form-control" placeholder="Search for an item" v-model="model" />
		<div class="input-group-append">
			<a class="clear-filter" :class="{'has-content': model.length > 0}" @click="model = ''">
				<i class="fa fa-times"></i>
			</a>
		</div>
	</div>
</template>
