import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import BoardListView from '../views/BoardListView.vue';
import BoardDetailView from '../views/BoardDetailView.vue';
import BoardWriteView from '../views/BoardWriteView.vue';
// (선택 기능) 지도 시각화 페이지
import MapMapView from '../views/MapView.vue'; 
import FestivalCalendarView from '../views/FestivalCalendarView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView, // 메인 홈 화면 (소개 배너, 최근 게시글, 카테고리 바로가기)
  },
  {
    path: '/board',
    name: 'board-list',
    component: BoardListView, // 게시판 목록 화면 (카테고리별 필터링 가능)
  },
  {
    path: '/board/:id',
    name: 'board-detail',
    component: BoardDetailView, // 게시글 상세 화면 (비밀번호 확인 모달 포함)
    props: true,
  },
  {
    path: '/board/write',
    name: 'board-write',
    component: BoardWriteView, // 게시글 작성 화면
  },
  {
    path: '/board/edit/:id',
    name: 'board-edit',
    component: BoardWriteView, // 게시글 수정 화면 (작성 화면 컴포넌트 재사용)
    props: true,
  },
  {
    path: '/map',
    name: 'map-view',
    component: MapMapView, // (선택 기능) Leaflet.js 기반 구미/경북 관광지·맛집 지도 핀 시각화 화면
  },
  {
    path: '/calendar',
    name: 'calendar-view',
    component: FestivalCalendarView,
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;