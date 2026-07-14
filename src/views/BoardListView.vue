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
          placeholder="제목, 내용 또는 태그(#태그명)로 검색하세요..." 
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
      <table class="board-table">
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
          <tr 
            v-for="post in filteredPosts" 
            :key="post.id" 
            @click="goToDetail(post.id)"
            class="post-row"
          >
            <td class="td-bookmark" @click.stop="toggleBookmark(post.id)">
              <span class="star-icon" :class="{ bookmarked: bookmarkedIds.includes(post.id) }">
                {{ bookmarkedIds.includes(post.id) ? '★' : '☆' }}
              </span>
            </td>
            <td class="td-num">{{ post.id }}</td>
            <td>
              <span class="badge" :class="post.categoryKey">{{ post.categoryName }}</span>
            </td>
            <td class="td-title">
              <div class="title-container">
                <span v-if="post.imageUrl" class="image-clip-icon">🖼️</span>
                <span class="title-text">{{ post.title }}</span>
                <div class="tag-list-inline">
                  <span v-for="tag in post.tags" :key="tag" class="inline-tag">#{{ tag }}</span>
                </div>
              </div>
            </td>
            <td class="td-views">👁️ {{ post.views }}</td>
            <td class="td-likes">❤️ {{ post.likes }}</td>
            <td class="td-date">{{ post.createdAt }}</td>
          </tr>
          <tr v-if="filteredPosts.length === 0">
            <td colspan="7" class="no-data">등록된 게시글이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button class="page-btn" disabled>&lt;</button>
      <button class="page-btn active">1</button>
      <button class="page-btn" disabled>&gt;</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';

const router = useRouter();
const route = useRoute();

const searchQuery = ref('');
const selectedCategory = ref('all');

// 개인별 브라우저 저장소(localStorage) 기반 북마크 리스트 관리
const bookmarkedIds = ref([]);

const categories = [
  { label: '전체보기', value: 'all' },
  { label: '관광지', value: 'tour' },
  { label: '맛집', value: 'restaurant' },
  { label: '축제·행사', value: 'festival' }
];

const mockPosts = ref([
  { id: 7, categoryKey: 'tour', categoryName: '관광지', title: '구미 금오산 잔도길 유모차 진입 질문', views: 42, likes: 5, tags: ['금오산', '유모차', '잔도길'], imageUrl: '', createdAt: '07.14' },
  { id: 6, categoryKey: 'festival', categoryName: '축제·행사', title: '2026 경북 여름 축제 일정 총정리 캘린더', views: 128, likes: 24, tags: ['축제', '경북', '캘린더'], imageUrl: 'https://picsum.photos/100/100', createdAt: '07.14' },
  { id: 5, categoryKey: 'tour', categoryName: '관광지', title: '이번 주말에 금오산 둘레길 다녀왔는데 단풍 장난 아니네요!', views: 95, likes: 18, tags: ['금오산', '단풍', '나들이'], imageUrl: 'https://picsum.photos/100/100', createdAt: '07.14' },
  { id: 4, categoryKey: 'restaurant', categoryName: '맛집', title: '구미역 뒤쪽에 진짜 숨은 뇨끼 맛집 공유합니다.', views: 210, likes: 32, tags: ['금리단길', '뇨끼', '맛집'], imageUrl: '', createdAt: '07.13' },
  { id: 3, categoryKey: 'festival', categoryName: '축제·행사', title: '경북 지역 야시장 일정 정리본 있으신 분 계신가요?', views: 76, likes: 3, tags: ['야시장', '경북', '정보공유'], imageUrl: '', createdAt: '07.12' }
]);

// 앱 마운트 시 localStorage에서 북마크 내역 불러오기
onMounted(() => {
  if (route.query.category) {
    selectedCategory.value = route.query.category;
  }
  
  const savedBookmarks = localStorage.getItem('localhub_bookmarks');
  if (savedBookmarks) {
    bookmarkedIds.value = JSON.parse(savedBookmarks);
  }
});

const filterByCategory = (categoryValue) => {
  selectedCategory.value = categoryValue;
  router.push({ path: '/board', query: categoryValue === 'all' ? {} : { category: categoryValue } });
};

// 🌟 localStorage 연동 북마크 토글 및 동기화 저장 함수
const toggleBookmark = (id) => {
  const index = bookmarkedIds.value.indexOf(id);
  if (index > -1) {
    bookmarkedIds.value.splice(index, 1);
  } else {
    bookmarkedIds.value.push(id);
  }
  // 로컬스토리지에 변경된 배열 동기화
  localStorage.setItem('localhub_bookmarks', JSON.stringify(bookmarkedIds.value));
};

const goToDetail = (id) => {
  router.push(`/board/${id}`);
};

// 카테고리 및 검색 조건만 반영한 필터링 연산 (북마크 필터 제외)
const filteredPosts = computed(() => {
  return mockPosts.value.filter(post => {
    // 1. 카테고리 필터
    const matchesCategory = selectedCategory.value === 'all' || post.categoryKey === selectedCategory.value;
    
    // 2. 검색어 필터
    const query = searchQuery.value.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      if (query.startsWith('#')) {
        const tagQuery = query.substring(1);
        matchesSearch = post.tags.some(tag => tag.toLowerCase().includes(tagQuery));
      } else {
        matchesSearch = post.title.toLowerCase().includes(query) || 
                        post.tags.some(tag => tag.toLowerCase().includes(query));
      }
    }

    return matchesCategory && matchesSearch;
  });
});
</script>

<style scoped>
.board-list-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.breadcrumb {
  font-size: 14px;
  color: #6c757d;
}
.category-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 10px;
}
.tab-btn {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #495057;
  padding: 8px 16px;
  cursor: pointer;
}
.tab-btn.active {
  color: #007bff;
  font-weight: bold;
  border-bottom: 3px solid #007bff;
  margin-bottom: -13px;
}

.board-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}
.search-box {
  display: flex;
  flex-grow: 1;
  max-width: 500px;
}
.search-input {
  flex-grow: 1;
  padding: 10px 14px;
  border: 1px solid #ced4da;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
  outline: none;
}
.search-btn {
  padding: 0 20px;
  background-color: #333333;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}
.action-right {
  display: flex;
  gap: 10px;
}
.write-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

.table-wrapper {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}
.board-table {
  width: 100%;
  border-collapse: collapse;
}
.board-table th {
  background-color: #f8f9fa;
  padding: 12px;
  font-size: 14px;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}
.board-table td {
  padding: 14px 12px;
  font-size: 14px;
  border-bottom: 1px solid #eff2f5;
}
.post-row {
  cursor: pointer;
}
.post-row:hover {
  background-color: #f8f9fa;
}

.th-bookmark, .td-bookmark { width: 6%; text-align: center; }
.th-num, .td-num { width: 8%; text-align: center; color: #6c757d; }
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
  gap: 6px;
  flex-wrap: wrap;
}
.image-clip-icon {
  font-size: 14px;
}
.title-text {
  font-weight: 500;
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

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.badge.tour { background-color: #e3f2fd; color: #0d47a1; }
.badge.restaurant { background-color: #fff3e0; color: #e65100; }
.badge.festival { background-color: #f3e5f5; color: #4a148c; }

.no-data {
  text-align: center;
  padding: 40px !important;
  color: #868e96;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 5px;
}
.page-btn {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background-color: white;
  cursor: pointer;
  border-radius: 4px;
}
.page-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}
</style>