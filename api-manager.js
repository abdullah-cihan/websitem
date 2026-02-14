// Browser-based API manager implementation for Google Apps Script API

class ApiManager {
    constructor() {
        this.cache = {};
        this.rateLimit = 5; // limit to 5 requests per minute
        this.requests = 0;
        this.lastRequestTime = null;
    }

    async fetch(url, options) {
        // Error handling
        try {
            // Check rate limiting
            const now = Date.now();
            if (this.lastRequestTime && now - this.lastRequestTime < 60000 && this.requests >= this.rateLimit) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            // Cache busting
            const cacheKey = `${url}?${new Date().getTime()}`; // Append timestamp to URL
            if (this.cache[cacheKey]) {
                return this.cache[cacheKey];
            }

            // Perform the fetch request
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            // Update cache
            this.cache[cacheKey] = data;

            // Update rate limit tracking
            this.requests += 1;
            if (!this.lastRequestTime || now - this.lastRequestTime >= 60000) {
                this.requests = 1;
                this.lastRequestTime = now;
            }

            return data;

        } catch (error) {
            console.error('Fetch Error: ', error);
            throw error; // Re-throw the error for further handling
        }
    }
}