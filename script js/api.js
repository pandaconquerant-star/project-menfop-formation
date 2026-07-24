// js/api.js

const API_URL = "https://script.google.com/macros/s/AKfycbxcCnq4QKVjWvxFBaJ7yjuaRZCj3ZVcwTVf424E8Tj4EpiSwMc8FziVorHsTbHV5gVC/exec";

class Api {

    static async request(action, params = {}) {

        const url = new URL(API_URL);

        url.searchParams.append("action", action);

        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Erreur réseau");
            }

            return await response.json();

        } catch (error) {

            console.error(error);

            return {
                success: false,
                error: error.message
            };

        }

    }

    static getFormations() {
        return this.request("formations");
    }

    static getFormation(id) {
        return this.request("formation", { id });
    }

}