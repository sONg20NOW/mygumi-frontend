<template>
  <header class="app-header">
    <div class="header-container">
      <RouterLink to="/" class="logo-container">
        <img src="/favicon.png" alt="LocalHub Logo" class="logo-icon" height="40" />
        <span class="logo">LocalHub</span>
      </RouterLink>
      
      <nav class="nav-links">
        <RouterLink to="/board" class="nav-item" active-class="active">커뮤니티 게시판</RouterLink>
        <RouterLink to="/calendar" class="nav-item" active-class="active">축제 일정</RouterLink>
        <RouterLink to="/map" class="nav-item" active-class="active">지역 지도 보기</RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-container:hover,
.logo-container:focus,
.logo-container:active {
  text-decoration: none;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.logo-container:hover .logo {
  opacity: 0.7;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-item {
  font-size: 16px;
  color: #495057;
  text-decoration: none;
  font-weight: 500;
  padding: 5px 10px;
  transition: color 0.2s;
}

.nav-item:hover {
  color: #007bff;
}

.nav-item.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}
</style>