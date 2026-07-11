<script setup lang="ts">
import {computed} from 'vue';
import {VueDraggable} from 'vue-draggable-plus';
import {useTabs} from '@src/composables/useActiveTab';
import ItemIcon from '@src/components/ItemIcon.vue';

const {tabs, activeId, selectedIds, setActive, toggleSelected, addTab, cloneTab, removeTab, removeSelected, tabName, tabIcon, persist} = useTabs();
const hasSelection = computed(() => selectedIds.size > 0);

// VueDraggable emits a reordered copy; splice it back into the store array in place so
// the reactive `tabs` (and localStorage via persist) keep the new order.
function onReorder(next: {id: string; data: unknown}[]): void {
	tabs.splice(0, tabs.length, ...(next as typeof tabs));
	persist();
}
</script>

<template>
	<div class="tab-bar d-flex align-items-center mb-3">
		<VueDraggable :model-value="tabs" @update:model-value="onReorder" :animation="150" class="nav nav-tabs flex-grow-1" handle=".tab-handle">
			<div v-for="tab in tabs" :key="tab.id" class="nav-item">
				<a href="javascript:void(0)" class="nav-link d-flex align-items-center" :class="{active: tab.id === activeId}" @click="setActive(tab.id)">
					<input type="checkbox" class="mr-2" :checked="selectedIds.has(tab.id)" @click.stop="toggleSelected(tab.id)" />
					<span class="tab-handle mr-1" style="cursor: move">
						<ItemIcon v-if="tabIcon(tab)" :item="tabIcon(tab)!" :size="20" hide-tooltip />
					</span>
					<span>{{ tabName(tab) }}</span>
					<button type="button" class="close ml-2" @click.stop="removeTab(tab.id)"><span>&times;</span></button>
				</a>
			</div>
		</VueDraggable>
		<button type="button" class="btn btn-sm btn-secondary ml-2" title="Add tab" @click="addTab"><span class="fas fa-fw fa-plus"></span></button>
		<button type="button" class="btn btn-sm btn-secondary ml-1" title="Clone active tab" @click="cloneTab(activeId)"><span class="fas fa-fw fa-clone"></span></button>
		<button v-if="hasSelection" type="button" class="btn btn-sm btn-danger ml-1" title="Delete selected" @click="removeSelected">
			<span class="fas fa-fw fa-trash"></span> {{ selectedIds.size }}
		</button>
	</div>
</template>
