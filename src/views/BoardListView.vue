<template>
  <div class="board-list-view">
    <div class="breadcrumb">홈 > 게시판</div>

    <div class="category-tabs">
      <button 
        v-for="tab in categories" 
        :key="tab.value"
        :class="['tab-btn', { active: selectedCategory === tab.value }]"
        @click="filterByCategory(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="board-actions">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="제목과 내용으로 검색하세요..." 
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="search-btn">검색</button>
      </div>
      
      <div class="action-right">
        <RouterLink to="/board/write" class="write-btn">+ 글쓰기</RouterLink>
      </div>
    </div>

    <div class="table-wrapper">
      <div v-if="isLoading" class="loading-state">게시글 목록을 불러오는 중입니다...</div>
      <div v-else-if="error" class="error-state">{{ error }}</div>
      <div v-else-if="posts.length === 0" class="empty-state">조회된 게시글이 없습니다.</div>

      <table v-else class="board-table">
        <thead>
          <tr>
            <th class="th-bookmark">북마크</th>
            <th class="th-num">번호</th>
            <th class="th-cat">카테고리</th>
            <th class="th-title">제목</th>
            <th class="th-views">조회수</th>
            <th class="th-likes">좋아요</th>
            <th class="th-date">작성일</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td class="td-bookmark" @click.stop="toggleBookmark(post.id)">
              <span :class="['star-icon', { bookmarked: isBookmarked(post.id) }]">★</span>
            </td>
            <td class="td-num">{{ post.id }}</td>
            <td class="td-cat">
              <span class="badge" :class="getCategoryClass(post.category)">{{ post.category }}</span>
            </td>
            <td class="td-title" @click="goToDetail(post.id)">
              <div class="title-container">
                <span v-if="post.thumbnailUrl" class="image-clip-icon">🖼️</span>
                <span class="title-text">{{ post.title }}</span>
                <div v-if="post.tags && post.tags.length" class="tag-list-inline">
                  <span v-for="tag in post.tags" :key="tag" class="inline-tag">#{{ tag }}</span>
                </div>
              </div>
            </td>
            <td class="td-views">{{ post.viewCount }}</td>
            <td class="td-likes">❤️ {{ post.likeCount }}</td>
            <td class="td-date">{{ formatDate(post.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 0" class="pagination">
      <button 
        class="page-btn prev" 
        :disabled="currentPage === 1" 
        @click="changePage(currentPage - 1)"
      >
        &lt; 이전
      </button>
      
      <button 
        v-for="page in totalPages" 
        :key="page"
        :class="['page-btn', { active: currentPage === page }]"
        @click="changePage(page)"
      >
        {{ page }}
      </button>
      
      <button 
        class="page-btn next" 
        :disabled="currentPage === totalPages" 
        @click="changePage(currentPage + 1)"
      >
        다음 &gt;
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import api from '@/api/index.js'; // ⭕ axios 대신 공통 api 인스턴스 사용

const router = useRouter();
const route = useRoute();

// 카테고리 설정 정의 (명세서 1번의 한글 카테고리 기준 매핑)
const categories = [
  { label: '전체', value: 'ALL' },
  { label: '관광지', value: '관광지' },
  { label: '맛집', value: '맛집' },
  { label: '축제·행사', value: '축제·행사' }
];

// 상태 데이터 변수
const posts = ref([]);
const isLoading = ref(true);
const error = ref(null);

// 페이징 및 동적 쿼리 관련 변수
const currentPage = ref(Number(route.query.page) || 1);
const pageSize = ref(10); // 한 페이지당 10개 고정
const totalPages = ref(1);
const selectedCategory = ref(route.query.category || 'ALL');
const searchQuery = ref(route.query.keyword || '');

// 북마크 로컬 스토리지 배열
const bookmarkedIds = ref(JSON.parse(localStorage.getItem('bookmarked_posts') || '[]'));

// 1번 API 호출 로직 (목록 조회)
const fetchPosts = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // API 요청 매개변수 빌드
    const params = {
      page: currentPage.value,
      size: pageSize.value
    };

    // 카테고리가 전체('ALL')가 아니면 명세서대로 필터 추가
    if (selectedCategory.value !== 'ALL') {
      params.category = selectedCategory.value;
    }

    // 검색어가 존재하면 키워드 필터 추가
    if (searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim();
    }

    // GET /api/posts 호출
    const response = await api.get('/api/posts', { params });

    if (response.data) {
      posts.value = response.data.items || [];
      currentPage.value = response.data.page || 1;
      pageSize.value = response.data.size || 10;
      
      // 전체 페이지 수 산출 (백엔드 총 개수가 응답에 온다면 변환 가능, 명세서 규격에 맞게 유연하게 처리)
      // 명세서 예시 응답 구조에 총 페이지(totalPages) 등이 포함되어 있다고 가정하거나 
      // 예시 스펙을 기반으로 백엔드에서 반환하는 totalPages 값을 할당합니다.
      totalPages.value = response.data.totalPages || Math.ceil((response.data.total || 10) / pageSize.value) || 1;
    }
  } catch (err) {
    console.error('게시글 페치 실패:', err);
    error.value = err.response?.data?.message || '게시글 목록을 로드하는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

// URL 쿼리가 바뀔 때 화면 상태를 동기화하고 API를 호출하는 함수
const syncRouteAndFetch = () => {
  currentPage.value = Number(route.query.page) || 1;
  selectedCategory.value = route.query.category || 'ALL';
  searchQuery.value = route.query.keyword || '';
  fetchPosts();
};

// 컴포넌트 마운트 및 라우터 쿼리 변경 실시간 감시(Watch)
onMounted(() => {
  syncRouteAndFetch();
});

watch(() => route.query, () => {
  syncRouteAndFetch();
}, { deep: true });

// URL 라우터 푸시를 통해 상태 제어 (히스토리 뒤로가기 완벽 지원)
const updateRoute = () => {
  const query = {
    page: currentPage.value
  };
  if (selectedCategory.value !== 'ALL') query.category = selectedCategory.value;
  if (searchQuery.value.trim()) query.keyword = searchQuery.value.trim();

  router.push({ path: '/board', query });
};

// 액션 이벤트 핸들러들
const filterByCategory = (categoryValue) => {
  selectedCategory.value = categoryValue;
  currentPage.value = 1; // 카테고리 변경 시 1페이지로 복귀
  updateRoute();
};

const handleSearch = () => {
  currentPage.value = 1; // 검색 시 1페이지로 복귀
  updateRoute();
};

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  updateRoute();
};

const goToDetail = (id) => {
  router.push(`/board/${id}`);
};

// 유틸리티 함수 (CSS 스타일 클래스 지정 및 날짜 포맷팅)
const getCategoryClass = (categoryName) => {
  switch (categoryName) {
    case '관광지': return 'tour';
    case '맛집': return 'restaurant';
    case '축제·행사': return 'festival';
    default: return 'default';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// 북마크 로컬 스토리지 제어 기능
const isBookmarked = (id) => bookmarkedIds.value.includes(id);

const toggleBookmark = (id) => {
  if (isBookmarked(id)) {
    bookmarkedIds.value = bookmarkedIds.value.filter(bId => bId !== id);
  } else {
    bookmarkedIds.value.push(id);
  }
  localStorage.setItem('bookmarked_posts', JSON.stringify(bookmarkedIds.value));
};
</script>

<style scoped>
.board-list-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 10px;
}

.breadcrumb {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 20px;
}

/* 카테고리 탭 디자인 */
.category-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 0;
  margin-bottom: 20px;
}
.tab-btn {
  background: none;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  position: relative;
  bottom: -2px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}
.tab-btn:hover {
  color: #007bff;
}
.tab-btn.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  font-weight: bold;
}

/* 액션 바 스타일 */
.board-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  gap: 15px;
  flex-wrap: wrap;
}
.search-box {
  display: flex;
  gap: 6px;
  flex: 1;
  max-width: 450px;
}
.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}
.search-btn {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.search-btn:hover {
  background-color: #5a6268;
}
.write-btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}
.write-btn:hover {
  background-color: #0069d9;
}

