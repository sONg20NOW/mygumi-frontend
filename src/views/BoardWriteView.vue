<template>
  <div class="board-write-view">
    <div class="breadcrumb">
      홈 > 게시판 > {{ isEditMode ? '글수정' : '글쓰기' }}
    </div>

    <div class="form-container">
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
          <label class="form-label">이미지 첨부</label>
          <input type="file" @change="onFileChange" accept="image/*" class="file-input" />
          <div v-if="previewUrl" class="preview-container">
            <img :src="previewUrl" alt="미리보기 이미지" class="preview-img" />
            <button type="button" @click="removeImage" class="remove-img-btn">✕ 이미지 제거</button>
          </div>
        </div>

        <div class="form-group">
          <label for="tags" class="form-label">태그</label>
          <input 
            id="tags" 
            v-model="tagInput" 
            type="text" 
            placeholder="태그를 쉼표(,)로 구분하여 입력하세요 (예: 금오산, 힐링, 주말)" 
            class="form-input" 
          />
          <div class="tag-preview" v-if="parsedTags.length > 0">
            <span v-for="tag in parsedTags" :key="tag" class="tag-badge">#{{ tag }}</span>
          </div>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">수정용 비밀번호</label>
          <input id="password" v-model="formData.password" type="password" placeholder="비밀번호 입력" class="form-input" :disabled="isEditMode" required />
        </div>

        <div class="form-actions">
          <button type="submit" class="submit-btn">{{ isEditMode ? '수정 완료' : '등록' }}</button>
          <button type="button" @click="handleCancel" class="cancel-btn">취소</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const isEditMode = computed(() => !!route.params.id);
const tagInput = ref('');
const previewUrl = ref('');

const formData = ref({
  category: '',
  title: '',
  content: '',
  imageUrl: '',
  password: ''
});

// 입력한 쉼표 텍스트를 실시간 해시태그 배열로 가공
const parsedTags = computed(() => {
  if (!tagInput.value) return [];
  return tagInput.value.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
});

// 이미지 업로드 파일 변화 감지
const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    formData.value.imageUrl = URL.createObjectURL(file); // 임시 가상 URL 생성
    previewUrl.value = formData.value.imageUrl;
  }
};

const removeImage = () => {
  formData.value.imageUrl = '';
  previewUrl.value = '';
};

onMounted(() => {
  if (isEditMode.value) {
    // 수정모드 시 기존 목데이터 불러오기 분기
    const foundPost = { id: 5, category: '관광지', title: '이번 주말에 금오산 둘레길 다녀왔는데 단풍 장난 아니네요!', content: '가족들과 구미 금오산 둘레길에 다녀왔습니다...', tags: ['금오산', '단풍', '나들이'], imageUrl: 'https://picsum.photos/600/300', password: '1234' };
    formData.value = { ...foundPost };
    tagInput.value = foundPost.tags.join(', ');
    previewUrl.value = foundPost.imageUrl;
  }
});

const handleSubmit = () => {
  const resultData = {
    ...formData.value,
    tags: parsedTags.value
  };
  console.log('최종 등록 데이터:', resultData);
  alert(isEditMode.value ? '수정 완료되었습니다!' : '새 글이 등록되었습니다!');
  router.push('/board');
};

const handleCancel = () => {
  router.push('/board');
};
</script>

<style scoped>
.board-write-view { display: flex; flex-direction: column; gap: 20px; }
.breadcrumb { font-size: 14px; color: #6c757d; }
.form-container { background-color: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 30px; }
.form-title { font-size: 22px; color: #212529; border-bottom: 2px solid #dee2e6; padding-bottom: 15px; margin-bottom: 25px; }
.write-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 15px; font-weight: bold; color: #495057; }
.form-select, .form-input, .form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #ced4da; border-radius: 4px; }
.form-textarea { min-height: 200px; }

.file-input { margin-top: 5px; }
.preview-container { margin-top: 10px; display: flex; flex-direction: column; gap: 10px; width: 200px; }
.preview-img { width: 100%; height: auto; border-radius: 4px; border: 1px solid #dee2e6; }
.remove-img-btn { background-color: #dc3545; color: white; border: none; padding: 5px; border-radius: 4px; cursor: pointer; }

.tag-preview { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 5px; }
.tag-badge { background-color: #e8f4ff; color: #007bff; padding: 4px 8px; border-radius: 20px; font-size: 12px; }

.form-actions { display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e9ecef; padding-top: 20px; }
.submit-btn { padding: 10px 24px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
.cancel-btn { padding: 10px 24px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>