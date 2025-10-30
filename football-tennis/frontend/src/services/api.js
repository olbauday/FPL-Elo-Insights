/**
 * API Service
 * Handles HTTP requests to the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // User endpoints
  async registerUser(userId, username, email = null) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ userId, username, email })
    });
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async checkUsername(username) {
    return this.request(`/users/check/${username}`);
  }

  // Match endpoints
  async createMatch(userId, username) {
    return this.request('/matches/create', {
      method: 'POST',
      body: JSON.stringify({ userId, username })
    });
  }

  async joinMatch(matchId, userId, username) {
    return this.request(`/matches/join/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ userId, username })
    });
  }

  async getMatch(matchId) {
    return this.request(`/matches/${matchId}`);
  }

  async listMatches() {
    return this.request('/matches');
  }

  async getMatchHistory(userId) {
    return this.request(`/matches/history/${userId}`);
  }

  // Category endpoints
  async getRandomCategory(difficulty = null) {
    const query = difficulty ? `?difficulty=${difficulty}` : '';
    return this.request(`/categories/random${query}`);
  }

  async listCategories() {
    return this.request('/categories');
  }

  async getCategory(categoryId) {
    return this.request(`/categories/${categoryId}`);
  }

  // Leaderboard endpoints
  async getLeaderboard(sortBy = 'elo', limit = 50) {
    return this.request(`/leaderboard?sortBy=${sortBy}&limit=${limit}`);
  }

  async getPlayerStats(userId) {
    return this.request(`/leaderboard/player/${userId}`);
  }

  async getCurrentStreaks() {
    return this.request('/leaderboard/streaks/current');
  }

  async getBestStreaks() {
    return this.request('/leaderboard/streaks/best');
  }
}

const apiService = new ApiService();

export default apiService;
