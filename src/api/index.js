// frontend/src/api/index.js
import axios from 'axios';

// Vite 환경변수에서 백엔드 주소를 가져옵니다.
const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5초 동안 응답이 없으면 타임아웃
});

export default api;