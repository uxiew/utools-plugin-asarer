import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
// import vconsole from 'vconsole';
// new vconsole();

createApp(App).use(store).use(router).mount('#app');
