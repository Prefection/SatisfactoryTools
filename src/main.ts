import {createApp} from 'vue';
import App from './App.vue';
import {router} from '@src/router';
import {initGameData} from '@src/composables/useGameData';
import '@styles/bootstrap.scss';
import '@styles/style.scss';

initGameData();
createApp(App).use(router).mount('#app');
