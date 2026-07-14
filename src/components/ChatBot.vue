<template>
  <div class="chatbot-wrapper">
    <button v-if="!isOpen" @click="toggleChat" class="chat-trigger-btn" aria-label="챗봇 열기">
      💬
    </button>

    <div v-else class="chat-window" :class="{ 'is-mobile-fullscreen': isMobile }">
      <div class="chat-header">
        <div class="header-title">
          <span class="bot-icon">🤖</span>
          <h3>LocalHub 구미/경북 AI 챗봇</h3>
        </div>
        <button @click="toggleChat" class="close-btn" aria-label="챗봇 닫기">✕</button>
      </div>
      
      <div class="chat-messages" ref="messageContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message-wrapper', msg.sender]">
          <div class="message-bubble">
            <p class="message-text">{{ msg.text }}</p>
            
            <div v-if="msg.references && msg.references.length > 0" class="references-container">
              <p class="ref-title">📍 참고 정보</p>
              <div class="ref-list">
                <div 
                  v-for="(refItem, refIdx) in msg.references" 
                  :key="refIdx" 
                  @click="handleReferenceClick(refItem)"
                  class="ref-item"
                >
                  <span class="ref-badge" :class="refItem.type">
                    {{ refItem.type === 'place' ? '장소' : '게시글' }}
                  </span>
                  <span class="ref-item-title">{{ refItem.title }}</span>
                </div>
              </div>
            </div>
          </div>
          <span class="message-time">{{ msg.time }}</span>
        </div>
        
        <div v-if="isLoading" class="message-wrapper assistant">
          <div class="message-bubble loading-bubble">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
      
      <form @submit.prevent="sendMessage" class="chat-input-form">
        <input 
          v-model="inputMessage"
          type="text" 
          placeholder="질문 내용을 입력하세요..." 
          class="chat-input"
          :disabled="isLoading"
        />
        <button type="submit" class="send-btn" :disabled="isLoading || !inputMessage.trim()">
          전송
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// UI 상태값 [cite: 34]
const isOpen = ref(false);
const isMobile = ref(false);
const isLoading = ref(false);
const inputMessage = ref('');
const messageContainer = ref(null);

// 대화 히스토리 저장 상태 (RFP 필수 요구사항: 대화 히스토리 유지) [cite: 34]
const messages = ref([
  {
    sender: 'assistant',
    text: '안녕하세요! 궁금한 구미/경북 권역의 지역 정보를 물어보세요. (예: 관광지 추천, 맛집, 축제 일정)',
    time: '오후 3:30',
    references: []
  }
]);

// 모바일 해상도 판별 스크립트 (RFP 모바일 대응 요구사항 반영) [cite: 34, 131]
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 576;
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
};

