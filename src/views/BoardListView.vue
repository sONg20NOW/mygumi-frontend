<template>
  <div class="board-list-view">
    <div class="breadcrumb">
      <RouterLink to="/" class="breadcrumb-link">홈</RouterLink>
      <span class="divider"> &gt; </span>
      <span class="current-page">게시판</span>
    </div>

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
import api from '@/api/index.js';

const router = useRouter();
const route = useRoute();

// 🌟 [카테고리 개편] 명칭 요구사항 일치화 수정 완료
const categories = [
  { label: '전체', value: 'ALL' },
  { label: '관광지', value: '관광지' },
  { label: '음식점', value: '음식점' },
  { label: '축제공연행사', value: '축제공연행사' }
];

const posts = ref([]);
const isLoading = ref(true);
const error = ref(null);

const currentPage = ref(Number(route.query.page) || 1);
const pageSize = ref(10); 
const totalPages = ref(1);
const selectedCategory = ref(route.query.category || 'ALL');
const searchQuery = ref(route.query.keyword || '');

const bookmarkedIds = ref(JSON.parse(localStorage.getItem('bookmarked_posts') || '[]'));

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

const fetchPosts = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const params = {
      page: currentPage.value,
      size: pageSize.value
    };

    if (selectedCategory.value !== 'ALL') {
      params.category = selectedCategory.value;
    }

    if (searchQuery.value.trim()) {
      params.keyword = searchQuery.value.trim();
    }

    const response = await api.get('/api/posts', { params });

    if (response.data) {
      posts.value = response.data.items || [];
      currentPage.value = response.data.page || 1;
      pageSize.value = response.data.size || 10;
      totalPages.value = response.data.totalPages || Math.ceil((response.data.total || 10) / pageSize.value) || 1;
    }
  } catch (err) {
    console.error('게시글 페치 실패:', err);
    error.value = err.response?.data?.message || '게시글 목록을 로드하는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const syncRouteAndFetch = () => {
  currentPage.value = Number(route.query.page) || 1;
  selectedCategory.value = route.query.category || 'ALL';
  searchQuery.value = route.query.keyword || '';
  fetchPosts();
};

onMounted(() => {
  syncRouteAndFetch();
});

watch(() => route.query, () => {
  syncRouteAndFetch();
}, { deep: true });

const updateRoute = () => {
  const query = {
    page: currentPage.value
  };
  if (selectedCategory.value !== 'ALL') query.category = selectedCategory.value;
  if (searchQuery.value.trim()) query.keyword = searchQuery.value.trim();

  router.push({ path: '/board', query });
};

const filterByCategory = (categoryValue) => {
  selectedCategory.value = categoryValue;
  currentPage.value = 1; 
  updateRoute();
};

const handleSearch = () => {
  currentPage.value = 1; 
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

// 🌟 [카테고리 개편] 클래스 매핑 조건 키 매칭 동기화 수정 완료
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
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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
  display: flex;
  align-items: center;
  gap: 4px;
}
.breadcrumb-link {
  color: #007bff;
  text-decoration: none;
  transition: color 0.15s ease;
}
.breadcrumb-link:hover {
  color: #0056b3;
  text-decoration: underline;
}
.divider {
  color: #adb5bd;
}
.current-page {
  color: #6c757d;
}

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

.loading-state, .error-state, .empty-state {
  padding: 40px;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}
.error-state { color: #dc3545; }

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