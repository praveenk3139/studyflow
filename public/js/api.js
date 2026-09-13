// StudyFlow AI - Client API & Audio Notification System
const API_BASE = '/api';

const api = {
  token: localStorage.getItem('sf_token') || '',

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('sf_token', token);
    else localStorage.removeItem('sf_token');
  },

  async request(endpoint, method = 'GET', data = null, isFormData = false) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = { method, headers };

    if (data) {
      if (isFormData) {
        config.body = data;
      } else {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(data);
      }
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP error ${res.status}`);
      }
      return json;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      showToast(err.message, 'error');
      throw err;
    }
  },

  get(endpoint) { return this.request(endpoint, 'GET'); },
  post(endpoint, data, isFormData = false) { return this.request(endpoint, 'POST', data, isFormData); },
  put(endpoint, data) { return this.request(endpoint, 'PUT', data); },
  delete(endpoint) { return this.request(endpoint, 'DELETE'); }
};

// Web Audio API Synthesizer for Clean Academic/Mindful Sound Effects
const audioContext = window.AudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playAudioChime(type = 'chime') {
  if (!audioContext) return;
  try {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);

    const now = audioContext.currentTime;

    if (type === 'success' || type === 'task_complete') {
      // Harmonic arpeggio (C5 -> E5 -> G5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'water') {
      // Soft water droplet tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'break') {
      // Calming low bell tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(432, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.2);
    } else {
      // Gentle notification pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // Ignore autoplay restriction errors
  }
}

// Toast Notification Manager
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    info: '💡',
    warning: '⚠️',
    error: '❌'
  };

  toast.innerHTML = `
    <span>${icons[type] || '💡'}</span>
    <div style="flex: 1;">${message}</div>
  `;

  container.appendChild(toast);
  playAudioChime(type === 'success' ? 'success' : 'chime');

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
