export const API_URL = "https://jsonplaceholder.typicode.com";

// Cliente REST genérico com métodos para CRUD
export default class RestClient {
  constructor(baseUrl, resource) {
    this.endpoint = `${baseUrl}/${resource}`;
  }

  async request(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    } catch (error) {
      console.error(`API Error:`, error);
      throw error;
    }
  }

  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(query ? `${this.endpoint}?${query}` : this.endpoint);
  }

  async getById(id) {
    return this.request(`${this.endpoint}/${id}`);
  }

  async create(data) {
    return this.request(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async update(id, data) {
    return this.request(`${this.endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async delete(id) {
    return this.request(`${this.endpoint}/${id}`, { method: 'DELETE' });
  }
}