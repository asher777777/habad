/**
 * File: whatsapp-init.js
 * Description: Initializes all WhatsApp Add-on modules using the core CRM registration system.
 * This script runs after all other addon modules are loaded. It safely extends the core API and then
 * registers all its sub-modules with the main CRM app for a unified initialization process.
 *
 * @package M_H_WhatsApp_Addon
 * @version 17.0.0
 * --- CHANGELOG ---
 * V17.0.0:
 * - REFACTORED: Implemented the new standardized add-on registration system.
 * - FIX: Instead of initializing modules directly, this script now safely extends `window.API` and then
 * registers all its components (GreenAPI, GroupManager, etc.) with the `window.CRM_ADDON_MODULES` object.
 * This delegates the final `init()` call to the core `app.js`, completely resolving the race condition.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Define the WhatsApp API extensions in a self-contained object
    // This makes the extension clear and manageable.
    const WhatsApp_API_Extensions = {
        saveMessageHistory: async (data) => await window.API.post('save-message-history', data),
        getMessageHistory: async (page = 1) => await window.API.get(`message-history?page=${page}`),
        getMessageRecipients: async (id) => await window.API.get(`get-message-recipients/${id}`),
        bulkDeleteMessageHistory: async (ids) => await window.API.post('bulk-delete-history', { ids }),
    };

    // 2. Safely extend the main API object. This must be done before modules are initialized.
    if (window.API) {
        Object.assign(window.API, WhatsApp_API_Extensions);
        console.log('WhatsApp Addon: window.API extended successfully.');
    } else {
        console.error('WhatsApp Addon: Critical Error! window.API is not available for extension.');
        return; // Stop execution if the core API is missing.
    }
    
    // 3. Register all available WhatsApp modules with the core app's initializer.
    // The core app will be responsible for calling the .init() method on each of these.
    window.CRM_ADDON_MODULES = window.CRM_ADDON_MODULES || {};

    if (window.GreenAPI) {
        window.CRM_ADDON_MODULES.GreenAPI = window.GreenAPI;
    }
    if (window.GroupManager) {
        window.CRM_ADDON_MODULES.GroupManager = window.GroupManager;
    }
    if (window.UI && window.UI.groupSend) {
        // Use a unique name to avoid potential conflicts with other UI modules
        window.CRM_ADDON_MODULES.GroupSend = window.UI.groupSend;
    }
    if (window.MessageHistory) {
        window.CRM_ADDON_MODULES.MessageHistory = window.MessageHistory;
    }

    console.log('WhatsApp Addon: All modules have been registered with the core initializer.');
});