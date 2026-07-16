<template>
  <div class="board-write-view">
    <div class="breadcrumb">
      <RouterLink to="/" class="breadcrumb-link">홈</RouterLink>
      <span class="divider"> &gt; </span>
      <RouterLink to="/board" class="breadcrumb-link">게시판</RouterLink>
      <span class="divider"> &gt; </span>
      <span class="current-page">{{ isEditMode ? '글수정' : '글쓰기' }}</span>
    </div>

    <div v-if="isInitialLoading" class="loading-state">
      게시글 정보를 불러오는 중입니다...
    </div>

    <div v-else class="form-container">
      <h2 class="form-title">
        {{ isEditMode ? '게시글 수정' : '게시글 작성' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="write-form">
        <div class="form-group">
          <label for="category" class="form-label">카테고리</label>
          <select id="category" v-model="formData.category" class="form-select" required>
            <option value="" disabled>카테고리를 선택하세요</option>
            <option value="관광지">관광지</option>
            <option value="음식점">음식점</option>
            <option value="축제공연행사">축제공연행사</option>
          </select>
        </div>

        <div class="form-group">
          <label for="title" class="form-label">제목</label>
          <input id="title" v-model="formData.title" type="text" placeholder="제목을 입력하세요" class="form-input" required />
        </div>

        <div class="form-group">
          <label for="content" class="form-label">내용</label>
          <textarea id="content" v-model="formData.content" placeholder="내용을 입력하세요" class="form-textarea" required></textarea>
        </div>

        <div class="form-group">
          <label for="tags" class="form-label">태그 (쉼표나 엔터로 구분)</label>
          <input 
            id="tags" 
            v-model="tagInput" 
            type="text" 
            placeholder="예: 금오산, 주차, 맛집 (입력 후 쉼표나 엔터)" 
            class="form-input"
            @keydown.enter.prevent="handleTagInput"
            @keydown.comma.prevent="handleTagInput"
            @blur="handleTagInput"
          />
          <div v-if="formData.tags.length" class="tag-badge-container">
            <span v-for="(tag, index) in formData.tags" :key="index" class="tag-badge">
              #{{ tag }}
              <button type="button" class="remove-tag-btn" @click="removeTag(index)">x</button>
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">비밀번호</label>
          <input 
            id="password" 
            v-model="formData.password" 
            type="password" 
            placeholder="게시글 수정/삭제용 비밀번호를 입력하세요" 
            class="form-input" 
            required 
          />
        </div>

        <div class="form-group">
          <div class="label-wrapper">
            <label class="form-label">썸네일 이미지</label>
            <span v-if="isEditMode" class="info-text-small">
              (※ 수정 시 이미지 변경은 불가능합니다.)
            </span>
          </div>
          
          <input 
            v-if="!isEditMode"
            type="file" 
            accept="image/*" 
            class="file-input" 
            @change="handleFileChange" 
          />
          
          <div v-if="imagePreview" class="preview-container">
            <img :src="displayPreviewUrl" alt="미리보기" class="preview-img" />
            <button 
              v-if="!isEditMode"
              type="button" 
              class="remove-img-btn" 
              @click="removeImage"
            >
              이미지 제거
            </button>
          </div>
          <div v-else-if="isEditMode" class="no-image-text">
            등록된 이미지가 없습니다.
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-cancel" @click="goBack" :disabled="isSubmitting">취소</button>
          <button v-if="isEditMode" type="button" class="btn btn-delete" @click="openDeleteConfirm" :disabled="isSubmitting">삭제</button>
          <button type="submit" class="btn btn-submit" :disabled="isSubmitting">
            {{ isSubmitting ? '저장 중...' : (isEditMode ? '수정완료' : '등록하기') }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="isDeleteConfirmOpen" class="modal-overlay" @click="closeDeleteConfirm">
      <div class="modal-window" @click.stop>
        <div class="modal-header delete-modal-header">
          <h3>게시글 삭제 확인</h3>
          <button @click="closeDeleteConfirm" class="close-x-btn">✕</button>
        </div>
        <div class="modal-body confirm-modal-body">
          <span class="warning-icon">⚠️</span>
          <p class="confirm-message">정말로 이 게시글을 삭제하시겠습니까?</p>
          <p class="confirm-sub-message">삭제된 데이터는 복구할 수 없습니다.</p>
        </div>
        <div class="modal-footer">
          <button @click="executeDelete" class="modal-delete-action-btn" :disabled="isSubmitting">
            {{ isSubmitting ? '삭제 중...' : '네, 삭제합니다' }}
          </button>
          <button @click="closeDeleteConfirm" class="modal-cancel-btn" :disabled="isSubmitting">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { toast } from 'vue3-toastify';
import api from '@/api/index.js';

const route = useRoute();
const router = useRouter();

const isEditMode = ref(false);
const isInitialLoading = ref(false);
const isSubmitting = ref(false);
const postId = ref(null);

const tagInput = ref('');
const imagePreview = ref('');
const selectedFile = ref(null);

// 🌟 커스텀 삭제 팝업 제어 상태 변수
const isDeleteConfirmOpen = ref(false);

const formData = reactive({
  category: '',
  title: '',
  content: '',
  password: '',
  tags: []
});

const displayPreviewUrl = computed(() => {
  if (!imagePreview.value) return '';
  if (
    imagePreview.value.startsWith('data:') || 
    imagePreview.value.startsWith('blob:') || 
    imagePreview.value.startsWith('http://') || 
    imagePreview.value.startsWith('https://')
  ) {
    return imagePreview.value;
  }
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = imagePreview.value.startsWith('/') ? imagePreview.value : `/${imagePreview.value}`;
  return `${cleanBase}${cleanPath}`;
});

onMounted(() => {
  if (route.params.id) {
    isEditMode.value = true;
    postId.value = route.params.id;
    fetchPostDetail();
  }
});

const fetchPostDetail = async () => {
  try {
    isInitialLoading.value = true;
    const response = await api.get(`/api/posts/${postId.value}`);
    
    if (response.data) {
      formData.category = response.data.category;
      formData.title = response.data.title;
      formData.content = response.data.content;
      formData.tags = response.data.tags || [];
      
      if (response.data.imageUrl) {
        imagePreview.value = response.data.imageUrl;
      }
    }
  } catch (err) {
    console.error('게시글 세부 정보 로드 실패:', err);
    toast.error(err.response?.data?.message || '게시글을 불러오는 데 실패했습니다.');
    router.push('/board');
  } finally {
    isInitialLoading.value = false;
  }
};

const handleTagInput = () => {
  const value = tagInput.value.trim().replace(/,/g, '');
  if (value && !formData.tags.includes(value)) {
    formData.tags.push(value);
  }
  tagInput.value = '';
};

const removeTag = (index) => {
  formData.tags.splice(index, 1);
};

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  selectedFile.value = file;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    imagePreview.value = event.target.result;
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  selectedFile.value = null;
  imagePreview.value = '';
};

const handleSubmit = async () => {
  if (tagInput.value.trim()) {
    handleTagInput();
  }

  try {
    isSubmitting.value = true;

    if (isEditMode.value) {
      const updateData = {
        category: formData.category,
        title: formData.title,
        content: formData.content,
        password: formData.password,
        tags: formData.tags
      };

      await api.put(`/api/posts/${postId.value}`, updateData);
      toast.success('게시글이 성공적으로 수정되었습니다.');
      router.push(`/board/${postId.value}`);
    } else {
      const submitData = new FormData();
      submitData.append('category', formData.category);
      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('password', formData.password);
      
      const tagsString = formData.tags.join(',');
      submitData.append('tags', tagsString);

      if (selectedFile.value) {
        submitData.append('image', selectedFile.value);
      }

      const response = await api.post('/api/posts', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('게시글이 성공적으로 등록되었습니다.');
      
      const newPostId = response.data?.id;
      if (newPostId) {
        router.push(`/board/${newPostId}`);
      } else {
        router.push('/board');
      }
    }
  } catch (err) {
    console.error('게시글 저장 실패:', err);
    toast.error(err.response?.data?.message || '게시글 저장 중 오류가 발생했습니다.');
  } finally {
    isSubmitting.value = false;
  }
};

// 🌟 삭제 버튼 클릭 시 검증 후 커스텀 모달 오픈
const openDeleteConfirm = () => {
  if (!formData.password) {
    toast.warning('게시글 삭제를 위해 비밀번호를 입력해주세요.');
    return;
  }
  isDeleteConfirmOpen.value = true;
};

const closeDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false;
};

// 🌟 커스텀 모달에서 최종 승인 버튼을 눌렀을 때 실행되는 API 통신 함수
const executeDelete = async () => {
  try {
    isSubmitting.value = true;

    await api.delete(`/api/posts/${postId.value}`, {
      data: { password: formData.password }
    });

    toast.success('게시글이 삭제되었습니다.');
    closeDeleteConfirm();
    router.push('/board');
  } catch (err) {
    console.error('게시글 삭제 실패:', err);
    toast.error(err.response?.data?.message || '삭제에 실패했습니다. 비밀번호를 확인해주세요.');
  } finally {
    isSubmitting.value = false;
  }
};

// 기존의 handleDelete 메소드는 제거하고 위의 함수 체인으로 이관 완료

const goBack = () => {
  if (isEditMode.value) {
    router.push(`/board/${postId.value}`);
  } else {
    router.push('/board');
  }
};
</script>

<style scoped>
.board-write-view {
  max-width: 800px;
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

.form-container {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 30px;
}
.form-title {
  font-weight: bold;
  font-size: 26px;
  color: #212529;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 20px;
  margin-bottom: 25px;
}
.write-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-label {
  font-size: 15px;
  font-weight: bold;
  color: #495057;
}

.label-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-text-small {
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
}

.form-select, .form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}
.form-textarea {
  min-height: 250px;
  resize: vertical;
}

.tag-badge-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.tag-badge {
  background-color: #e8f4ff;
  color: #007bff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.remove-tag-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  font-weight: bold;
}

.file-input {
  margin-top: 5px;
}
.preview-container {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 200px;
}
.preview-img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}
.remove-img-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.remove-img-btn:hover {
  background-color: #c82333;
}
.no-image-text {
  font-size: 13px;
  color: #868e96;
  padding: 5px 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
  border-top: 1px solid #dee2e6;
  padding-top: 20px;
}
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-cancel {
  background-color: #e9ecef;
  color: #495057;
}
.btn-cancel:hover {
  background-color: #dee2e6;
}
.btn-delete {
  background-color: #dc3545;
  color: white;
  margin-right: auto;
}
.btn-delete:hover {
  background-color: #c82333;
}
.btn-submit {
  background-color: #007bff;
  color: white;
}
.btn-submit:hover {
  background-color: #0069d9;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 50px;
  color: #6c757d;
  font-size: 15px;
}

/* 🌟 [공통 모달 구조 및 디자인] 레이어 스타일 정의 */
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.modal-header {
  background-color: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex; justify-content: space-between; align-items: center;
}
.delete-modal-header h3 {
  font-size: 16px;
  font-weight: bold;
  color: #dc3545; /* 경고 헤더 컬러 지정 */
  margin: 0;
}
.close-x-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: #868e96; }
.close-x-btn:hover { color: #212529; }

.modal-body {
  padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.confirm-modal-body {
  align-items: center;
  text-align: center;
  padding: 30px 20px;
}
.warning-icon {
  font-size: 40px;
  margin-bottom: 10px;
}
.confirm-message {
  font-size: 16px;
  font-weight: bold;
  color: #212529;
  margin: 0;
}
.confirm-sub-message {
  font-size: 13px;
  color: #6c757d;
  margin: 0;
}

.modal-footer {
  padding: 12px 20px; background-color: #f8f9fa; border-top: 1px solid #dee2e6;
  display: flex; justify-content: flex-end; gap: 8px;
}
.modal-cancel-btn {
  padding: 8px 16px; background-color: #e9ecef; color: #495057; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;
}
.modal-cancel-btn:hover { background-color: #dee2e6; }

/* 커스텀 팝업 전용 강렬한 레드 액션 버튼 스타일 */
.modal-delete-action-btn {
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.15s;
}
.modal-delete-action-btn:hover {
  background-color: #bd2130;
}
.modal-delete-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>