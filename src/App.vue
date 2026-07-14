<template>
  <div class="app-container">
    <AppHeader />

    <main class="main-content">
      <RouterView />
    </main>

    <AppFooter />

    <ChatBot />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import ChatBot from './components/ChatBot.vue';
</script>

<style>
/* 기본 Reset 및 전역 레이아웃 스타일 선언 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Arial', sans-serif;
  background-color: #f8f9fa;
  color: #333;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 화면 전체 높이 확보 */
}

.main-content {
  flex-grow: 1; /* 푸터를 바닥으로 밀어내기 위해 콘텐츠 영역 확장 */
  width: 100%;
  max-width: 1200px; /* 전체 중앙 정렬 가이드 line */
  margin: 0 auto;
  padding: 20px;
}
</style>