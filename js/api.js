// js/api.js

const API_URL = "https://script.google.com/macros/s/AKfycbxcCnq4QKVjWvxFBaJ7yjuaRZCj3ZVcwTVf424E8Tj4EpiSwMc8FziVorHsTbHV5gVC/exec";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const _prefetch = fetch(API_URL + "?action=formations").catch(() => {});

class Api {

    static getCacheKey(action, params) {
        return "api_" + action + "_" + JSON.stringify(params);
    }

    static getFromCache(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const entry = JSON.parse(raw);
            if (Date.now() - entry.timestamp > CACHE_TTL) {
                return entry.data;
            }
            return entry.data;
        } catch {
            return null;
        }
    }

    static isExpired(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return true;
            const entry = JSON.parse(raw);
            return Date.now() - entry.timestamp > CACHE_TTL;
        } catch {
            return true;
        }
    }

    static setCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
        } catch {
            // localStorage plein ou désactivé — ignoré
        }
    }

    static _fetchAndCache(cacheKey, action, params) {
        const url = new URL(API_URL);
        url.searchParams.append("action", action);
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("Erreur réseau");
                return response.json();
            })
            .then(data => {
                if (data.success) this.setCache(cacheKey, data);
                return data;
            })
            .catch(error => {
                console.error(error);
                return { success: false, error: error.message };
            });
    }

    static async request(action, params = {}) {
        const cacheKey = this.getCacheKey(action, params);
        const cached = this.getFromCache(cacheKey);
        const expired = this.isExpired(cacheKey);

        if (cached && !expired) return cached;

        if (cached && expired) {
            this._fetchAndCache(cacheKey, action, params);
            return cached;
        }

        return this._fetchAndCache(cacheKey, action, params);
    }

    static async getFormations(forceRefresh = false) {
        if (forceRefresh) {
            const cacheKey = this.getCacheKey("formations", {});
            localStorage.removeItem(cacheKey);
        }
        return this.request("formations");
    }

    static getFormation(id) {
        return this.request("formation", { id });
    }

}