/**
 * File: app.js
 * Description: The main application script and central hub for the M.H CRM.
 * This file initializes all modules, provides shared utility functions, and manages the global state.
 * Version: 13.0.0 (Optimized with robust Add-on Initializer)
 * --- CHANGELOG ---
 * V13.0.0:
 * - REFACTORED: Replaced the simple array-based add-on loader with a robust, object-based registration system.
 * Add-ons now register themselves into a global `CRM_ADDON_MODULES` object, which the core app then initializes.
 * This prevents race conditions and ensures a stable, predictable loading order for all components.
 * V12.0.0:
 * - ADDED: Logic to auto-initialize registered add-on modules.
 */

const CRM_APP = {
    state: {
        isInitialized: false,
    },

    DOMElements: {},

    utils: {
        cleanPhoneNumber(phoneNumber) {
            let cleanNumber = String(phoneNumber || '').replace(/\D/g, '');
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }
            if (cleanNumber && !cleanNumber.startsWith('972')) {
                cleanNumber = '972' + cleanNumber;
            }
            return cleanNumber;
        },

        getFriendlyErrorMessage(error) {
            const message = error.message || '';
            if (message.includes('403') || message.toLowerCase().includes('forbidden')) {
                return 'אין לך הרשאה לבצע פעולה זו.';
            }
            if (message.includes('Failed to fetch')) {
                return 'שגיאת רשת. אנא בדוק את חיבור האינטרנט שלך ונסה שוב.';
            }
            return `אירעה שגיאה: ${message}`;
        },

        showNotification(message, type = 'success') {
            if (type === 'error' && message instanceof Error) {
                message = this.getFriendlyErrorMessage(message);
            }

            const container = CRM_APP.DOMElements.notificationContainer;
            if (!container) return;
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = message;
            container.appendChild(notification);

            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        },

        showLoader() {
            if (CRM_APP.DOMElements.loadingOverlay) {
                CRM_APP.DOMElements.loadingOverlay.style.display = 'flex';
            }
        },

        hideLoader() {
            if (CRM_APP.DOMElements.loadingOverlay) {
                CRM_APP.DOMElements.loadingOverlay.style.display = 'none';
            }
        },
        
        showProgress(text = 'מעבד...') {
            if (CRM_APP.DOMElements.progressOverlay) {
                CRM_APP.DOMElements.progressText.textContent = text;
                CRM_APP.DOMElements.progressBar.style.width = '0%';
                CRM_APP.DOMElements.progressOverlay.style.display = 'flex';
            }
        },

        updateProgress(percentage, text) {
            if (CRM_APP.DOMElements.progressOverlay) {
                CRM_APP.DOMElements.progressBar.style.width = `${percentage}%`;
                if (text) {
                    CRM_APP.DOMElements.progressText.textContent = text;
                }
            }
        },

        hideProgress() {
            if (CRM_APP.DOMElements.progressOverlay) {
                setTimeout(() => {
                    CRM_APP.DOMElements.progressOverlay.style.display = 'none';
                }, 500);
            }
        }
    },

    /**
     * Caches frequently accessed DOM elements.
     */
    cacheDOMElements() {
        this.DOMElements.notificationContainer = document.getElementById('notificationContainer');
        this.DOMElements.loadingOverlay = document.getElementById('loadingOverlay');
        this.DOMElements.progressOverlay = document.getElementById('progressOverlay');
        this.DOMElements.progressBar = document.getElementById('progressBar');
        this.DOMElements.progressText = document.getElementById('progressText');
    },

    /**
     * Initializes the entire CRM application.
     */
    init() {
        if (this.state.isInitialized) return;
        
        console.log('%cM.H CRM: Initializing core modules...', 'color: blue; font-weight: bold;');

        if (typeof crm_config === 'undefined' || !crm_config.rest_url) {
            console.error('M.H CRM: Configuration object (crm_config) is missing. App cannot start.');
            return;
        }
        
        this.cacheDOMElements();

        // Initialize core modules first
        const coreModules = ['API', 'UI'];
        coreModules.forEach(moduleName => {
            if (window[moduleName] && typeof window[moduleName].init === 'function') {
                try {
                    window[moduleName].init();
                    console.log(`M.H CRM: ${moduleName} module initialized.`);
                } catch (error) {
                    console.error(`M.H CRM: Error initializing ${moduleName} module.`, error);
                }
            } else {
                 console.warn(`M.H CRM: Core module ${moduleName} not found.`);
            }
        });

        // --- NEW: Robust add-on initialization ---
        window.CRM_ADDON_MODULES = window.CRM_ADDON_MODULES || {}; // Ensure the object exists

        console.log(`%cM.H CRM: Found ${Object.keys(window.CRM_ADDON_MODULES).length} add-on module(s). Initializing...`, 'color: purple; font-weight: bold;');

        for (const moduleName in window.CRM_ADDON_MODULES) {
            if (window.CRM_ADDON_MODULES.hasOwnProperty(moduleName)) {
                const module = window.CRM_ADDON_MODULES[moduleName];
                if (module && typeof module.init === 'function') {
                    try {
                        module.init();
                        console.log(`M.H CRM: Add-on module '${moduleName}' initialized.`);
                    } catch (error) {
                        console.error(`M.H CRM: Error initializing add-on module '${moduleName}'.`, error);
                    }
                } else {
                    console.warn(`M.H CRM: Add-on module '${moduleName}' not found or has no init method.`);
                }
            }
        }

        this.state.isInitialized = true;
        console.log('%cM.H CRM: Core & Add-on Initialization Complete.', 'color: green; font-weight: bold;');
    }
};

window.CRM_APP = CRM_APP;