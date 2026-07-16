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
        <button @click="navigateToCategory('관광지')" class="category-card">
          <span class="icon">🏞️</span>
          <h3>관광지</h3>
          <p>금오산, 벼랑길 등 추천 명소</p>
        </button>
        <button @click="navigateToCategory('음식점')" class="category-card">
          <span class="icon">🍕</span>
          <h3>음식점</h3>
          <p>지역 주민 인증 로컬 맛집</p>
        </button>
        <button @click="navigateToCategory('축제공연행사')" class="category-card">
          <span class="icon">🎉</span>
          <h3>축제공연행사</h3>
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
        <div v-if="isLoading" class="loading-state">게시글을 불러오는 중입니다...</div>
        
        <div v-else-if="error" class="error-state">{{ error }}</div>
        
        <div v-else-if="posts.length === 0" class="empty-state">최근 등록된 게시글이 없습니다.</div>

        <table v-else class="posts-table">
          <thead>
            <tr>
              <th class="th-cat">카테고리</th>
              <th class="th-title">제목</th>
              <th class="th-views">조회수</th>
              <th class="th-likes">좋아요</th>
              <th class="th-date">작성일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post.id" @click="goToDetail(post.id)">
              <td class="td-cat">
                <span class="badge" :class="getCategoryClass(post.category)">{{ post.category }}</span>
              </td>
              <td class="td-title">
                <div class="title-container">
                  <div v-if="post.thumbnailUrl" class="thumbnail-wrapper">
                    <img :src="getFullImageUrl(post.thumbnailUrl)" alt="썸네일" class="list-thumb-img" />
                  </div>
                  
                  <span class="title-text">{{ post.title }}</span>
                  
                  <div v-if="post.tags && post.tags.length" class="tag-list-inline">
                    <span v-for="tag in post.tags" :key="tag" class="inline-tag">#{{ tag }}</span>
                  </div>
                </div>
              </td>
              <td class="td-views">{{ post.viewCount }}</td>
              <td class="td-likes">❤️ {{ post.likeCount }}</td>
              <td class="date-col">{{ formatDate(post.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '@/api/index.js'; 
const router = useRouter(); 

const posts = ref([]); 
const isLoading = ref(true); 
const error = ref(null); 

const getFullImageUrl = (urlPath) => {
  if (!urlPath) return '';
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    return urlPath;
  }
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${cleanBase}${cleanPath}`;
};

const fetchRecentPosts = async () => {
  try {
    isLoading.value = true; 
    error.value = null; 
    
    const response = await api.get('/api/posts', {
      params: {
        page: 1,
        size: 5
      }
    });

    if (response.data && response.data.items) {
      posts.value = response.data.items; 
    }
  } catch (err) {
    console.error('게시글 목록 로드 실패:', err); 
    error.value = err.response?.data?.message || '게시글을 불러오는데 실패했습니다.'; 
  } finally {
    isLoading.value = false; 
  }
};

onMounted(() => {
  fetchRecentPosts(); 
});

// 🌟 [색상 통일 개편] 신규 규격 명칭 매핑 동기화
const getCategoryClass = (categoryName) => {
  switch (categoryName) {
    case '관광지': return 'tour'; 
    case '음식점': return 'restaurant'; 
    case '축제공연행사': return 'festival'; 
    default: return 'default'; 
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${month}-${day}`;
};

const navigateToCategory = (categoryName) => {
  router.push({ path: '/board', query: { category: categoryName } }); 
};

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

/* 게시글 테이블 스타일 고도화 */
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

.th-cat { width: 15%; }
.th-title { width: 55%; }
.th-views { width: 10%; text-align: center; }
.th-likes { width: 10%; text-align: center; }
.th-date { width: 10%; text-align: center; }

.td-cat {
  vertical-align: middle;
}
.td-views {
  text-align: center;
  color: #6c757d;
  vertical-align: middle;
}
.td-likes {
  text-align: center;
  color: #dc3545;
  vertical-align: middle;
}
.date-col {
  text-align: center;
  color: #868e96;
  vertical-align: middle;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.title-text {
  color: #333;
  font-weight: 500;
}
.posts-table tr:hover .title-text {
  color: #007bff;
  text-decoration: underline;
}
.image-clip-icon {
  font-size: 14px;
}

.thumbnail-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}
.list-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tag-list-inline {
  display: flex;
  gap: 4px;
}
.inline-tag {
  font-size: 11px;
  color: #007bff;
  background-color: #e8f4ff;
  padding: 2px 5px;
  border-radius: 3px;
}

.loading-state, .error-state, .empty-state {
  padding: 30px;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}
.error-state {
  color: #dc3545;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}
/* 🌟 [색상 통일 개편] BoardListView 스타일 시트와 색상 코드 매핑 완전 동기화 */
.badge.tour { background-color: #e3f2fd; color: #0d47a1; }
.badge.restaurant { background-color: #fff3e0; color: #e65100; }
.badge.festival { background-color: #f3e5f5; color: #4a148c; }
.badge.default { background-color: #e2e8f0; color: #475569; }
</style>