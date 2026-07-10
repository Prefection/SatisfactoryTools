import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import AppShell from '@src/components/AppShell.vue';
import HomeView from '@src/views/HomeView.vue';
import StubView from '@src/views/StubView.vue';
import ItemsView from '@src/views/ItemsView.vue';
import BuildingsView from '@src/views/BuildingsView.vue';
import SchematicsView from '@src/views/SchematicsView.vue';
import ItemView from '@src/views/ItemView.vue';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: AppShell,
		children: [
			{path: '', name: 'home', component: HomeView},
			{path: 'items', name: 'items', component: ItemsView},
			{path: 'items/:item', name: 'item', component: ItemView, props: true},
			{path: 'buildings', name: 'buildings', component: BuildingsView},
			{path: 'buildings/:item', name: 'building', component: StubView, props: true},
			{path: 'schematics', name: 'schematics', component: SchematicsView},
			{path: 'schematics/:item', name: 'schematic', component: StubView, props: true},
			{path: 'production', name: 'production', component: StubView, props: {title: 'Production'}},
		],
	},
	{path: '/:pathMatch(.*)*', redirect: '/'},
];

export const router = createRouter({history: createWebHistory(), routes});
