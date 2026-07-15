<template>
  <div class="map-view">
    <div class="breadcrumb">
      <RouterLink to="/" class="breadcrumb-link">홈</RouterLink>
      <span class="divider"> &gt; </span>
      <span class="current-page">지역 지도 보기</span>
    </div>

    <div class="map-container-layout" ref="mapContainer">
      
      <div class="sidebar" :class="{ 'is-closed': !isSidebarOpen }">
        <h2 class="sidebar-title">📍 구미/경북 핫플레이스</h2>
        
        <div class="sidebar-search-box">
          <input 
            v-model="sidebarSearchQuery"
            type="text"
            placeholder="이름이나 주소로 검색..."
            class="sidebar-search-input"
          />
          <button v-if="sidebarSearchQuery" @click="clearSearch" class="search-clear-btn">✕</button>
        </div>
        
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
          <div v-else-if="filteredPlaces.length === 0" class="empty-state">해당하는 장소가 없습니다.</div>

          <div 
            v-else
            v-for="place in filteredPlaces" 
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

      <button 
        @click="toggleSidebar" 
        class="sidebar-toggle-trigger" 
        :class="{ 'is-sidebar-closed': !isSidebarOpen }"
        :title="isSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'"
      >
        {{ isSidebarOpen ? '◀' : '▶' }}
      </button>

      <div class="map-wrapper">
        <div id="map" class="leaflet-map-element"></div>
      </div>

      <button 
        @click="toggleFullscreen" 
        class="fullscreen-toggle-btn" 
        :title="isFullscreen ? '전체화면 축소' : '전체화면 확대'"
      >
        {{ isFullscreen ? '📺 화면 축소' : '🖥️ 전체화면' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/api/index.js';

// [배포판 마커 아이콘 404 해결 로직]
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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

const isSidebarOpen = ref(true);
const mapContainer = ref(null);
const isFullscreen = ref(false);

const sidebarSearchQuery = ref('');

const categoryOptions = [
  { label: '전체', value: 'all' },
  { label: '🏞️ 관광지', value: '관광지' },
  { label: '🍕 음식점', value: '음식점' },
  { label: '🚴 레포츠', value: '레포츠' },
  { label: '🏛️ 문화시설', value: '문화시설' },
  { label: '🛍️ 쇼핑', value: '쇼핑' },
  { label: '🏨 숙박', value: '숙박' },
  { label: '🎉 축제', value: '축제' }
];

// 사이드바 장소 리스트 실시간 필터링
const filteredPlaces = computed(() => {
  const query = sidebarSearchQuery.value.trim().toLowerCase();
  if (!query) return places.value;

  return places.value.filter(place => {
    const matchName = place.name ? place.name.toLowerCase().includes(query) : false;
    const matchAddress = place.address ? place.address.toLowerCase().includes(query) : false;
    return matchName || matchAddress;
  });
});

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

      // 🌟 [버그 해결 및 고도화 핵심] API 조회가 끝나고 데이터가 바인딩된 시점에 라우터 쿼리를 검사합니다.
      if (route.query.place) {
        const queryPlace = route.query.place.trim();
        
        // 장소명에 캘린더에서 넘어온 주소가 포함되어 있거나, 주소가 일치하는 항목 검색
        const found = places.value.find(p => 
          (p.address && queryPlace.includes(p.address)) || 
          (p.name && queryPlace.includes(p.name)) ||
          (p.address && p.address.includes(queryPlace))
        );

        if (found) {
          // 해당 장소 이름을 사이드바 검색창에 자동으로 채워주어 리스트 필터링 연동
          sidebarSearchQuery.value = found.name;
          // 지도 포커싱 및 팝업 오픈
          focusOnPlace(found);
        }
      }
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
  sidebarSearchQuery.value = ''; 
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

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
  
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 310);
};

const clearSearch = () => {
  sidebarSearchQuery.value = '';
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
  // 모바일 화면일 때 기본적으로 왼쪽 사이드바 접힘 처리
  if (window.innerWidth <= 768) {
    isSidebarOpen.value = false;
  }

  await nextTick();
  initMap();

  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 350); 

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  // 🌟 [수정 완료] 기존 onMounted 내부에 불완전하게 존재하던 route.query.place 처리문은 
  // fetchMarkers 데이터 로드 후 시점으로 완전 이관 및 삭제했습니다.
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
  position: relative;
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
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s, opacity 0.2s;
  overflow: hidden;
  z-index: 5;
}

.sidebar.is-closed {
  width: 0px;
  min-width: 0px;
  border-right: none;
  opacity: 0;
  pointer-events: none;
}

.sidebar-title {
  font-size: 16px;
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
  font-weight: bold;
  margin: 0;
  background-color: white;
  white-space: nowrap;
}

.sidebar-search-box {
  position: relative;
  padding: 10px 15px;
  background-color: white;
  border-bottom: 1px solid #dee2e6;
}
.sidebar-search-input {
  width: 100%;
  padding: 8px 30px 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}
.sidebar-search-input:focus {
  border-color: #007bff;
}
.search-clear-btn {
  position: absolute;
  right: 23px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}
.search-clear-btn:hover {
  color: #64748b;
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
  min-width: 330px; 
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

.sidebar-toggle-trigger {
  position: absolute;
  top: 50%;
  left: 350px; 
  transform: translateY(-50%);
  z-index: 6; 
  width: 20px;
  height: 60px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-left: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  color: #475569;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s;
  padding: 0;
}
.sidebar-toggle-trigger:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}
.sidebar-toggle-trigger.is-sidebar-closed {
  left: 0px;
  border-left: 1px solid #cbd5e1;
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
  z-index: 10;  
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

@media (max-width: 768px) {
  .fullscreen-toggle-btn {
    display: none !important; 
  }
}
</style>