// 스크롤을 항상 아래로 밀어주는 편의 기능
const scrollToBottom = async () => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// 현재 시간을 예쁘게 포맷팅
const getCurrentTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? '오후' : '오전';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${ampm} ${hours}:${minutes}`;
};

// 💬 챗봇 질문 전송 시뮬레이션 로직 [cite: 31, 32]
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  const userText = inputMessage.value;
  inputMessage.value = '';

  // 1. 사용자 말풍선 추가
  messages.value.push({
    sender: 'user',
    text: userText,
    time: getCurrentTime()
  });
  await scrollToBottom();

  // 로딩 상태 시작
  isLoading.value = true;

  try {
    // API 가상 시뮬레이션 대기 (1초)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 사용자 발화 키워드에 따른 목데이터 분기 [cite: 32]
    let mockAnswer = "구미와 경북 권역의 다양한 명소, 맛집, 축제 정보에 대해 안내해 드릴 수 있습니다. 찾으시는 정보가 있으신가요?";
    let mockRefs = [];

    if (userText.includes('관광지') || userText.includes('금오산') || userText.includes('가족')) {
      mockAnswer = "가족과 함께 방문하기 좋은 대표적인 장소로 금오산 도립공원을 추천합니다. 둘레길 산책 코스가 아주 잘 되어 있습니다.";
      mockRefs = [
        { type: 'place', id: 'place-101', title: '금오산 도립공원' },
        { type: 'post', id: 5, title: '이번 주말에 금오산 둘레길 다녀왔는데 단풍 장난 아니네요!' }
      ];
    } else if (userText.includes('맛집') || userText.includes('음식')) {
      mockAnswer = "구미역 뒤편(금리단길) 골목에 숨은 분위기 좋은 맛집들과 전통적인 국밥집들이 인기가 많습니다.";
      mockRefs = [
        { type: 'place', id: 'place-102', title: '구미역 뒤쪽 뇨끼 맛집' },
        { type: 'post', id: 4, title: '구미역 뒤쪽에 진짜 숨은 뇨끼 맛집 공유합니다.' }
      ];
    } else if (userText.includes('축제') || userText.includes('행사')) {
      mockAnswer = "올여름 구미와 경북 지역에서 개최 예정인 축제 및 야시장 정보입니다. 일정에 참고해 보세요!";
      mockRefs = [
        { type: 'post', id: 6, title: '2026 경북 여름 축제 일정 총정리 캘린더 공유' }
      ];
    }

    // 2. 어시스턴트 답변 추가
    messages.value.push({
      sender: 'assistant',
      text: mockAnswer,
      time: getCurrentTime(),
      references: mockRefs
    });

  } catch (error) {
    console.error(error);
    messages.value.push({
      sender: 'assistant',
      text: '서비스 연결 상태가 원활하지 않습니다. 잠시 후 다시 시도해 주세요.',
      time: getCurrentTime()
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

// 📍 참고 정보 카드 클릭 시 라우터 전환 처리 핸들러
const handleReferenceClick = (refItem) => {
  isOpen.value = false; // 대화창 닫기
  if (refItem.type === 'post') {
    // 상세 게시글로 라우터 이동
    router.push(`/board/${refItem.id}`);
  } else if (refItem.type === 'place') {
    // 지도 탭으로 이동
    router.push('/map');
  }
};
</script>

<style scoped>
.chatbot-wrapper {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 999;
}

/* 플로팅 둥근 버튼 [cite: 74, 130] */
.chat-trigger-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  font-size: 28px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}
.chat-trigger-btn:hover {
  transform: scale(1.05);
}

/* 챗봇 대화창 레이아웃 [cite: 131] */
.chat-window {
  width: 360px;
  height: 500px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

/* 📱 모바일 전체 화면 스타일 [cite: 131] */
.chat-window.is-mobile-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}

.chat-header {
  background-color: #007bff;
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bot-icon {
  font-size: 20px;
}
.chat-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

/* 스크롤 가능한 메시지창 */
.chat-messages {
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

/* 유저 말풍선 우측 정렬 */
.message-wrapper.user {
  align-self: flex-end;
  align-items: flex-end;
}
.message-wrapper.user .message-bubble {
  background-color: #007bff;
  color: white;
  border-radius: 12px 12px 0 12px;
}

/* 봇 말풍선 좌측 정렬 */
.message-wrapper.assistant {
  align-self: flex-start;
  align-items: flex-start;
}
.message-wrapper.assistant .message-bubble {
  background-color: #ffffff;
  color: #333333;
  border-radius: 12px 12px 12px 0;
  border: 1px solid #e9ecef;
}

.message-bubble {
  padding: 12px 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.message-text {
  font-size: 14px;
  line-height: 1.45;
  margin: 0;
  white-space: pre-line;
}
.message-time {
  font-size: 11px;
  color: #adb5bd;
  margin-top: 4px;
}

/* 📌 참고 정보(references) 카드 디자인 */
.references-container {
  margin-top: 10px;
  border-top: 1px dashed #dee2e6;
  padding-top: 8px;
}
.ref-title {
  font-size: 12px;
  font-weight: bold;
  color: #495057;
  margin-bottom: 6px;
}
.ref-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ref-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f1f3f5;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s;
}
.ref-item:hover {
  background-color: #e9ecef;
}
.ref-item-title {
  font-size: 12px;
  color: #007bff;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ref-badge {
  font-size: 10px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 3px;
}
.ref-badge.place { background-color: #e2f0d9; color: #385723; }
.ref-badge.post { background-color: #fff2cc; color: #7f6000; }

/* 폼 제어 영역 */
.chat-input-form {
  display: flex;
  border-top: 1px solid #e9ecef;
  padding: 10px;
  background-color: white;
}
.chat-input {
  flex-grow: 1;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
}
.chat-input:focus {
  border-color: #007bff;
}
.send-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0 16px;
  margin-left: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
}
.send-btn:disabled {
  background-color: #e9ecef;
  color: #adb5bd;
  cursor: not-allowed;
}

/* 대기 로딩 점 애니메이션 */
.loading-bubble {
  display: flex;
  gap: 4px;
  padding: 12px 18px;
}
.dot {
  width: 6px;
  height: 6px;
  background-color: #adb5bd;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}
.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}
</style>