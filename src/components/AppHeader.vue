<template>
  <header class="app-header">
    <div class="header-container">
      <RouterLink to="/" class="logo-container" @click="closeMenu">
        <img src="/favicon.png" alt="LocalHub Logo" class="logo-icon" height="40" />
        <span class="logo">LocalHub</span>
      </RouterLink>
      
      <button 
        @click="toggleMenu" 
        class="hamburger-btn" 
        :class="{ 'is-active': isMenuOpen }"
        :aria-label="isMenuOpen ? '메뉴 닫기' : '메뉴 열기'"
      >
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <nav class="nav-links" :class="{ 'is-mobile-open': isMenuOpen }">
        <RouterLink to="/board" class="nav-item" active-class="active" @click="closeMenu">커뮤니티 게시판</RouterLink>
        <RouterLink to="/calendar" class="nav-item" active-class="active" @click="closeMenu">축제 일정</RouterLink>
        <RouterLink to="/map" class="nav-item" active-class="active" @click="closeMenu">지역 지도 보기</RouterLink>
      </nav>
    </div>
    
    <div v-if="isMenuOpen" class="nav-overlay" @click="closeMenu"></div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';

// 모바일 메뉴 오픈 제어 상태 변수
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

// 윈도우 크기가 데스크톱 규격으로 리사이즈되면 모바일 토글 메뉴를 자동으로 닫아주는 방어 로직
const handleResize = () => {
  if (window.innerWidth > 768 && isMenuOpen.value) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
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
  position: relative; /* 모바일 메뉴 포지셔닝 기준축 */
  z-index: 102; /* 햄버거와 헤더 내용이 오버레이 위에 오도록 조정 */
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

/* 🌟 [신규 스타일] 햄버거 버튼 기본 디자인 (데스크톱에서는 숨김) */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 105;
}

.hamburger-btn .bar {
  width: 100%;
  height: 2px;
  background-color: #495057;
  border-radius: 2px;
  transition: all 0.3s ease-in-out;
}

/* 🌟 [신규 스타일] 햄버거 버튼 클릭 시 X자로 변하는 애니메이션 효과 */
.hamburger-btn.is-active .bar:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.hamburger-btn.is-active .bar:nth-child(2) {
  opacity: 0;
}
.hamburger-btn.is-active .bar:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* 🌟 [신규 스타일] 모바일 전용 외부 아웃사이드 클릭용 투명 오버레이 패널 */
.nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.2); /* 은은한 암전 효과 */
  z-index: 101;
}

/* ==========================================
   📱 반응형 미디어 쿼리 (768px 이하 모바일 화면)
   ========================================== */
@media (max-width: 768px) {
  .hamburger-btn {
    display: flex; /* 👈 모바일 화면에서 햄버거 버튼 등장 */
  }

  /* 데스크톱 가로형 배열을 모바일 세로형 드롭다운 메뉴 블록으로 완전 리팩토링 */
  .nav-links {
    position: absolute;
    top: 100%; /* 헤더 바로 아래 배정 */
    left: 0;
    width: 100%;
    background-color: #ffffff;
    border-bottom: 1px solid #e9ecef;
    flex-direction: column;
    gap: 0;
    padding: 10px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    
    /* 기본 상태는 숨김 상태 및 부드러운 슬라이딩 전개 효과 처리 */
    transform: translateY(-20px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.3s ease, opacity 0.3s ease;
    z-index: 103;
  }

  /* 햄버거 토글이 활성화되었을 때 아래로 부드럽게 펼쳐지는 조건 클래스 */
  .nav-links.is-mobile-open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav-item {
    width: 100%;
    padding: 15px 24px;
    font-size: 15px;
    box-sizing: border-box;
    border-bottom: 1px solid #f8f9fa;
  }

  .nav-item:last-child {
    border-bottom: none;
  }

  /* 모바일 환경에서는 언더라인 배지 대신 왼쪽 포인트 컬러 바 또는 전체 컬러링 피드백이 자연스러움 */
  .nav-item.active {
    color: #007bff;
    background-color: #f0f7ff;
    border-bottom: 1px solid #f8f9fa; /* 기존 하단 보더 2px 효과 제거 후 정돈 */
  }
}
</style>