// js/api.js

const API_URL = "https://script.google.com/macros/s/AKfycbxcCnq4QKVjWvxFBaJ7yjuaRZCj3ZVcwTVf424E8Tj4EpiSwMc8FziVorHsTbHV5gVC/exec";

// MODE D'ENVOI (choix automatique) :
//  - serveur HTTP activé (http://localhost...) -> fetch classique
//  - fichier ouvert en direct (file://...)      -> iframe cachée (sans serveur)
// Tu peux forcer un mode en réglant cette variable à true ou false.
const FORCE_MODE_LOCAL = null; // null = automatique, true = sans serveur, false = serveur

const MODE_LOCAL = FORCE_MODE_LOCAL !== null
    ? FORCE_MODE_LOCAL
    : window.location.protocol === "file:";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const _prefetch = MODE_LOCAL ? null : fetch(API_URL + "?action=formations").catch(() => {});

class Api {

    static getCacheKey(action, params) {
        return "api_" + action + "_" + JSON.stringify(params);
    }

    static getFromCache(key) {
        // En mode local (file://) le stockage du navigateur est bloqué (origine "null") :
        // on n'y touche pas pour éviter les avertissements de Tracking Prevention.
        if (MODE_LOCAL) return null;
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
        if (MODE_LOCAL) return true;
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
        if (MODE_LOCAL) return;
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
        if (forceRefresh && !MODE_LOCAL) {
            const cacheKey = this.getCacheKey("formations", {});
            localStorage.removeItem(cacheKey);
        }
        return this.request("formations");
    }

    static getFormation(id) {
        return this.request("formation", { id });
    }

    static async inscrire(data) {
        // Si MODE_LOCAL (sans serveur, fichier ouvert en file://) :
        // fetch POST vers Apps Script est bloqué par CORS -> on utilise l'iframe cachée.
        // Sinon (serveur activé) : on garde le fetch classique.
        if (MODE_LOCAL) {
            return this._inscrireViaIframe(data);
        }

        const url = new URL(API_URL);
        url.searchParams.append("action", "inscription");
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                },
                body: new URLSearchParams(data),
            });
            if (!response.ok) throw new Error("Erreur réseau");
            return await response.json();
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    }

    // Envoie l'inscription via un formulaire POST dans une iframe cachée.
    // Le POST d'un formulaire dans un iframe n'est pas soumis à CORS ; la réponse
    // Apps Script renvoie le résultat à la page parente grâce à postMessage.
    static _inscrireViaIframe(data) {
        return new Promise(resolve => {
            const iframeName = "iframeInscription" + Date.now();
            const iframe = document.createElement("iframe");
            iframe.name = iframeName;
            iframe.id = iframeName;
            iframe.style.display = "none";
            document.body.appendChild(iframe);

            const form = document.createElement("form");
            form.method = "POST";
            form.action = API_URL;
            form.target = iframeName;
            form.style.display = "none";

            const params = Object.assign({ action: "inscription", format: "iframe" }, data);
            Object.keys(params).forEach(key => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = params[key];
                form.appendChild(input);
            });

            const cleanup = () => {
                clearTimeout(delai);
                window.removeEventListener("message", onMessage);
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                if (form.parentNode) form.parentNode.removeChild(form);
            };

            const onMessage = e => {
                cleanup();
                resolve(e.data || { success: false, error: "Réponse invalide" });
            };

            const delai = setTimeout(() => {
                cleanup();
                resolve({ success: false, error: "Délai dépassé lors de l'envoi." });
            }, 30000);

            window.addEventListener("message", onMessage);
            document.body.appendChild(form);
            form.submit();
        });
    }
}