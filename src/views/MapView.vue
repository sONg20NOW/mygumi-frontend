<template>
  <div class="map-view">
    <div class="breadcrumb">홈 > 지역 지도 보기</div>

    <div class="map-container-layout">
      <div class="sidebar">
        <h2 class="sidebar-title">📍 구미/경북 추천 핫플레이스</h2>
        
        <div class="filter-buttons">
          <button 
            @click="filterType('all')" 
            :class="['filter-btn', { active: currentFilter === 'all' }]"
          >
            전체
          </button>
          <button 
            @click="filterType('tour')" 
            :class="['filter-btn', { active: currentFilter === 'tour' }]"
          >
            🏞️ 관광지
          </button>
          <button 
            @click="filterType('restaurant')" 
            :class="['filter-btn', { active: currentFilter === 'restaurant' }]"
          >
            🍕 맛집
          </button>
        </div>

        <div class="place-list">
          <div 
            v-for="place in filteredPlaces" 
            :key="place.id" 
            @click="focusOnPlace(place)"
            :class="['place-card', { active: selectedPlaceId === place.id }]"
          >
            <div class="place-info">
              <span class="badge" :class="place.type">{{ place.type === 'tour' ? '관광지' : '맛집' }}</span>
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
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const route = useRoute();

// Leaflet 지도 인스턴스 저장용 변수
let map = null;
const markers = [];

// 필터 상태 및 선택된 카드 ID
const currentFilter = ref('all');
const selectedPlaceId = ref(null);

// 구미/경북 공공데이터 기반 목데이터 (위도/경도 좌표값 포함)
const mockPlaces = ref([
  {
    id: 1,
    type: 'tour',
    name: '금오산 도립공원',
    address: '경상북도 구미시 금오산로 402-1a',
    lat: 36.1054,
    lng: 128.3204,
    description: '구미의 상징적인 명산으로, 산책로와 금오지 둘레길이 잘 조성되어 있어 힐링하기 좋습니다.'
  },
  {
    id: 2,
    type: 'tour',
    name: '동락공원',
    address: '경상북도 구미시 3공단1로 281',
    lat: 36.1012,
    lng: 128.3845,
    description: '낙동강변을 따라 조성된 대규모 시민공원으로 자전거 도로와 산책로, 호국용사 기림터가 있습니다.'
  },
  {
    id: 3,
    type: 'restaurant',
    name: '금리단길 뇨끼 전문점 (구미역 뒤편)',
    address: '경상북도 구미시 금오산로16길 12',
    lat: 36.1264,
    lng: 128.3312,
    description: '구미역 뒤편 금리단길에 위치한 숨은 양식 맛집으로 감자 뇨끼와 트러플 크림 소스가 유명합니다.'
  },
  {
    id: 4,
    type: 'restaurant',
    name: '중앙시장 원조 국밥',
    address: '경상북도 구미시 구미중앙로9길 11',
    lat: 36.1285,
    lng: 128.3348,
    description: '구미 새마을중앙시장 내에 위치한 유서 깊은 순대 국밥집으로 깔끔한 육수와 푸짐한 양이 특징입니다.'
  }
]);

// 필터링된 데이터 계산
const filteredPlaces = computed(() => {
  if (currentFilter.value === 'all') return mockPlaces.value;
  return mockPlaces.value.filter(p => p.type === currentFilter.value);
});

// 지도 초기화 함수
const initMap = () => {
  // 기본 중심좌표를 '구미시청' 근처로 설정 (zoom level: 12)
  map = L.map('map').setView([36.1194, 128.3443], 12);

  // OpenStreetMap 타일 레이어 로드
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // 초기 마커 렌더링
  updateMarkers();
};

// 마커 업데이트 및 렌더링
const updateMarkers = () => {
  // 기존 마커 모두 제거
  markers.forEach(m => map.removeLayer(m));
  markers.length = 0;

  // 필터링된 장소들을 기준으로 마커 추가
  filteredPlaces.value.forEach(place => {
    const marker = L.marker([place.lat, place.lng])
      .addTo(map)
      .bindPopup(`<b>${place.name}</b><br><span style="font-size:12px;">${place.address}</span>`);
    
    // 마커 클릭 시 사이드바 카드 활성화 연계
    marker.on('click', () => {
      selectedPlaceId.value = place.id;
    });

    markers.push(marker);
  });
};

// 필터 변경 처리
const filterType = (type) => {
  currentFilter.value = type;
  selectedPlaceId.value = null;
  // Leaflet 마커 동기화 업데이트
  updateMarkers();
};

// 특정 장소 카드 클릭 시 지도를 해당 좌표로 부드럽게 이동하고 팝업 열기
const focusOnPlace = (place) => {
  selectedPlaceId.value = place.id;
  if (map) {
    map.flyTo([place.lat, place.lng], 14, {
      animate: true,
      duration: 1.0
    });
    
    // 해당 좌표와 매핑되는 마커 찾아서 팝업 강제 노출
    const targetMarker = markers.find(m => {
      const latLng = m.getLatLng();
      return latLng.lat === place.lat && latLng.lng === place.lng;
    });
    
    if (targetMarker) {
      targetMarker.openPopup();
    }
  }
};

onMounted(async () => {
  // DOM이 완전히 로드되고 지도가 그려질 크기가 잡힌 후 지도 세팅 진행
  await nextTick();
  initMap();

  // 챗봇 등에서 쿼리 파라미터(?place=명칭)를 넘겨받았을 때 자동 포커싱 처리
  if (route.query.place) {
    const found = mockPlaces.value.find(p => p.name.includes(route.query.place));
    if (found) {
      focusOnPlace(found);
    }
  }
});
</script>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 180px); /* 뷰포트 높이에 맞춤 */
}

.breadcrumb {
  font-size: 14px;
  color: #6c757d;
}

/* 좌우 분할 구조 레이아웃 */
.map-container-layout {
  display: flex;
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

/* 왼쪽 사이드바 */
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

.filter-buttons {
  display: flex;
  padding: 10px;
  gap: 5px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}

.filter-btn {
  flex: 1;
  padding: 8px;
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
.badge.tour { background-color: #e3f2fd; color: #0d47a1; }
.badge.restaurant { background-color: #fff3e0; color: #e65100; }

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

/* 오른쪽 지도 영역 */
.map-wrapper {
  flex: 1;
  position: relative;
}

.leaflet-map-element {
  width: 100%;
  height: 100%;
  z-index: 1; /* 대화창 플로팅보다 아래에 있도록 조정 */
}
</style>