<template>
  <div class="board-detail-view">
    <div class="breadcrumb">홈 > 게시판 > 상세조회</div>

    <div v-if="post" class="post-container">
      <div class="post-header">
        <span class="badge" :class="post.categoryKey">{{ post.categoryName }}</span>
        <h1 class="post-title">{{ post.title }}</h1>
        
        <div class="post-meta">
          <span class="meta-item">작성자: 익명</span>
          <span class="meta-item">작성일: {{ post.createdAt }}</span>
          <span class="meta-item">👁️ 조회수: {{ post.views }}</span>
          <span class="meta-item">
            <button @click="handleLike" class="like-btn" :class="{ liked: isLiked }">
              ❤️ 좋아요 {{ post.likes }}
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

      <div class="post-tags-container">
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
          <p>게시글 등록 시 설정한 수정용 비밀번호를 입력하세요.</p>
          <input 
            v-model="inputPassword" 
            type="password" 
            placeholder="비밀번호 입력" 
            class="password-input"
            @keyup.enter="submitPassword"
          />
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        </div>
        <div class="modal-footer">
          <button @click="submitPassword" class="modal-submit-btn">확인</button>
          <button @click="closeModal" class="modal-cancel-btn">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const post = ref(null);
const isModalOpen = ref(false);
const modalMode = ref('');
const inputPassword = ref('');
const errorMessage = ref('');
const isLiked = ref(false);

const mockPostsDetails = [
  { id: 5, categoryKey: 'tour', categoryName: '관광지', title: '이번 주말에 금오산 둘레길 다녀왔는데 단풍 장난 아니네요!', content: '오랜만에 주말을 맞아 가족들과 구미 금오산 둘레길에 다녀왔습니다. 날씨도 선선하고 단풍이 예쁘게 물들어서 산책하기 딱 좋더라고요. 주차장이 조금 협소하긴 하지만 주말 나들이 코스로 강력 추천합니다! 다들 이번 주말에 꼭 가보세요.', views: 95, likes: 18, tags: ['금오산', '단풍', '나들이'], imageUrl: 'https://picsum.photos/600/300', password: '1234', createdAt: '2026.07.14 10:30' },
  { id: 4, categoryKey: 'restaurant', categoryName: '맛집', title: '구미역 뒤쪽에 진짜 숨은 뇨끼 맛집 공유합니다.', content: '금오산 가는 길 골목에 새로 오픈한 양식당인데, 감자 뇨끼가 정말 쫀득하고 크림 소스가 진해서 감동받았습니다. 분위기도 아늑해서 데이트 코스로 좋을 것 같아요. 매장이 좁으니 주말엔 예약 방문을 권장합니다.', views: 210, likes: 32, tags: ['금리단길', '뇨끼', '맛집'], imageUrl: '', password: '5678', createdAt: '2026.07.13 14:20' }
];

onMounted(() => {
  const postId = parseInt(route.params.id);
  const foundPost = mockPostsDetails.find(p => p.id === postId);
  
  if (foundPost) {
    post.value = foundPost;
    post.value.views += 1; // 상세에 유입되었으므로 조회수 1 증가 (추가 기능 가상화)
  }
});

const handleLike = () => {
  if (isLiked.value) {
    post.value.likes -= 1;
    isLiked.value = false;
  } else {
    post.value.likes += 1;
    isLiked.value = true;
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

const submitPassword = () => {
  if (inputPassword.value === post.value.password) {
    closeModal();
    if (modalMode.value === 'edit') {
      router.push(`/board/edit/${post.value.id}`);
    } else {
      alert('게시글이 삭제되었습니다.');
      goToList();
    }
  } else {
    errorMessage.value = '비밀번호가 틀렸습니다.';
  }
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
.like-btn {
  background: none;
  border: 1px solid #ffcccb;
  color: #dc3545;
  padding: 4px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
}
.like-btn.liked {
  background-color: #dc3545;
  color: white;
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

/* 모달 */
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
.modal-cancel-btn { padding: 8px 16px; background-color: #e9ecef; color: #495057; border: none; border-radius: 4px; cursor: pointer; }

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.badge.tour { background-color: #e3f2fd; color: #0d47a1; }
.badge.restaurant { background-color: #fff3e0; color: #e65100; }
</style>