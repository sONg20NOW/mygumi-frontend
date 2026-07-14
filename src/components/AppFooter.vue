<template>
  <footer class="app-footer">
    <div class="footer-container">
      <p class="copyright">© 2026 LocalHub. All rights reserved.</p>
      <p class="data-source">
        본 서비스는 공공데이터포털에서 제공하는 <strong>구미/경북 권역 공공데이터</strong>를 사전 가공하여 활용하고 있으며, 
        각 데이터는 공공누리(KOGL) 유형 및 개별 출처 라이선스를 준수합니다.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: #343a40;
  color: #adb5bd;
  padding: 20px;
  font-size: 14px;
  margin-top: auto; /* 하단 밀착 고정 */
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.copyright {
  font-weight: 500;
}

.data-source {
  font-size: 12px;
  color: #868e96;
  line-height: 1.5;
}
</style>