<template>
  <div class="board-detail-view">
    <div class="breadcrumb">
      <RouterLink to="/" class="breadcrumb-link">홈</RouterLink>
      <span class="divider"> &gt; </span>
      <RouterLink to="/board" class="breadcrumb-link">게시판</RouterLink>
      <span class="divider"> &gt; </span>
      <span class="current-page">상세조회</span>
    </div>

    <div v-if="isLoading" class="loading-state">게시글을 불러오는 중입니다...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else-if="post" class="post-container">
      <div class="post-header">
        <span class="badge" :class="getCategoryClass(post.category)">{{ post.category }}</span>
        <h1 class="post-title">{{ post.title }}</h1>
        
        <div class="post-meta">
          <span class="meta-item">작성자: 익명</span>
          <span class="meta-item">작성일: {{ formatDate(post.createdAt) }}</span>
          <span class="meta-item">👁️ 조회수: {{ post.viewCount }}</span>
          <span class="meta-item">
            <button 
              ref="likeButtonRef"
              @click="handleLike" 
              class="like-btn" 
              :class="{ liked: isLiked, 'pop-animation': isPopAnimating }"
            >
              ❤️ 좋아요 {{ post.likeCount }}
            </button>
          </span>
        </div>
      </div>

      <div class="post-body">
        <div v-if="post.imageUrl" class="attached-image-container">
          <img :src="post.imageUrl" alt="첨부 이미지" class="attached-image" />
        </div>
        <div class="post-content">
          {{ post.content }}
        </div>
      </div>

      <div v-if="post.tags && post.tags.length" class="post-tags-container">
        <span v-for="tag in post.tags" :key="tag" class="detail-tag">#{{ tag }}</span>
      </div>

      <div class="post-actions">
        <button @click="openModal('edit')" class="action-btn edit-btn">수정</button>
        <button @click="openModal('delete')" class="action-btn delete-btn">삭제</button>
        <button @click="goToList" class="action-btn list-btn">목록으로</button>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal-window">
        <div class="modal-header">
          <h3>비밀번호 확인</h3>
          <button @click="closeModal" class="close-x-btn">✕</button>
        </div>
        <div class="modal-body">
          <p>게시글 등록 시 설정한 비밀번호를 입력하세요.</p>
          <input 
            v-model="inputPassword" 
            type="password" 
            placeholder="비밀번호 입력" 
            class="password-input"
            @keyup.enter="submitPassword"
            :disabled="isSubmitting"
          />
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="submitPassword" class="modal-submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? '처리 중...' : '확인' }}
          </button>
          <button @click="closeModal" class="modal-cancel-btn" :disabled="isSubmitting">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import api from '@/api/index.js';

const router = useRouter();
const route = useRoute();

const post = ref(null);
const isLoading = ref(true);
const error = ref(null);

const isModalOpen = ref(false);
const modalMode = ref('');
const inputPassword = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const isLiked = ref(false);

// 🌟 애니메이션용 상태 변수 및 DOM 참조 관리
const isPopAnimating = ref(false);
const likeButtonRef = ref(null);

onMounted(() => {
  fetchPostDetail();
});

// [2번 API] 게시글 상세 조회
const fetchPostDetail = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    const postId = route.params.id;

    const response = await api.get(`/api/posts/${postId}`);
    if (response.data) {
      post.value = response.data;
    }
  } catch (err) {
    console.error('게시글 상세 조회 실패:', err);
    error.value = err.response?.data?.message || '존재하지 않거나 삭제된 게시글입니다.';
  } finally {
    isLoading.value = false;
  }
};

// 🌟 파핑 하트 요소 생성 헬퍼 함수
const createFloatingHeart = (buttonEl) => {
  if (!buttonEl) return;
  
  const rect = buttonEl.getBoundingClientRect();
  
  // 버튼 주위에서 튀어나올 하트 4개 임의 생성
  for (let i = 0; i < 4; i++) {
    const heart = document.createElement('span');
    heart.innerText = '❤️';
    heart.className = 'floating-heart-particle';
    
    // 버튼의 중앙 상단 부근을 타겟 좌표로 시작점 계산
    const startX = window.scrollX + rect.left + rect.width / 2;
    const startY = window.scrollY + rect.top;
    
    // 랜덤한 분산 궤적 값 설정
    const moveX = (Math.random() - 0.5) * 60; // 좌우 분산 범위
    const moveY = -(Math.random() * 40 + 40);   // 위로 솟구치는 범위
    
    heart.style.left = `${startX}px`;
    heart.style.top = `${startY}px`;
    heart.style.setProperty('--move-x', `${moveX}px`);
    heart.style.setProperty('--move-y', `${moveY}px`);
    
    document.body.appendChild(heart);
    
    // 애니메이션이 끝나면 DOM에서 확실하게 제거 (메모리 누수 방지)
    setTimeout(() => {
      heart.remove();
    }, 800);
  }
};