/* 테이블 레이아웃 및 스타일 */
.table-wrapper {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}
.board-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.board-table th {
  background-color: #f8f9fa;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}
.board-table td {
  padding: 14px 12px;
  font-size: 14px;
  border-bottom: 1px solid #efefef;
}
.board-table tbody tr:hover td {
  background-color: #f8f9fa;
}

/* 테이블 열 정밀 너비 배정 */
.th-bookmark { width: 8%; text-align: center; }
.td-bookmark { text-align: center; }
.th-num { width: 8%; text-align: center; }
.td-num { text-align: center; color: #6c757d; }
.th-cat { width: 12%; }
.th-title { width: 45%; }
.th-views, .td-views { width: 10%; text-align: center; color: #6c757d; }
.th-likes, .td-likes { width: 10%; text-align: center; color: #dc3545; }
.th-date, .td-date { width: 10%; text-align: center; color: #868e96; }

.star-icon {
  font-size: 18px;
  color: #ced4da;
  cursor: pointer;
}
.star-icon.bookmarked {
  color: #ffc107;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.td-title {
  cursor: pointer;
}
.td-title:hover .title-text {
  color: #007bff;
  text-decoration: underline;
}
.image-clip-icon {
  font-size: 14px;
}
.title-text {
  font-weight: 500;
  color: #212529;
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

/* 데이터 흐름용 컴포넌트 처리 상태 */
.loading-state, .error-state, .empty-state {
  padding: 40px;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}
.error-state { color: #dc3545; }

/* 카테고리 디자인 배지 */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.badge.tour { background-color: #e3f2fd; color: #0d47a1; }
.badge.restaurant { background-color: #fff3e0; color: #e65100; }
.badge.festival { background-color: #f3e5f5; color: #4a148c; }
.badge.default { background-color: #e2e8f0; color: #475569; }

/* 페이지네이션 버튼 가로 뭉치 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
}
.page-btn {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #007bff;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}
.page-btn:hover:not(:disabled) {
  background-color: #e9ecef;
}
.page-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
  font-weight: bold;
}
.page-btn:disabled {
  color: #6c757d;
  background-color: #f8f9fa;
  cursor: not-allowed;
  border-color: #dee2e6;
}
</style>