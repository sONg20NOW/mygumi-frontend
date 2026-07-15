import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import Vue3Toastify from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

createApp(App).use(router).use(Vue3Toastify, {
  autoClose: 3000,      // 3초 후 자동으로 사라짐
  position: 'bottom-right', // 화면 우측 상단 노출
  theme: 'colored',     // 성공(초록), 에러(빨강) 등의 색상 테마 강조 적용
}).mount('#app')
