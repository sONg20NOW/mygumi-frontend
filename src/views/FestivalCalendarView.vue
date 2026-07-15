<template>
  <div class="calendar-view">
    <div class="breadcrumb">
      <RouterLink to="/" class="breadcrumb-link">홈</RouterLink>
      <span class="divider"> &gt; </span>
      <span class="current-page">축제 캘린더</span>
    </div>
    
    <div class="calendar-container">
      <div class="calendar-header">
        <button @click="prevMonth" class="nav-btn" :disabled="isLoading">&lt;</button>
        <h2 class="calendar-title">
          {{ currentYear }}년 {{ currentMonth + 1 }}월 축제 일정
        </h2>
        <button @click="nextMonth" class="nav-btn" :disabled="isLoading">&gt;</button>
      </div>

      <div class="weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      </div>

      <div v-if="isLoading" class="loading-state">축제 일정을 불러오는 중입니다...</div>
      <div v-else-if="error" class="error-state">{{ error }}</div>

      <div v-else class="days-grid">
        <div v-for="blank in blankDays" :key="'blank-' + blank" class="day empty"></div>
        
        <div v-for="day in daysInMonth" :key="day" class="day">
          <div class="day-header">
            <span class="day-number" :class="{ today: isToday(day) }">{{ day }}</span>
          </div>
          
          <div class="event-list">
            <div 
              v-for="event in getEventsForDay(day)" 
              :key="event.id"
              class="event-tag"
              :style="{ backgroundColor: event.color, color: event.textColor }"
              @click="showEventDetail(event)"
              :title="event.title"
            >
              🎈 {{ event.title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedEvent" class="modal-overlay" @click="selectedEvent = null">
      <div class="modal-window" @click.stop>
        <div class="modal-header" :style="{ borderLeft: '5px solid ' + selectedEvent.color }">
          <h3 class="modal-title">🎉 {{ selectedEvent.title }}</h3>
          <button @click="selectedEvent = null" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-group">
            <span class="info-label">📅 기간</span>
            <span class="info-value">
              {{ selectedEvent.start }}{{ selectedEvent.end ? ' ~ ' + selectedEvent.end : '' }}
            </span>
          </div>
          <div class="info-group">
            <span class="info-label">📍 장소</span>
            <span class="info-value place-value">{{ selectedEvent.address || '장소 정보 없음' }}</span>
          </div>
          </div>
        <div class="modal-footer">
          <button @click="selectedEvent = null" class="modal-close-action-btn">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import api from '@/api/index.js';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const currentYear = ref(2026);
const currentMonth = ref(6);

const festivalEvents = ref([]);
const isLoading = ref(true);
const error = ref(null);
const selectedEvent = ref(null);

const themeColors = [
  { color: '#e3f2fd', textColor: '#0d47a1' },
  { color: '#fff3e0', textColor: '#e65100' },
  { color: '#f3e5f5', textColor: '#4a148c' },
  { color: '#e8f5e9', textColor: '#1b5e20' }
];

const fetchFestivals = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const startIso = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-01`;
    const nextMonthObj = new Date(currentYear.value, currentMonth.value + 1, 1);
    const endIso = `${nextMonthObj.getFullYear()}-${String(nextMonthObj.getMonth() + 1).padStart(2, '0')}-01`;

    const response = await api.get('/api/festivals', {
      params: {
        start: startIso,
        end: endIso
      }
    });

    if (Array.isArray(response.data)) {
      festivalEvents.value = response.data.map((event, idx) => {
        const theme = themeColors[idx % themeColors.length];
        return {
          ...event,
          color: theme.color,
          textColor: theme.textColor
        };
      });
    }
  } catch (err) {
    console.error('축제 일정 로드 실패:', err);
    error.value = err.response?.data?.message || '축제 일정을 불러오는 데 실패했습니다.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchFestivals();
});

watch([currentYear, currentMonth], () => {
  fetchFestivals();
});

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const blankDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
  return firstDay;
});

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value -= 1;
  } else {
    currentMonth.value -= 1;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value += 1;
  } else {
    currentMonth.value += 1;
  }
};

const getEventsForDay = (day) => {
  const currentStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const currentDate = new Date(currentStr);

  return festivalEvents.value.filter(event => {
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : new Date(event.start);

    if (event.end) {
      return currentDate >= startDate && currentDate < endDate;
    } else {
      return currentDate.getTime() === startDate.getTime();
    }
  });
};

const isToday = (day) => {
  const today = new Date();
  return today.getFullYear() === currentYear.value &&
         today.getMonth() === currentMonth.value &&
         today.getDate() === day;
};

const showEventDetail = (event) => {
  selectedEvent.value = event;
};
</script>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 40px;
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
}
.breadcrumb-link:hover {
  text-decoration: underline;
  color: #0056b3;
}
.divider {
  color: #adb5bd;
}
.current-page {
  color: #6c757d;
}

.calendar-container {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.calendar-title {
  font-size: 22px;
  font-weight: bold;
  color: #212529;
  margin: 0;
}

.nav-btn {
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.15s;
}
.nav-btn:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}
.nav-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 10px;
  margin-bottom: 10px;
}
.weekday {
  color: #495057;
}
.weekday:first-child { color: #dc3545; }
.weekday:last-child { color: #007bff; }

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(110px, auto);
  border-left: 1px solid #e9ecef;
  border-top: 1px solid #e9ecef;
}

.day {
  border-right: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: #ffffff;
  min-width: 0; 
}

.day.empty {
  background-color: #f8f9fa;
}

.day-header {
  display: flex;
  justify-content: space-between;
}

.day-number {
  font-size: 13px;
  font-weight: bold;
  color: #495057;
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
}

.day-number.today {
  background-color: #007bff;
  color: white;
  border-radius: 50%;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  width: 100%;
}

.event-tag {
  display: block;
  width: 100%;
  box-sizing: border-box;
  font-size: 11px;
  padding: 4px 6px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: transform 0.1s, opacity 0.15s;
  border-left: 3px solid rgba(0, 0, 0, 0.15);
}
.event-tag:hover {
  transform: scale(1.02);
  opacity: 0.9;
}

.loading-state, .error-state {
  text-align: center;
  padding: 50px;
  color: #6c757d;
  font-size: 14px;
}
.error-state {
  color: #dc3545;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 2000;
}

.modal-window {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  background-color: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #212529;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #868e96;
}
.close-btn:hover {
  color: #212529;
}

.modal-body {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-group {
  display: flex;
  font-size: 14px;
  align-items: flex-start; /* 🌟 장소가 길어져서 개행될 때 라벨(📍 장소)이 상단에 고정되도록 변경 */
}

.info-label {
  width: 70px;
  font-weight: bold;
  color: #868e96;
  flex-shrink: 0; /* 🌟 텍스트 가로 공간 부족 시 라벨 너비가 좁아지지 않도록 고정 */
}

.info-value {
  color: #333333;
  font-weight: 500;
}

/* 🌟 장소 텍스트 전용 스타일: 가로 폭 한계 도달 시 왼쪽 정렬로 줄바꿈 처리 */
.place-value {
  flex-grow: 1;
  text-align: left;        /* 👈 왼쪽 정렬 보장 */
  white-space: normal;     /* 👈 연속 공백/줄바꿈 규칙 기본화 */
  word-break: break-all;   /* 👈 경계 영역 도달 시 문자 단위 개행 허용 */
}

.modal-footer {
  padding: 15px 25px;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
}

.modal-close-action-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s;
}
.modal-close-action-btn:hover {
  background-color: #0056b3;
}
</style>