/**
 * File: green-api.js
 * Description: Unified module for all Green-API communications.
 * Version: 12.0.1
 * --- CHANGELOG ---
 * V12.0.1:
 * - VERIFIED: Confirmed checkWhatsapp availability for safe-sending logic.
 * V12.0.0:
 * - REVERT: Reverted the `sendFile` function back to the original server-side proxy method.
 */

const GreenAPI = (() => {
    let isInitialized = false;
    let connectionCheckInterval = null;
    const DOMElements = {};

    const _cacheDOMElements = () => {
        DOMElements.profileButton = document.querySelector('[data-action="open-profile-modal"]');
        DOMElements.accountModal = document.getElementById('accountModal');
        if (DOMElements.accountModal) {
            DOMElements.accountInfo = DOMElements.accountModal.querySelector('#accountInfo');
            DOMElements.statusButton = DOMElements.accountModal.querySelector('#statusButton');
        }
        DOMElements.qrModal = document.getElementById('qrModal');
        if (DOMElements.qrModal) {
            DOMElements.qrStatusText = DOMElements.qrModal.querySelector('#qrStatusText');
            DOMElements.qrCode = DOMElements.qrModal.querySelector('#qrCode');
        }
    };

    const _setupEventListeners = () => {
        document.body.addEventListener('click', (e) => {
            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) {
                if (e.target.classList.contains('modal')) e.target.classList.remove('visible');
                return;
            }
            const action = actionTarget.dataset.action;
            switch (action) {
                case 'open-profile-modal': _showAccountModal(); break;
                case 'close-modal': actionTarget.closest('.modal')?.classList.remove('visible'); break;
                case 'toggle-connection': _toggleConnection(); break;
            }
        });
    };

    const _fetch = async (endpoint, options = {}) => {
        const proxyUrl = `${crm_config.rest_url}/green-api-proxy/${endpoint}`;
        const headers = { 'X-WP-Nonce': crm_config.nonce };

        // IMPORTANT: Do not set Content-Type for FormData, browser does it automatically with boundary.
        if (options.body && typeof options.body === 'string') {
            headers['Content-Type'] = 'application/json';
        }

        const fetchConfig = { ...options, headers: { ...headers, ...options.headers } };

        try {
            const response = await fetch(proxyUrl, fetchConfig);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: 'Could not parse error response.' }));
                const error = new Error(errorBody.message || `Server returned error ${response.status}`);
                error.status = response.status;
                error.data = errorBody.data || {};
                error.code = errorBody.code || null;
                throw error;
            }
            return await response.json();
        } catch (error) {
            console.error(`Green-API Proxy Error on ${endpoint}:`, error);
            throw error;
        }
    };
    
    const _showAccountModal = async () => { if (!DOMElements.accountModal) return; DOMElements.accountModal.classList.add('visible'); DOMElements.accountInfo.innerHTML = '<div class="loading-spinner"></div>'; try { const state = await _fetch('getStateInstance'); const settings = await _fetch('getSettings'); _updateAccountUI(state, settings); } catch (error) { _updateAccountUI({ stateInstance: 'error' }, {}); CRM_APP.utils.showNotification(error, 'error'); } };
    const _updateAccountUI = (state, settings) => { const isConnected = state.stateInstance === 'authorized'; const phoneNumber = settings.wid ? settings.wid.replace('@c.us', '') : 'לא זמין'; const statusText = isConnected ? 'מחובר' : 'לא מחובר'; const statusClass = isConnected ? 'status-active' : 'status-inactive'; DOMElements.accountInfo.innerHTML = `<div class="account-details"><div class="account-avatar">${settings.avatar ? `<img src="${settings.avatar}" alt="Avatar">` : '<span class="material-icons">person</span>'}</div><p><span class="detail-label">מספר טלפון:</span> <span class="detail-value">${phoneNumber}</span></p><p><span class="detail-label">מצב:</span> <span class="detail-value ${statusClass}">${statusText}</span></p></div>`; DOMElements.statusButton.className = isConnected ? 'btn-danger status-button connected' : 'btn-primary status-button disconnected'; DOMElements.statusButton.innerHTML = isConnected ? `<span class="material-icons">logout</span> התנתק` : `<span class="material-icons">qr_code_scanner</span> התחבר באמצעות QR`; };
    const _toggleConnection = () => { if (DOMElements.statusButton.classList.contains('connected')) _logout(); else { DOMElements.accountModal.classList.remove('visible'); _showQRModal(); } };
    const _logout = async () => { CRM_APP.utils.showLoader(); try { const result = await _fetch('logout'); if (result.isLogout) { CRM_APP.utils.showNotification('התנתקת בהצלחה. מרענן עמוד...', 'success'); setTimeout(() => window.location.reload(), 1500); } else { throw new Error('Logout failed on server.'); } } catch (error) { CRM_APP.utils.showNotification(error, 'error'); } finally { CRM_APP.utils.hideLoader(); } };
    const _showQRModal = async () => { if (!DOMElements.qrModal) return; DOMElements.qrModal.classList.add('visible'); _updateQRStatus('מבקש קוד QR...', 'loading'); DOMElements.qrCode.src = ''; try { const qrData = await _fetch('qr'); if (qrData.type === 'qrCode') { DOMElements.qrCode.src = `data:image/png;base64,${qrData.message}`; _updateQRStatus('סרוק את הקוד באמצעות WhatsApp', 'info'); _startConnectionCheck(); } else { throw new Error('QR response invalid.'); } } catch (error) { _updateQRStatus(`שגיאה בקבלת קוד QR: ${error.message}`, 'error'); } };
    const _updateQRStatus = (message, type) => { DOMElements.qrStatusText.textContent = message; DOMElements.qrStatusText.className = `qr-status-text qr-status-${type}`; };
    const _startConnectionCheck = () => { if (connectionCheckInterval) clearInterval(connectionCheckInterval); connectionCheckInterval = setInterval(async () => { try { const state = await _fetch('getStateInstance'); if (state.stateInstance === 'authorized') { clearInterval(connectionCheckInterval); DOMElements.qrModal.classList.remove('visible'); CRM_APP.utils.showNotification('התחברת בהצלחה! מרענן עמוד...', 'success'); setTimeout(() => window.location.reload(), 1500); } } catch (error) { console.warn("Connection check failed, will retry.", error); } }, 2500); };
    
    return {
        init() {
            if (isInitialized) return;
            _cacheDOMElements();
            _setupEventListeners();
            isInitialized = true;
        },
        async sendMessage(phoneNumber, message) {
            const chatId = `${CRM_APP.utils.cleanPhoneNumber(phoneNumber)}@c.us`;
            const formattedMessage = message.replace(/\n/g, '\r\n');
            return await _fetch('sendMessage', { 
                method: 'POST', 
                body: JSON.stringify({ chatId, message: formattedMessage }) 
            });
        },
        
        async sendFile(phoneNumber, file, caption = '') {
            const chatId = `${CRM_APP.utils.cleanPhoneNumber(phoneNumber)}@c.us`;
            const formData = new FormData();
            formData.append('chatId', chatId);
            formData.append('file', file, file.name);

            if (caption) {
                const formattedCaption = caption.replace(/\n/g, '\r\n');
                formData.append('caption', formattedCaption);
            }
            
            return await _fetch('sendFileByUpload', {
                method: 'POST',
                body: formData
            });
        },
        
        async getGroupData(groupId) { return await _fetch('getGroupData', { method: 'POST', body: JSON.stringify({ groupId }) }); },
        async getContacts() { return await _fetch('GetContacts', { method: 'GET' }); },
        async deleteMessage(chatId, messageId) { return await _fetch('deleteMessage', { method: 'POST', body: JSON.stringify({ chatId: chatId, idMessage: messageId }) }); },
        async getMessageStatus(chatId, messageId) { return await _fetch('getMessage', { method: 'POST', body: JSON.stringify({ chatId: chatId, idMessage: messageId }) }); },
        async checkWhatsapp(phoneNumber) { const cleanPhone = CRM_APP.utils.cleanPhoneNumber(phoneNumber); return await _fetch('checkWhatsapp', { method: 'POST', body: JSON.stringify({ phoneNumber: cleanPhone }) }); }
    };
})();
window.GreenAPI = GreenAPI;