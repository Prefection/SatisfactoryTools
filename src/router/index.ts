import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router';
import AppShell from '@src/components/AppShell.vue';
import HomeView from '@src/views/HomeView.vue';
import StubView from '@src/views/StubView.vue';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: AppShell,
		children: [
			{path: '', name: 'home', component: HomeView},
			{path: 'items', name: 'items', component: StubView, props: {title: 'Items'}},
			{path: 'items/:item', name: 'item', component: StubView, props: true},
			{path: 'buildings', name: 'buildings', component: StubView, props: {title: 'Buildings'}},
			{path: 'buildings/:item', name: 'building', component: StubView, props: true},
			{path: 'schematics', name: 'schematics', component: StubView, props: {title: 'Schematics'}},
			{path: 'schematics/:item', name: 'schematic', component: StubView, props: true},
			{path: 'production', name: 'production', component: StubView, props: {title: 'Production'}},
		],
	},
	{path: '/:pathMatch(.*)*', redirect: '/'},
];

export const router = createRouter({history: createWebHistory(), routes});
