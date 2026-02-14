// api-manager.js

/**
 * API Manager for comprehensive API request management
 *
 * This module handles API requests with features like error handling,
 * rate limiting, and cache busting.
 */

const axios = require('axios');

class ApiManager {
    constructor(baseURL) {
        this.api = axios.create({
            baseURL,
            timeout: 10000,
        });
        this.cache = {};
        this.rateLimit = 5; // requests per minute
        this.requests = 0;
        this.queue = [];
        this.queueInterval = setInterval(this.processQueue.bind(this), 60000);
    }

    async request(endpoint, params = {}, forceRefresh = false) {
        const cacheKey = JSON.stringify({ endpoint, params });

        // Cache busting logic
        if (!forceRefresh && this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        // Rate limiting logic
        if (this.requests >= this.rateLimit) {
            return new Promise((resolve, reject) => {
                this.queue.push({ endpoint, params, resolve, reject });
            });
        }

        this.requests++;

        try {
            const response = await this.api.get(endpoint, { params });
            this.cache[cacheKey] = response.data;
            return response.data;
        } catch (error) {
            this.handleError(error);
            throw error;
        } finally {
            this.requests--;
        }
    }

    handleError(error) {
        console.error('API Error:', error.message);
        // You can enhance this to log errors to an external service
    }

    processQueue() {
        while (this.queue.length > 0 && this.requests < this.rateLimit) {
            const { endpoint, params, resolve, reject } = this.queue.shift();
            this.request(endpoint, params)
                .then(resolve)
                .catch(reject);
        }
    }
}

module.exports = ApiManager;