// ⭐ [9번 API] 게시글 좋아요 증가
const handleLike = async () => {
  if (!post.value) return;

  try {
    // 🌟 버튼 통통 튀는 애니메이션 실행 및 하트 파티 이펙트 트리거
    isPopAnimating.value = true;
    createFloatingHeart(likeButtonRef.value);
    setTimeout(() => {
      isPopAnimating.value = false;
    }, 300);

    const response = await api.post(`/api/posts/${post.value.id}/likes`);
    
    // 🌟 [수정 사항] response.data.likeCount에서 명세서 변경 스펙인 "like_count"로 필칭 매핑 변경
    if (response.data && typeof response.data.like_count === 'number') {
      post.value.likeCount = response.data.like_count;
      isLiked.value = true;
    }
  } catch (err) {
    console.error('좋아요 반영 실패:', err);
    alert('좋아요 처리에 실패했습니다.');
  }
};

const goToList = () => {
  router.push('/board');
};

const openModal = (mode) => {
  modalMode.value = mode;
  isModalOpen.value = true;
  inputPassword.value = '';
  errorMessage.value = '';
};

const closeModal = () => {
  isModalOpen.value = false;
};

const submitPassword = async () => {
  if (!inputPassword.value.trim()) {
    errorMessage.value = '비밀번호를 입력해 주세요.';
    return;
  }

  if (modalMode.value === 'edit') {
    closeModal();
    router.push({
      path: `/board/edit/${post.value.id}`,
      state: { verifyPassword: inputPassword.value }
    });
  } else if (modalMode.value === 'delete') {
    try {
      isSubmitting.value = true;
      errorMessage.value = '';

      await api.delete(`/api/posts/${post.value.id}`, {
        data: { password: inputPassword.value }
      });

      alert('게시글이 삭제되었습니다.');
      closeModal();
      goToList();
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      if (err.response?.status === 403) {
        errorMessage.value = '비밀번호가 일치하지 않습니다.';
      } else {
        errorMessage.value = err.response?.data?.message || '삭제 도중 오류가 발생했습니다.';
      }
    } finally {
      isSubmitting.value = false;
    }
  }
};

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
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
};
</script>

<style scoped>
.board-detail-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.breadcrumb {
  font-size: 14px;
  color: #6c757d;
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

.post-container {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 25px;
}
.post-header {
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 15px;
  margin-bottom: 20px;
}
.post-title {
  font-size: 24px;
  color: #212529;
  margin: 10px 0;
}
.post-meta {
  font-size: 13px;
  color: #6c757d;
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 🌟 좋아요 버튼 및 통통 애니메이션 스타일 */
.like-btn {
  position: relative;
  background: none;
  border: 1px solid #ffcccb;
  color: #dc3545;
  padding: 4px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.1s ease, background-color 0.2s, color 0.2s;
}
.like-btn.liked {
  background-color: #dc3545;
  color: white;
}
.like-btn:hover {
  transform: scale(1.05);
}
.like-btn:active {
  transform: scale(0.95);
}
/* 클릭했을 때 살짝 확대됐다가 돌아오는 바운스 효과 */
.like-btn.pop-animation {
  animation: buttonBounce 0.3s ease-in-out;
}

@keyframes buttonBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1.05); }
}

.post-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.attached-image-container {
  max-width: 100%;
  border-radius: 8px;
  overflow: hidden;
}
.attached-image {
  max-width: 100%;
  height: auto;
  display: block;
}
.post-content {
  font-size: 16px;
  line-height: 1.6;
  color: #495057;
  white-space: pre-wrap;
}

.post-tags-container {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}
.detail-tag {
  font-size: 13px;
  color: #007bff;
  background-color: #e8f4ff;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.post-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
  margin-top: 20px;
}
.action-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
.edit-btn { background-color: #ffc107; color: #212529; }
.delete-btn { background-color: #dc3545; color: white; }
.list-btn { background-color: #6c757d; color: white; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 2000;
}
.modal-window {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}
.modal-header {
  background-color: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
  display: flex; justify-content: space-between; align-items: center;
}
.close-x-btn { background: none; border: none; font-size: 16px; cursor: pointer; }
.modal-body {
  padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.password-input {
  width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px;
}
.error-msg { color: #dc3545; font-size: 12px; }
.modal-footer {
  padding: 12px 20px; background-color: #f8f9fa; border-top: 1px solid #dee2e6;
  display: flex; justify-content: flex-end; gap: 8px;
}
.modal-submit-btn { padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
.modal-cancel-btn { padding: 8px 16px; background-color: #e9ecef; color: #495057; }

.loading-state, .error-state {
  text-align: center;
  padding: 50px;
  color: #6c757d;
  font-size: 15px;
}
.error-state {
  color: #dc3545;
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
.badge.default { background-color: #e2e8f0; color: #475569; }
</style>

<style>
.floating-heart-particle {
  position: absolute;
  font-size: 16px;
  pointer-events: none; /* 마우스 클릭 인터셉트 방지 */
  animation: heartFloatUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  z-index: 9999;
}

@keyframes heartFloatUp {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }
  50% {
    transform: translate(calc(-50% + var(--move-x) * 0.6), calc(-50% + var(--move-y) * 0.6)) scale(1.3);
    opacity: 0.9;
  }
  100% {
    transform: translate(calc(-50% + var(--move-x)), calc(-50% + var(--move-y))) scale(0.8);
    opacity: 0;
  }
}
</style>