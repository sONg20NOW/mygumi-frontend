<template>
  <div class="board-write-view">
    <div class="breadcrumb">
      홈 > 게시판 > {{ isEditMode ? '글수정' : '글쓰기' }}
    </div>

    <div v-if="isInitialLoading" class="loading-state">
      게시글 정보를 불러오는 중입니다...
    </div>

    <div v-else class="form-container">
      <h1 class="form-title">
        {{ isEditMode ? '게시글 수정' : '게시글 작성' }}
      </h1>

      <form @submit.prevent="handleSubmit" class="write-form">
        <div class="form-group">
          <label for="category" class="form-label">카테고리</label>
          <select id="category" v-model="formData.category" class="form-select" required>
            <option value="" disabled>카테고리를 선택하세요</option>
            <option value="관광지">관광지</option>
            <option value="맛집">맛집</option>
            <option value="축제·행사">축제·행사</option>
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
          <label class="form-label">썸네일 이미지</label>
          <input type="file" accept="image/*" class="file-input" @change="handleFileChange" />
          
          <div v-if="imagePreview" class="preview-container">
            <img :src="imagePreview" alt="미리보기" class="preview-img" />
            <button type="button" class="remove-img-btn" @click="removeImage">이미지 제거</button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-cancel" @click="goBack" :disabled="isSubmitting">취소</button>
          <button v-if="isEditMode" type="button" class="btn btn-delete" @click="handleDelete" :disabled="isSubmitting">삭제</button>
          <button type="submit" class="btn btn-submit" :disabled="isSubmitting">
            {{ isSubmitting ? '저장 중...' : (isEditMode ? '수정완료' : '등록하기') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

// 컴포넌트 내부 상태는 여전히 배열(Array)로 관리하여 뱃지 렌더링 및 개별 삭제를 유용하게 유지합니다.
const formData = reactive({
  category: '',
  title: '',
  content: '',
  password: '',
  tags: []
});

onMounted(() => {
  if (route.params.id) {
    isEditMode.value = true;
    postId.value = route.params.id;
    fetchPostDetail();
  }
});

// [2번 API] 수정 시 기존 데이터 단건 조회
const fetchPostDetail = async () => {
  try {
    isInitialLoading.value = true;
    const response = await api.get(`/api/posts/${postId.value}`);
    
    if (response.data) {
      formData.category = response.data.category;
      formData.title = response.data.title;
      formData.content = response.data.content;
      formData.tags = response.data.tags || [];
      
      if (response.data.thumbnailUrl) {
        imagePreview.value = response.data.thumbnailUrl;
      }
    }
  } catch (err) {
    console.error('게시글 세부 정보 로드 실패:', err);
    alert(err.response?.data?.message || '게시글을 불러오는 데 실패했습니다.');
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

// [3번 & 4번 API] 폼 전송
const handleSubmit = async () => {
  if (tagInput.value.trim()) {
    handleTagInput();
  }

  try {
    isSubmitting.value = true;

    const submitData = new FormData();
    submitData.append('category', formData.category);
    submitData.append('title', formData.title);
    submitData.append('content', formData.content);
    submitData.append('password', formData.password);
    
    // ⭐ [수정 사항] 배열['금오산', '주차']을 명세서 규격에 맞게 쉼표 구분 문자열("금오산,주차")로 조인하여 전송
    const tagsString = formData.tags.join(',');
    submitData.append('tags', tagsString);

    if (selectedFile.value) {
      submitData.append('thumbnail', selectedFile.value);
    }

    if (isEditMode.value) {
      // [4번 API] 게시글 수정
      await api.put(`/api/posts/${postId.value}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('게시글이 성공적으로 수정되었습니다.');
      router.push(`/board/${postId.value}`);
    } else {
      // [3번 API] 게시글 신규 등록
      const response = await api.post('/api/posts', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('게시글이 성공적으로 등록되었습니다.');
      
      const newPostId = response.data?.id;
      if (newPostId) {
        router.push(`/board/${newPostId}`);
      } else {
        router.push('/board');
      }
    }
  } catch (err) {
    console.error('게시글 저장 실패:', err);
    alert(err.response?.data?.message || '게시글 저장 중 오류가 발생했습니다.');
  } finally {
    isSubmitting.value = false;
  }
};

// [5번 API] 게시글 삭제
const handleDelete = async () => {
  if (!formData.password) {
    alert('게시글 삭제를 위해 비밀번호를 입력해주세요.');
    return;
  }

  if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
    return;
  }

  try {
    isSubmitting.value = true;

    await api.delete(`/api/posts/${postId.value}`, {
      data: { password: formData.password }
    });

    alert('게시글이 삭제되었습니다.');
    router.push('/board');
  } catch (err) {
    console.error('게시글 삭제 실패:', err);
    alert(err.response?.data?.message || '삭제에 실패했습니다. 비밀번호를 확인해주세요.');
  } finally {
    isSubmitting.value = false;
  }
};

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
}
.form-container {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 30px;
}
.form-title {
  font-size: 22px;
  color: #212529;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 15px;
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
</style>