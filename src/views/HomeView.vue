<template>
  <div class="home-view">
    <section class="banner-section">
      <div class="banner-glow"></div>
      <div class="banner-content">
        <div class="banner-badge">지역 정보 공유 커뮤니티</div>
        <h1>구미·경북의 숨은 이야기,</h1>
        <span class="brand-text">LocalHub</span>
        <p class="subtitle">관광지, 맛집, 축제까지 한눈에 확인하고 지역 사람들과 함께 나눠보세요.</p>
        <div class="banner-actions">
          <RouterLink to="/board" class="banner-btn primary">게시글 보기</RouterLink>
          <RouterLink to="/map" class="banner-btn secondary">지도 보기</RouterLink>
        </div>
      </div>
    </section>

    <section class="category-section">
      <h2>카테고리 바로가기</h2>
      <div class="category-grid">
        <button @click="navigateToCategory('tour')" class="category-card">
          <span class="icon">🏞️</span>
          <h3>관광지</h3>
          <p>금오산, 벼랑길 등 추천 명소</p>
        </button>
        <button @click="navigateToCategory('restaurant')" class="category-card">
          <span class="icon">🍕</span>
          <h3>맛집</h3>
          <p>지역 주민 인증 로컬 맛집</p>
        </button>
        <button @click="navigateToCategory('festival')" class="category-card">
          <span class="icon">🎉</span>
          <h3>축제·행사</h3>
          <p>이번 달에 열리는 다양한 축제</p>
        </button>
      </div>
    </section>

    <section class="recent-posts-section">
      <div class="section-header">
        <h2>최근 게시글</h2>
        <RouterLink to="/board" class="more-link">전체 보기 →</RouterLink>
      </div>
      
      <div class="posts-table-wrapper">
        <table class="posts-table">
          <thead>
            <tr>
              <th style="width: 15%">카테고리</th>
              <th style="width: 55%">제목</th>
              <th style="width: 15%">작성자</th>
              <th style="width: 15%">작성일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in mockPosts" :key="post.id" @click="goToDetail(post.id)">
              <td>
                <span class="badge" :class="post.categoryKey">{{ post.categoryName }}</span>
              </td>
              <td class="post-title">{{ post.title }}</td>
              <td class="anonymous-user">익명</td>
              <td class="date-col">{{ post.createdAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';

const router = useRouter();

// 의뢰서 요구사항에 맞춘 최근 게시글 목데이터 (Mock Data)
const mockPosts = ref([
  { id: 5, categoryKey: 'tour', categoryName: '관광지', title: '이번 주말에 금오산 둘레길 다녀왔는데 단풍 장난 아니네요!', createdAt: '07.14' },
  { id: 4, categoryKey: 'restaurant', categoryName: '맛집', title: '구미역 뒤쪽에 진짜 숨은 뇨끼 맛집 공유합니다.', createdAt: '07.13' },
  { id: 3, categoryKey: 'festival', categoryName: '축제·행사', title: '경북 지역 야시장 일정 정리본 있으신 분 계신가요?', createdAt: '07.12' },
  { id: 2, categoryKey: 'tour', categoryName: '관광지', title: '가족들이랑 조용하게 힐링하기 좋은 경북 언택트 코스 추천이요', createdAt: '07.10' },
  { id: 1, categoryKey: 'restaurant', categoryName: '맛집', title: '익명 게시판이니까 물어보는데 구미 최고 국밥집 어디임?', createdAt: '07.09' }
]);

// 카테고리 클릭 시 게시판 목록 뷰로 쿼리 스트링을 들고 이동
const navigateToCategory = (categoryType) => {
  router.push({ path: '/board', query: { category: categoryType } });
};

// 상세 페이지 이동
const goToDetail = (id) => {
  router.push(`/board/${id}`);
};
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-bottom: 40px;
}

/* 배너 스타일 */
.banner-section {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f4c81 0%, #1d6fd2 45%, #4f9dff 100%);
  color: white;
  border-radius: 20px;
  padding: 54px 32px;
  text-align: left;
  box-shadow: 0 12px 30px rgba(13, 76, 145, 0.18);
}
.banner-glow {
  position: absolute;
  right: -40px;
  top: -40px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  filter: blur(2px);
}
.banner-content {
  position: relative;
  z-index: 1;
  max-width: 620px;
}
.banner-badge {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: 14px;
  backdrop-filter: blur(4px);
}
.banner-content h1 {
  color: white;
  font-size: 22px;
  margin-bottom: 8px;
  font-weight: 700;
}
.brand-text {
  display: inline-block;
  font-weight: 800;
  font-size: 40px;
  margin-bottom: 10px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.subtitle {
  font-size: 16px;
  line-height: 1.6;
  opacity: 0.95;
  margin-bottom: 22px;
}
.banner-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.banner-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease;
}
.banner-btn:hover {
  transform: translateY(-2px);
}
.banner-btn.primary {
  background: white;
  color: #0f4c81;
}
.banner-btn.secondary {
  background: rgba(255, 255, 255, 0.16);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.28);
}

/* 카테고리 카드 그리드 스타일 */
.category-section h2, .recent-posts-section h2 {
  font-size: 20px;
  color: #212529;
  margin-bottom: 15px;
  font-weight: 600;
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
.category-card {
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}
.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  border-color: #007bff;
}
.category-card .icon {
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
}
.category-card h3 {
  font-size: 18px;
  color: #343a40;
  margin-bottom: 6px;
}
.category-card p {
  font-size: 13px;
  color: #6c757d;
}

/* 게시글 테이블 스타일 */
.recent-posts-section {
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 20px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.section-header h2 {
  margin-bottom: 0;
}
.more-link {
  font-size: 14px;
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}
.posts-table-wrapper {
  overflow-x: auto;
}
.posts-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.posts-table th {
  background-color: #f8f9fa;
  padding: 12px 10px;
  font-size: 14px;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}
.posts-table td {
  padding: 14px 10px;
  font-size: 14px;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
}
.posts-table tr:hover td {
  background-color: #f8f9fa;
}
.post-title {
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.anonymous-user {
  color: #6c757d;
}
.date-col {
  color: #868e96;
}

/* 카테고리 배지 디자인 */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}
.badge.tour { background-color: #e3f2fd; color: #0d47a1; }
.badge.restaurant { background-color: #fff3e0; color: #e65100; }
.badge.festival { background-color: #f3e5f5; color: #4a148c; }
</style>