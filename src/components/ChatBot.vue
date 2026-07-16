<template>
  <div class="chatbot-wrapper">
    <button v-if="!isOpen" @click="toggleChat" class="chat-trigger-btn" aria-label="챗봇 열기">
      💬
    </button>

    <div 
      v-else 
      class="chat-window" 
      :class="{ 'is-mobile-fullscreen': isMobile }"
      @touchmove.stop
    >
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
          @focus="handleInputFocus"
        />
        <button type="submit" class="send-btn" :disabled="isLoading || !inputMessage.trim()">
          전송
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/index.js';

const router = useRouter();

const isOpen = ref(false);
const isMobile = ref(false);
const isLoading = ref(false);
const inputMessage = ref('');
const messageContainer = ref(null);

const messages = ref([
  {
    sender: 'assistant',
    text: '안녕하세요! 궁금한 구미/경북 권역의 지역 정보를 물어보세요. (예: 관광지 추천, 맛집, 축제 일정)',
    time: '오후 3:30',
    references: []
  }
]);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

watch([isOpen, isMobile], ([open, mobile]) => {
  if (open && mobile) {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  } else {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }
});

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

const handleInputFocus = () => {
  if (isMobile.value) {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight);
      scrollToBottom();
    }, 250);
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
});

const getCurrentTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? '오후' : '오전';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${ampm} ${hours}:${minutes}`;
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  const userText = inputMessage.value;
  inputMessage.value = '';

  messages.value.push({
    sender: 'user',
    text: userText,
    time: getCurrentTime()
  });

  await scrollToBottom();
  isLoading.value = true;
  await scrollToBottom();

  try {
    const rawHistory = messages.value
      .slice(1, -1)
      .map(msg => ({
        role: msg.sender,
        content: msg.text
      }));

    const historyPayload = rawHistory.slice(-10);

    const requestBody = {
      message: userText,
      history: historyPayload
    };

    const response = await api.post('/api/chat', requestBody, {
      timeout: 20000
    });

    let answerText = '';
    let references = [];

    if (response.data) {
      answerText = response.data.answer;
      references = response.data.references || [];
    }

    messages.value.push({
      sender: 'assistant',
      text: answerText,
      time: getCurrentTime(),
      references: references
    });

  } catch (error) {
    console.error('챗봇 답변 생성 실패:', error);
    
    let fallbackMessage = error.response?.data?.message;
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      fallbackMessage = '답변 생성 시간이 초과되었습니다. 잠시 후 다시 질문해 주세요.';
    } else if (!fallbackMessage) {
      fallbackMessage = '서비스 연결 상태가 원활하지 않습니다. 잠시 후 다시 시도해 주세요.';
    }
    
    messages.value.push({
      sender: 'assistant',
      text: fallbackMessage,
      time: getCurrentTime()
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

const handleReferenceClick = (refItem) => {
  isOpen.value = false;
  if (refItem.type === 'post') {
    router.push(`/board/${refItem.id}`);
  } else if (refItem.type === 'place') {
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

.chat-window.is-mobile-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100dvh !important; 
  max-height: 100dvh !important;
  border-radius: 0;
  z-index: 2100;
}

.chat-header {
  background-color: #007bff;
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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

.chat-messages {
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; 
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

.message-wrapper.user {
  align-self: flex-end;
  align-items: flex-end;
}
.message-wrapper.user .message-bubble {
  background-color: #007bff;
  color: white;
  border-radius: 12px 12px 0 12px;
}

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
  text-align: left; 
}

.message-time {
  font-size: 11px;
  color: #adb5bd;
  margin-top: 4px;
}

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

.chat-input-form {
  display: flex;
  border-top: 1px solid #e9ecef;
  padding: 10px;
  background-color: white;
  flex-shrink: 0; 
  padding-bottom: calc(10px + env(safe-area-inset-bottom)); 
}

/* 🌟 [테마 색상 고정 조치] 모바일 다크모드 인버전 현상 전면 방어 및 고정 스타일 정의 */
.chat-input {
  flex-grow: 1;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  
  /* 다크모드 미디어 쿼리를 무시하고 고정 값을 갖도록 강제 선언 추가 */
  background-color: #ffffff !important;
  color: #212529 !important;
  
  /* 인풋창 내부 입력 텍스트 포커스 시점에도 고정 명시 */
  caret-color: #007bff; 
  
  -webkit-appearance: none; 
}

/* 🌟 iOS Safari 등의 다크모드 텍스트 쉴드 컬러링 제거 플레이스홀더 설정 */
.chat-input::placeholder {
  color: #adb5bd !important;
  opacity: 1; /* iOS 가시성 투명도 초기화 */
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