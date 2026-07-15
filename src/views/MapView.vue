<template>
  <div class="map-view">
    <div class="breadcrumb">
      <RouterLink to="/" class="breadcrumb-link">홈</RouterLink>
      <span class="divider"> &gt; </span>
      <span class="current-page">지역 지도 보기</span>
    </div>

    <div class="map-container-layout" ref="mapContainer">
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
        
        <button 
          @click="toggleFullscreen" 
          class="fullscreen-toggle-btn" 
          :title="isFullscreen ? '전체화면 축소' : '전체화면 확대'"
        >
          {{ isFullscreen ? '📺 화면 축소' : '🖥️ 전체화면' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/api/index.js';

// 🌟 [배포판 마커 아이콘 404 해결 핵심] 
// Vite 번들러가 빌드 시 Leaflet 에셋 이미지를 올바르게 추적하여 배포 주소로 매핑하도록 개별 import 처리합니다.
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// 🌟 Leaflet의 기본 에셋 탐색 옵션을 삭제하고 Vite 정적 에셋 주소로 재매핑합니다.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const route = useRoute();

let map = null;
const markers = [];

const places = ref([]);
const isLoading = ref(true);
const error = ref(null);

const currentFilter = ref('all');
const selectedPlaceId = ref(null);

const mapContainer = ref(null);
const isFullscreen = ref(false);

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

const fetchMarkers = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const params = {};
    if (currentFilter.value !== 'all') {
      params.category = currentFilter.value;
    }
    if (route.query.keyword) {
      params.keyword = route.query.keyword;
    }

    const response = await api.get('/api/map/markers', { params });
    if (response.data && response.data.items) {
      places.value = response.data.items;
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

const initMap = () => {
  map = L.map('map').setView([36.1194, 128.3443], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  fetchMarkers();
};

const updateMarkers = () => {
  markers.forEach(m => map.removeLayer(m));
  markers.length = 0;

  places.value.forEach(place => {
    const marker = L.marker([place.latitude, place.longitude])
      .addTo(map)
      .bindPopup(`<b>${place.name}</b><br><span style="font-size:12px;">${place.address}</span>`);
    
    marker.on('click', () => {
      selectedPlaceId.value = place.id;
    });

    markers.push(marker);
  });
};

const filterType = (type) => {
  currentFilter.value = type;
  selectedPlaceId.value = null;
  fetchMarkers();
};

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

const toggleFullscreen = () => {
  if (!mapContainer.value) return;

  if (!document.fullscreenElement) {
    mapContainer.value.requestFullscreen()
      .catch(err => {
        console.error(`전체화면 모드 변경 실패: ${err.message}`);
      });
  } else {
    document.exitFullscreen();
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  
  nextTick(() => {
    if (map) {
      map.invalidateSize();
    }
  });
};

watch(() => route.query, () => {
  fetchMarkers();
}, { deep: true });

onMounted(async () => {
  await nextTick();
  initMap();

  document.addEventListener('fullscreenchange', handleFullscreenChange);

  if (route.query.place) {
    await nextTick();
    const found = places.value.find(p => p.name.includes(route.query.place));
    if (found) {
      focusOnPlace(found);
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

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

.map-container-layout {
  display: flex;
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.map-container-layout:fullscreen {
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
  border: none;
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
  font-weight: bold;
  margin: 0;
  background-color: white;
}

.filter-buttons {
  display: flex;
  padding: 10px;
  gap: 6px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: thin;
}
.filter-buttons::-webkit-scrollbar {
  height: 4px;
}
.filter-buttons::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 999px;
}

.filter-btn {
  flex-shrink: 0;
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

.fullscreen-toggle-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
  background-color: #ffffff;
  color: #333333;
  border: 1px solid #cbd5e1;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}
.fullscreen-toggle-btn:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
  transform: translateY(-1px);
}
</style>