<script setup lang="ts">
import {ref, computed} from 'vue';
import type {IItemSchema} from '@src/Schema/IItemSchema';
import ItemIcon from '@src/components/ItemIcon.vue';

const props = withDefaults(defineProps<{items: IItemSchema[]; placeholder?: string}>(), {placeholder: 'Select an item…'});
const model = defineModel<string | null>();

const query = ref('');
const open = ref(false);
const active = ref(0);

const selectedName = computed(() => {
	const found = props.items.find((i) => i.className === model.value);
	return found ? found.name : '';
});

const filtered = computed(() => {
	const q = query.value.trim().toLowerCase();
	const list = q ? props.items.filter((i) => i.name.toLowerCase().includes(q)) : props.items;
	return list.slice(0, 50); // cap the dropdown; typing narrows further. Raise if a real need shows.
});

function openList(): void { open.value = true; active.value = 0; query.value = ''; }
function pick(item: IItemSchema): void { model.value = item.className; query.value = ''; open.value = false; }
function onKeydown(e: KeyboardEvent): void {
	if (!open.value && (e.key === 'ArrowDown' || e.key === 'Enter')) { openList(); return; }
	if (e.key === 'ArrowDown') { active.value = Math.min(active.value + 1, filtered.value.length - 1); e.preventDefault(); }
	else if (e.key === 'ArrowUp') { active.value = Math.max(active.value - 1, 0); e.preventDefault(); }
	else if (e.key === 'Enter') { const it = filtered.value[active.value]; if (it) pick(it); e.preventDefault(); }
	else if (e.key === 'Escape') { open.value = false; }
}
</script>

<template>
	<div class="item-combobox" style="position: relative" @focusout="open = false">
		<div class="form-control combobox-control d-flex align-items-center">
			<ItemIcon v-if="model" :item="model" :size="24" hide-tooltip class="mr-2 flex-shrink-0" />
			<input class="combobox-input flex-grow-1" :placeholder="placeholder"
			       :value="open ? query : selectedName"
			       @focus="openList" @click="openList"
			       @input="query = ($event.target as HTMLInputElement).value; open = true; active = 0"
			       @keydown="onKeydown" />
		</div>
		<ul v-if="open && filtered.length" class="dropdown-menu show" style="max-height: 300px; overflow-y: auto; width: 100%">
			<li v-for="(item, i) in filtered" :key="item.className">
				<a class="dropdown-item" :class="{active: i === active}"
				   @mousedown.prevent="pick(item)" @mouseenter="active = i">
					<ItemIcon :item="item" :size="24" hide-tooltip /> {{ item.name }}
				</a>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.combobox-control {
	height: auto;
	min-height: calc(1.5em + 0.75rem + 2px); /* Bootstrap .form-control height */
	cursor: text;
}
.combobox-input {
	border: 0;
	padding: 0;
	background: transparent;
	color: inherit;
	outline: none;
	min-width: 0; /* let flex-grow shrink it instead of overflowing */
}
</style>
