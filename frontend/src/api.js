/**
 * StudyMatch API Client
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function fetchJSON(url, options = {}) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
    } catch (_) {}
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Health & stats
  getHealth: () => fetchJSON('/health'),

  // Courses catalog
  getCourses: () => fetchJSON('/courses'),

  // Students
  getStudents: () => fetchJSON('/students'),
  getStudent: (id) => fetchJSON(`/students/${id}`),
  createStudent: (data) => fetchJSON('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Groups
  getGroups: () => fetchJSON('/groups'),
  getGroup: (id) => fetchJSON(`/groups/${id}`),
  triggerMatching: (params = {}) => fetchJSON('/match', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  rematchStudent: (studentId, params = {}) => fetchJSON(`/students/${studentId}/rematch`, {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  // Messages
  getGroupMessages: (groupId) => fetchJSON(`/groups/${groupId}/messages`),
  postGroupMessage: (groupId, msgData) => fetchJSON(`/groups/${groupId}/messages`, {
    method: 'POST',
    body: JSON.stringify(msgData),
  }),

  // Graph Visualization
  getGraphData: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON(`/graph${query ? `?${query}` : ''}`);
  },

  // Seed data
  triggerSeed: () => fetchJSON('/seed', { method: 'POST' }),
};
