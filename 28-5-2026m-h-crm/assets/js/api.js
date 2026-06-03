/**
 * File: api.js
 * Description: This module handles all communication with the internal CRM REST API.
 * @version 15.1.0
 */

const API = (() => {
    'use strict';
    let isInitialized = false;
    const config = { BASE_URL: '', NONCE: '' };

    const _mapContactData = (response) => ({
        id: response.id || null, status: response.status || 'active', conta_name: response.conta_name || '', f_m: response.f_m || '',
        conta_phone: String(response.conta_phone || ''), gender: response.gender || '', tg1: response.tg1 || '', tg2: response.tg2 || '',
        tg3: response.tg3 || '', email: response.email || '', work_phone: response.work_phone || '', website: response.website || '',
        company_name: response.company_name || '', job_title: response.job_title || '', lead_source: response.lead_source || '',
        notes: response.notes || '', birth_date: response.birth_date || '', city: response.city || '', street: response.street || '',
        events: response.events || [], form_submissions: response.form_submissions || [], last_form_name: response.last_form_name || null,
        last_form_page: response.last_form_page || null, last_form_submission_date: response.last_form_submission_date || null,
        last_message_read_status: response.last_message_read_status || 'unknown', total_spent: response.total_spent || 0.00,
        order_count: response.order_count || 0, last_order_date: response.last_order_date || null
    });

    const _fetch = async (endpoint, options = {}, returnFullResponse = false, namespace = 'mh-crm/v1') => {
        let url;
        if (endpoint.includes('/v1/')) {
            // Full or relative path with namespace already provided
            const siteUrl = config.BASE_URL.split('/wp-json/')[0];
            url = `${siteUrl}/wp-json${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        } else {
            const baseUrl = config.BASE_URL.replace('mh-crm/v1', namespace);
            url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        }
        
        const headers = { 'Content-Type': 'application/json', 'X-WP-Nonce': config.NONCE };
        const fetchConfig = { ...options, headers: { ...headers, ...options.headers } };

        try {
            const response = await fetch(url, fetchConfig);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: 'שגיאת שרת לא ידועה.' }));
                const error = new Error(errorBody.message || `שגיאה ${response.status}`);
                error.status = response.status;
                error.data = errorBody.data || {};
                throw error;
            }
            if (returnFullResponse) return response;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) return await response.json();
            return { success: true };
        } catch (error) {
            console.error(`API Error on ${url}:`, error);
            throw error;
        }
    };

    const init = () => {
        if (isInitialized) return;
        if (typeof crm_config !== 'undefined') {
            config.BASE_URL = crm_config.rest_url || '';
            config.NONCE = crm_config.nonce || '';
        }
        isInitialized = true;
    };

    return {
        init,
        post: async (endpoint, data) => await _fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
        get: async (endpoint) => await _fetch(endpoint, { method: 'GET' }),

        async getContacts(params = {}) {
            // ניקוי פרמטרים למניעת "undefined" בשרת
            const cleanParams = {};
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== 'undefined' && params[key] !== null) {
                    cleanParams[key] = params[key];
                }
            });
            if (!cleanParams.page) cleanParams.page = 1;
            if (!cleanParams.per_page) cleanParams.per_page = 50;

            if (!cleanParams._) cleanParams._ = Date.now(); // Cache buster
            const query = new URLSearchParams(cleanParams).toString();
            const response = await _fetch(`/contacts?${query}`, {}, true);
            const contacts = await response.json();
            return {
                contacts: contacts.map(_mapContactData),
                total: parseInt(response.headers.get('X-WP-Total') || '0', 10),
                totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '0', 10)
            };
        },

        async getContact(id) {
            if (!id) return null;
            const response = await this.get(`/contacts/${id}`);
            return _mapContactData(response);
        },

        async getAllContacts() {
            return (await this.getContacts({ per_page: -1 })).contacts;
        },

        async getContactOrders(phone, email) {
            let q = '';
            if (phone) q += `phone=${encodeURIComponent(phone)}`;
            if (email) q += (q ? '&' : '') + `email=${encodeURIComponent(email)}`;
            return q ? await this.get(`/contacts/orders?${q}`) : { orders: [], stats: {} };
        },

        async getContactOrderDetails(orderId) { return await this.get(`/contacts/order/${orderId}`); },
        async getStats() { return await _fetch(`/contacts/stats?_=${Date.now()}`); },
        async getFilters() { return await _fetch('/contacts/filters'); },
        async createContact(data) { return _mapContactData(await this.post('/contacts', data)); },
        async updateContact(id, data) { return _mapContactData(await _fetch(`/contacts/${id}`, { method: 'POST', body: JSON.stringify(data) })); },
        async deleteContact(id) { return await _fetch(`/contacts/${id}`, { method: 'DELETE' }); },
        async bulkAction(action, ids) { return await this.post('/contacts/bulk-action', { action, ids }); },
        async importContacts(contacts) { return await this.post('/contacts/import', { contacts }); },
        async getWhatsappContactHistory(phone) {
            const p = String(phone || '').replace(/\D/g, '');
            return p ? await this.get(`/whatsapp/contact-history/${p}`) : [];
        },
        async syncWhatsappMessages() {
            return await _fetch('/sync-all', { method: 'POST' }, false, 'mh-whatsapp/v1');
        },
        async syncContactWhatsapp(phone) {
            return await _fetch('/sync-contact', { method: 'POST', body: JSON.stringify({ phone }) }, false, 'mh-whatsapp/v1');
        },
        async deleteWhatsappMessage(chatId, idMessage) {
            return await _fetch('/delete-message', { method: 'DELETE', body: JSON.stringify({ chatId, idMessage }) }, false, 'mh-whatsapp/v1');
        },
        async saveMessageHistory(data) {
            return await this.post('/save-message-history', data);
        }
    };
})();
window.API = API;