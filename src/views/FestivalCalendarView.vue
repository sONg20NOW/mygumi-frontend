<template>
  <div class="calendar-view">
    <div class="breadcrumb">홈 > 축제 캘린더</div>
    
    <div class="calendar-container">
      <div class="calendar-header">
        <button @click="prevMonth" class="nav-btn">&lt;</button>
        <h2 class="calendar-title">
          {{ currentYear }}년 {{ currentMonth + 1 }}월 축제 일정
        </h2>
        <button @click="nextMonth" class="nav-btn">&gt;</button>
      </div>

      <div class="weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      </div>

      <div class="days-grid">
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
            <span class="info-value">{{ selectedEvent.dateRange }}</span>
          </div>
          <div class="info-group">
            <span class="info-label">📍 장소</span>
            <span class="info-value">{{ selectedEvent.place }}</span>
          </div>
          <div class="info-desc-box">
            <p class="info-desc-text">{{ selectedEvent.desc }}</p>
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
import { ref, computed } from 'vue';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

// 2026년 7월 고정 기준 (프로젝트 마감 시점 연월)
const currentYear = ref(2026);
const currentMonth = ref(6); // 0부터 시작하므로 6은 7월을 의미합니다.

const selectedEvent = ref(null);

// 구미/경북 권역 가상 축제 일정 목데이터 (디자인적 구분을 위해 테마 색상 탑재)
const festivalEvents = ref([
  {
    id: 1,
    title: '구미 푸드페스티벌',
    startDay: 3,
    endDay: 5,
    dateRange: '2026.07.03 ~ 2026.07.05',
    place: '구미 송정 복개천 일원',
    color: '#e3f2fd',
    textColor: '#0d47a1',
    desc: '구미의 다양한 먹거리와 로컬 푸드를 한자리에서 맛보고 즐길 수 있는 대표 먹거리 축제입니다. 버스킹 공연과 다양한 이벤트 부스가 준비되어 있습니다.'
  },
  {
    id: 2,
    title: '경북 풍기인삼축제',
    startDay: 15,
    endDay: 18,
    dateRange: '2026.07.15 ~ 2026.07.18',
    place: '영주시 풍기읍 남원천변',
    color: '#fff3e0',
    textColor: '#e65100',
    desc: '세계적인 효능을 자랑하는 풍기인삼을 직접 캐보고 시중보다 저렴하게 구매할 수 있는 전통 웰빙 건강 축제입니다.'
  },
  {
    id: 3,
    title: '금오산 잔도 야간 트래킹',
    startDay: 24,
    endDay: 25,
    dateRange: '2026.07.24 ~ 2026.07.25',
    place: '구미 금오산 잔도길 일원',
    color: '#f3e5f5',
    textColor: '#4a148c',
    desc: '은은한 경관 조명이 켜진 금오산 잔도길을 함께 걸으며 구미의 아름다운 밤하늘과 호수 야경을 눈에 담는 힐링 프로그램입니다.'
  }
]);

// 달력 날짜 계산 연산
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const blankDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
  return firstDay;
});

// 이전 달 이동
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value -= 1;
  } else {
    currentMonth.value -= 1;
  }
};

// 다음 달 이동
const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value += 1;
  } else {
    currentMonth.value += 1;
  }
};

// 특정 날짜에 매칭되는 이벤트 필터링
const getEventsForDay = (day) => {
  return festivalEvents.value.filter(event => {
    return day >= event.startDay && day <= event.endDay;
  });
};

// 오늘 날짜 하이라이팅을 위한 체크 함수
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
}

/* 달력 카드 감싸는 영역 */
.calendar-container {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 컨트롤러 헤더 */
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
.nav-btn:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

/* 요일 구분선 */
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
.weekday:first-child { color: #dc3545; } /* 일요일 빨간색 */
.weekday:last-child { color: #007bff; }  /* 토요일 파란색 */

/* 실제 그리드판 */
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

/* 오늘 날짜 하이라이팅 원형 스타일 */
.day-number.today {
  background-color: #007bff;
  color: white;
  border-radius: 50%;
}

/* 이벤트 스트립 리스트 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.event-tag {
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

/* 상세 팝업 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
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
}

.info-label {
  width: 70px;
  font-weight: bold;
  color: #868e96;
}

.info-value {
  color: #333333;
  font-weight: 500;
}

.info-desc-box {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.info-desc-text {
  font-size: 14px;
  line-height: 1.6;
  color: #495057;
  margin: 0;
  white-space: pre-wrap;
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