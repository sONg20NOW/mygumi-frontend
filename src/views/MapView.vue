<template>
  <div class="map-view">
    <div class="breadcrumb">홈 > 지역 지도 보기</div>

    <div class="map-container-layout">
      <div class="sidebar">
        <h2 class="sidebar-title">📍 구미/경북 추천 핫플레이스</h2>
        
        <div class="filter-buttons">
          <button 
            v-for="cat in categoryOptions"
            :key="cat.value"
            @click="filterType(cat.value)" 
            :class="['filter-btn', { active: currentFilter === cat.value }]"
          >
            {{ cat.label }}
          </button>
        </div>

        <div class="place-list">
          <div v-if="isLoading" class="loading-state">장소 정보를 불러오는 중입니다...</div>
          <div v-else-if="error" class="error-state">{{ error }}</div>
          <div v-else-if="places.length === 0" class="empty-state">해당 카테고리의 장소가 없습니다.</div>

          <div 
            v-else
            v-for="place in places" 
            :key="place.id" 
            @click="focusOnPlace(place)"
            :class="['place-card', { active: selectedPlaceId === place.id }]"
          >
            <div class="place-info">
              <span class="badge" :class="getCategoryClass(place.category)">{{ place.category }}</span>
              <h3 class="place-name">{{ place.name }}</h3>
              <p class="place-address">{{ place.address }}</p>
              <p class="place-desc">{{ place.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="map-wrapper">
        <div id="map" class="leaflet-map-element"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/api/index.js'; // ⭕ 공통 api 인스턴스 사용

const route = useRoute();

// Leaflet 지도 및 마커 인스턴스 관리
let map = null;
const markers = [];

const places = ref([]);
const isLoading = ref(true);
const error = ref(null);

const currentFilter = ref('all');
const selectedPlaceId = ref(null);

// 요구해주신 카테고리 옵션 구성 (전체보기 추가)
const categoryOptions = [
  { label: '전체', value: 'all' },
  { label: '🏞️ 관광지', value: '관광지' },
  { label: '🚴 레포츠', value: '레포츠' },
  { label: '🏛️ 문화시설', value: '문화시설' },
  { label: '🛍️ 쇼핑', value: '쇼핑' },
  { label: '🏨 숙박', value: '숙박' },
  { label: '🗺️ 여행코스', value: '여행코스' },
  { label: '🍕 음식점', value: '음식점' },
  { label: '🎉 축제', value: '축제' }
];

// ⭐ [7번 API] 지도 마커 조회 (GET /api/map/markers)
const fetchMarkers = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const params = {};
    
    // 필터링 카테고리가 'all'이 아닐 경우 파라미터 매핑
    if (currentFilter.value !== 'all') {
      params.category = currentFilter.value;
    }

    // 라우터 쿼리에 검색 키워드가 존재할 경우 연동
    if (route.query.keyword) {
      params.keyword = route.query.keyword;
    }

    const response = await api.get('/api/map/markers', { params });
    
    if (response.data && response.data.items) {
      places.value = response.data.items;
      
      // 데이터 바인딩 후 Leaflet 지도 마커 물리 동기화
      await nextTick();
      updateMarkers();
    }
  } catch (err) {
    console.error('지도 마커 로드 실패:', err);
    error.value = err.response?.data?.message || '지도 마커를 불러오는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

// 지도 초기화 함수
const initMap = () => {
  // 구미시청 근처 기준 좌표 및 줌 레벨 세팅
  map = L.map('map').setView([36.1194, 128.3443], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // 첫 데이터 로드
  fetchMarkers();
};

// 실시간 데이터 변경에 기반한 마커 레이아웃 갱신
const updateMarkers = () => {
  // 기존 마커 메모리 클리어 및 제거
  markers.forEach(m => map.removeLayer(m));
  markers.length = 0;

  // API에서 가져온 실제 좌표 데이터를 기반으로 마커 바인딩
  places.value.forEach(place => {
    // API 명세서 스펙 변수인 latitude, longitude 활용
    const marker = L.marker([place.latitude, place.longitude])
      .addTo(map)
      .bindPopup(`<b>${place.name}</b><br><span style="font-size:12px;">${place.address}</span>`);
    
    marker.on('click', () => {
      selectedPlaceId.value = place.id;
    });

    markers.push(marker);
  });
};

// 필터 버튼 제어 핸들러
const filterType = (type) => {
  currentFilter.value = type;
  selectedPlaceId.value = null;
  fetchMarkers(); // 필터 바뀔 때마다 서버에 새로 API 호출
};

// 카드 목록 클릭 시 지도를 해당 좌표(latitude, longitude)로 부드럽게 평행이동
const focusOnPlace = (place) => {
  selectedPlaceId.value = place.id;
  if (map) {
    map.flyTo([place.latitude, place.longitude], 14, {
      animate: true,
      duration: 1.0
    });
    
    const targetMarker = markers.find(m => {
      const latLng = m.getLatLng();
      return latLng.lat === place.latitude && latLng.lng === place.longitude;
    });
    
    if (targetMarker) {
      targetMarker.openPopup();
    }
  }
};

// 외부 경로 쿼리(챗봇 연동 등) 변경 실시간 감시
watch(() => route.query, () => {
  fetchMarkers();
}, { deep: true });

onMounted(async () => {
  await nextTick();
  initMap();

  // 쿼리 파라미터(?place=명칭)를 넘겨받았을 때 마커 데이터 수신 후 자동 포커싱 처리
  if (route.query.place) {
    await nextTick();
    const found = places.value.find(p => p.name.includes(route.query.place));
    if (found) {
      focusOnPlace(found);
    }
  }
});

// 카테고리별 CSS 뱃지 배정용 클래스 변환기
const getCategoryClass = (catName) => {
  switch (catName) {
    case '관광지': return 'tour';
    case '음식점': return 'restaurant';
    case '레포츠': return 'leisure';
    case '문화시설': return 'culture';
    case '쇼핑': return 'shopping';
    case '숙박': return 'accommodation';
    case '축제': return 'festival';
    default: return 'default';
  }
};
</script>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 180px);
}

.breadcrumb {
  font-size: 14px;
  color: #6c757d;
}

.map-container-layout {
  display: flex;
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.sidebar {
  width: 350px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.sidebar-title {
  font-size: 16px;
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
  margin: 0;
  background-color: white;
}

/* 카테고리 개수가 늘어남에 따른 가로 스크롤 처리 및 터치 인터랙션 지원 */
.filter-buttons {
  display: flex;
  padding: 10px;
  gap: 6px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: thin; /* Firefox 스크롤바 얇게 */
}
.filter-buttons::-webkit-scrollbar {
  height: 4px; /* 크롬 스크롤바 축소 */
}
.filter-buttons::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 999px;
}

.filter-btn {
  flex-shrink: 0; /* 스크롤 가능하도록 자동 줄어듦 방지 */
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
}
.filter-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.place-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.place-card {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.place-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
}
.place-card.active {
  border-color: #007bff;
  background-color: #f0f7ff;
}

.place-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.badge {
  align-self: flex-start;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
}
/* 다양한 신규 카테고리에 상응하는 컬러 매핑 추가 */
.badge.tour { background-color: #e3f2fd; color: #0d47a1; }
.badge.restaurant { background-color: #fff3e0; color: #e65100; }
.badge.leisure { background-color: #e8f5e9; color: #1b5e20; }
.badge.culture { background-color: #f3e5f5; color: #4a148c; }
.badge.shopping { background-color: #fce4ec; color: #880e4f; }
.badge.accommodation { background-color: #efebe9; color: #4e342e; }
.badge.festival { background-color: #fffde7; color: #f57f17; }
.badge.default { background-color: #f1f5f9; color: #475569; }

.place-name {
  font-size: 14px;
  margin: 0;
  color: #212529;
}
.place-address {
  font-size: 11px;
  color: #6c757d;
  margin: 0;
}
.place-desc {
  font-size: 12px;
  color: #495057;
  margin: 0;
  line-height: 1.4;
}

/* 통신 예외 상태 스타일 */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 30px;
  color: #6c757d;
  font-size: 13px;
}
.error-state {
  color: #dc3545;
}

.map-wrapper {
  flex: 1;
  position: relative;
}

.leaflet-map-element {
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>