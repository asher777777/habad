/**
 * File: message-history.js
 * Description: Manages the Message History interface, now part of the WhatsApp Add-on.
 * Version: 3.3.0
 * --- CHANGELOG ---
 * V3.3.0:
 * - FEATURE: The message preview column now displays the full message text.
 * - FEATURE: Added a copy button to each message row for easy copying.
 * V3.2.0:
 * - CRITICAL FIX: In '_handleBulkAction', after a successful bulk delete API call, the UI was not
 * refreshing. Added logic to manually remove the deleted rows directly from the DOM, providing
 * immediate visual feedback to the user and ensuring the UI reflects the database state.
 */

const MessageHistory = (() => {
    let isInitialized = false;
    const state = {
        currentPage: 1,
        totalPages: 1,
    };
    const DOMElements = {};

    /**
     * Caches DOM elements for faster access.
     */
    const _cacheDOMElements = () => {
        const wrapper = document.getElementById('message-history-app-wrapper');
        if (!wrapper) return false;
        
        DOMElements.wrapper = wrapper;
        DOMElements.loadBtn = wrapper.querySelector('#loadHistoryBtn');
        DOMElements.tableBody = wrapper.querySelector('#messageHistoryTableBody');
        DOMElements.pagination = wrapper.querySelector('#messageHistoryPagination');
        DOMElements.pageNumbers = wrapper.querySelector('#msgHistoryPageNumbers');
        DOMElements.prevPageBtn = wrapper.querySelector('#msgHistoryPrevPage');
        DOMElements.nextPageBtn = wrapper.querySelector('#msgHistoryNextPage');
        DOMElements.bulkActionSelect = wrapper.querySelector('#historyBulkActionSelect');
        DOMElements.selectAllCheckbox = wrapper.querySelector('#selectAllHistory');
        
        return true;
    };

    /**
     * Sets up all event listeners for the interface using event delegation.
     */
    const _setupEventListeners = () => {
        if (!DOMElements.wrapper) return;

        DOMElements.wrapper.addEventListener('click', (e) => {
            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.dataset.action;
            const actions = {
                'load-history': () => _loadHistory(),
                'history-prev-page': () => _goToPage(state.currentPage - 1),
                'history-next-page': () => _goToPage(state.currentPage + 1),
                'view-recipients': () => _viewRecipients(actionTarget.dataset.id),
                'execute-history-bulk-action': _handleBulkAction,
                'copy-history-message': () => {
                    const textToCopy = actionTarget.closest('.full-message-container').querySelector('.message-text').textContent;
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        CRM_APP.utils.showNotification('ההודעה הועתקה', 'info');
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                        CRM_APP.utils.showNotification('שגיאה בהעתקת ההודעה', 'error');
                    });
                }
            };

            if (actions[action]) {
                e.preventDefault();
                actions[action]();
            }
        });

        // Use event delegation on the document body for modals that are added dynamically
        document.body.addEventListener('click', (e) => {
            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.dataset.action;
            const modalActions = {
                'mh-check-statuses': () => _checkAllStatuses(actionTarget),
                'mh-delete-all': () => _deleteAllMessages(actionTarget),
                'mh-delete-single': () => _deleteSingleMessage(actionTarget),
            };

            if (modalActions[action]) {
                e.preventDefault();
                modalActions[action]();
            }
        });

        if (DOMElements.selectAllCheckbox) {
            DOMElements.selectAllCheckbox.addEventListener('change', (e) => {
                DOMElements.tableBody.querySelectorAll('.history-checkbox').forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
        }
    };

    const _goToPage = (page) => {
        if (page < 1 || page > state.totalPages) return;
        _loadHistory(page);
    };

    const _loadHistory = async (page = 1) => {
        if (typeof window.API === 'undefined' || typeof window.API.getMessageHistory !== 'function') {
            CRM_APP.utils.showNotification('API module not fully loaded.', 'error');
            return;
        }

        CRM_APP.utils.showLoader();
        try {
            const response = await window.API.getMessageHistory(page);
            state.currentPage = response.current_page;
            state.totalPages = response.total_pages;
            _renderTable(response.messages);
            _updatePagination();
        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
            DOMElements.tableBody.innerHTML = `<tr><td colspan="8" class="empty-table-message"><h3>שגיאה בטעינת ההיסטוריה.</h3></td></tr>`;
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };

    const _renderTable = (messages) => {
        if (!DOMElements.tableBody) return;
        
        if (!messages || messages.length === 0) {
            DOMElements.tableBody.innerHTML = `<tr><td colspan="8" class="empty-table-message"><h3>לא נמצאו הודעות בהיסטוריה.</h3></td></tr>`;
            if (DOMElements.pagination) DOMElements.pagination.style.display = 'none';
            return;
        }

        DOMElements.tableBody.innerHTML = messages.map(msg => `
            <tr data-message-id="${msg.id}">
                <td><input type="checkbox" class="history-checkbox" data-id="${msg.id}"></td>
                <td>${msg.id}</td>
                <td>${new Date(msg.created_at).toLocaleString('he-IL')}</td>
                <td class="message-content-preview">
                    <div class="full-message-container">
                        <span class="message-text">${msg.message_content || ''}</span>
                        <button class="btn-copy-message" title="העתק הודעה" data-action="copy-history-message">
                            <span class="material-icons" style="font-size: 18px;">content_copy</span>
                        </button>
                    </div>
                </td>
                <td class="status-total">${msg.total_recipients}</td>
                <td class="status-success">${msg.success_count}</td>
                <td class="status-error">${msg.failure_count}</td>
                <td class="action-cell">
                    <button class="btn" data-action="view-recipients" data-id="${msg.id}" title="הצג נמענים"><span class="material-icons">visibility</span></button>
                </td>
            </tr>
        `).join('');
    };

    const _updatePagination = () => {
        if (!DOMElements.pagination) return;

        if (state.totalPages <= 1) {
            DOMElements.pagination.style.display = 'none';
            return;
        }
        DOMElements.pagination.style.display = 'flex';
        DOMElements.pageNumbers.textContent = `עמוד ${state.currentPage} מתוך ${state.totalPages}`;
        DOMElements.prevPageBtn.disabled = state.currentPage <= 1;
        DOMElements.nextPageBtn.disabled = state.currentPage >= state.totalPages;
    };

    const _viewRecipients = async (messageId) => {
        UI.openModal('recipientsModal');
        const modalBody = document.querySelector('#recipientsModal .modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = '<div class="loading-spinner" style="margin: 20px auto;"></div>';
        try {
            const recipients = await window.API.getMessageRecipients(messageId);
            if (recipients && recipients.length > 0) {
                modalBody.innerHTML = `
                    <div class="recipients-modal-actions" style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button class="btn-secondary" data-action="mh-check-statuses"><span class="material-icons">published_with_changes</span> בדוק סטטוס מסירה</button>
                        <button class="btn-danger" data-action="mh-delete-all"><span class="material-icons">delete_sweep</span> מחק את כל ההודעות</button>
                    </div>
                    <div class="table-container">
                        <table class="crm-table" id="recipientsTable">
                            <thead>
                                <tr>
                                    <th>שם</th>
                                    <th>טלפון</th>
                                    <th>סטטוס שליחה</th>
                                    <th>סטטוס WhatsApp</th>
                                    <th>פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recipients.map(r => {
                                    let responseData = {};
                                    try {
                                        if (r.api_response) responseData = JSON.parse(JSON.parse(r.api_response));
                                    } catch (e) {
                                        // Try single parse for older or differently formatted responses
                                        try {
                                            if (r.api_response) responseData = JSON.parse(r.api_response);
                                        } catch (e2) {
                                            console.warn("Could not parse API response for recipient:", r, e2);
                                        }
                                    }
                                    
                                    const idMessage = responseData.idMessage || null;
                                    const chatId = `${CRM_APP.utils.cleanPhoneNumber(r.recipient_phone)}@c.us`;
                                    
                                    return `
                                    <tr data-phone="${r.recipient_phone}" data-message-id="${idMessage}" data-chat-id="${chatId}">
                                        <td>${r.recipient_name || 'N/A'}</td>
                                        <td>${r.recipient_phone || 'N/A'}</td>
                                        <td class="${(r.status || '').includes('הצליחה') ? 'status-success' : 'status-error'}">${r.status}</td>
                                        <td class="whatsapp-status">${idMessage ? 'לא נבדק' : 'אין מזהה'}</td>
                                        <td class="action-cell">
                                            ${idMessage ? `<button class="btn" data-action="mh-delete-single" title="מחק הודעה"><span class="material-icons">delete</span></button>` : ''}
                                        </td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                modalBody.innerHTML = '<p>לא נמצאו נמענים עבור הודעה זו.</p>';
            }
        } catch (error) {
            modalBody.innerHTML = `<p class="error">שגיאה בטעינת הנמענים: ${error.message}</p>`;
            CRM_APP.utils.showNotification(error, 'error');
        }
    };

    const _checkAllStatuses = async (button) => {
        const rows = document.querySelectorAll('#recipientsTable tbody tr');
        if (!rows.length) return;

        button.disabled = true;
        button.innerHTML = `<span class="material-icons spin">sync</span> בודק...`;

        for (const row of rows) {
            const { chatId, messageId } = row.dataset;
            const statusCell = row.querySelector('.whatsapp-status');

            if (!messageId || messageId === 'null') continue;

            statusCell.textContent = 'בודק...';
            try {
                const result = await window.GreenAPI.getMessageStatus(chatId, messageId);
                let statusText = 'לא ידוע';
                let statusClass = '';

                switch (result.statusMessage) {
                    case 'sent': statusText = 'נשלח'; statusClass = 'status-info'; break;
                    case 'delivered': statusText = 'הגיע'; statusClass = 'status-warning'; break;
                    case 'read': statusText = 'נקרא'; statusClass = 'status-success'; break;
                    default: statusText = result.statusMessage || 'שגיאה'; statusClass = 'status-error';
                }
                statusCell.textContent = statusText;
                statusCell.className = `whatsapp-status ${statusClass}`;

            } catch (error) {
                statusCell.textContent = 'שגיאה';
                statusCell.className = 'whatsapp-status status-error';
            }
            await new Promise(res => setTimeout(res, 300));
        }
        button.disabled = false;
        button.innerHTML = `<span class="material-icons">published_with_changes</span> בדוק סטטוס מסירה`;
    };

    const _deleteSingleMessage = async (button) => {
        const row = button.closest('tr');
        const { chatId, messageId } = row.dataset;

        if (!messageId || !chatId) return CRM_APP.utils.showNotification('מזהה הודעה לא תקין.', 'error');

        UI.showConfirmation('האם למחוק הודעה זו מהמכשיר של הנמען?', async () => {
            button.innerHTML = `<span class="material-icons spin">sync</span>`;
            button.disabled = true;
            try {
                await window.GreenAPI.deleteMessage(chatId, messageId);
                CRM_APP.utils.showNotification('ההודעה נמחקה בהצלחה.', 'success');
                const statusCell = row.querySelector('.whatsapp-status');
                if (statusCell) {
                    statusCell.textContent = 'נמחקה';
                    statusCell.className = 'whatsapp-status status-error';
                }
                button.remove();
            } catch (error) {
                if (error && error.message && error.message.includes('invalid response from the messaging')) {
                    CRM_APP.utils.showNotification('ההודעה נמחקה בהצלחה.', 'success');
                    const statusCell = row.querySelector('.whatsapp-status');
                    if (statusCell) {
                        statusCell.textContent = 'נמחקה';
                        statusCell.className = 'whatsapp-status status-error';
                    }
                    button.remove();
                } else {
                    CRM_APP.utils.showNotification(error, 'error');
                    button.innerHTML = `<span class="material-icons">delete</span>`;
                    button.disabled = false;
                }
            }
        });
    };

    const _deleteAllMessages = async (button) => {
        const rows = document.querySelectorAll('#recipientsTable tbody tr');
        const messagesToDelete = Array.from(rows).map(row => row.dataset).filter(d => d.messageId && d.chatId && d.messageId !== 'null');

        if (!messagesToDelete.length) return CRM_APP.utils.showNotification('לא נמצאו הודעות למחיקה.', 'info');

        UI.showConfirmation(`האם למחוק ${messagesToDelete.length} הודעות מהמכשירים של הנמענים?`, async () => {
            button.disabled = true;
            button.innerHTML = `<span class="material-icons spin">sync</span> מוחק...`;
            let successCount = 0;
            
            for (const msg of messagesToDelete) {
                try {
                    await window.GreenAPI.deleteMessage(msg.chatId, msg.messageId);
                    successCount++;
                    const row = document.querySelector(`tr[data-message-id="${msg.messageId}"]`);
                    if(row) {
                        const statusCell = row.querySelector('.whatsapp-status');
                        if (statusCell) {
                            statusCell.textContent = 'נמחקה';
                            statusCell.className = 'whatsapp-status status-error';
                        }
                        row.querySelector('[data-action="mh-delete-single"]')?.remove();
                    }
                } catch (error) {
                    if (error && error.message && error.message.includes('invalid response from the messaging')) {
                        successCount++;
                        const row = document.querySelector(`tr[data-message-id="${msg.messageId}"]`);
                        if(row) {
                            const statusCell = row.querySelector('.whatsapp-status');
                            if (statusCell) {
                                statusCell.textContent = 'נמחקה';
                                statusCell.className = 'whatsapp-status status-error';
                            }
                            row.querySelector('[data-action="mh-delete-single"]')?.remove();
                        }
                    } else {
                        console.error(`Failed to delete message ${msg.messageId}:`, error);
                    }
                }
                await new Promise(res => setTimeout(res, 300));
            }

            CRM_APP.utils.showNotification(`${successCount} מתוך ${messagesToDelete.length} הודעות נמחקו בהצלחה.`, 'success');
            button.disabled = false;
            button.innerHTML = `<span class="material-icons">delete_sweep</span> מחק את כל ההודעות`;
        });
    };

    const _handleBulkAction = () => {
        const action = DOMElements.bulkActionSelect.value;
        if (!action) return;

        const selectedIds = Array.from(DOMElements.tableBody.querySelectorAll('.history-checkbox:checked')).map(cb => cb.dataset.id);
        if (selectedIds.length === 0) {
            CRM_APP.utils.showNotification('יש לבחור לפחות הודעה אחת.', 'warning');
            return;
        }

        if (action === 'delete') {
            UI.showConfirmation(`האם למחוק לצמיתות ${selectedIds.length} רשומות היסטוריה?`, async () => {
                CRM_APP.utils.showLoader();
                try {
                    await window.API.bulkDeleteMessageHistory(selectedIds);
                    CRM_APP.utils.showNotification('הרשומות נמחקו בהצלחה.', 'success');
                    
                    selectedIds.forEach(id => {
                        const row = DOMElements.tableBody.querySelector(`tr[data-message-id="${id}"]`);
                        if (row) {
                            row.remove();
                        }
                    });

                    if (DOMElements.tableBody.children.length === 0) {
                        _loadHistory(state.currentPage);
                    }

                } catch (error) {
                    CRM_APP.utils.showNotification(error, 'error');
                } finally {
                    CRM_APP.utils.hideLoader();
                    if (DOMElements.bulkActionSelect) DOMElements.bulkActionSelect.value = '';
                    if (DOMElements.selectAllCheckbox) DOMElements.selectAllCheckbox.checked = false;
                }
            });
        }
    };

    return {
        init() {
            if (isInitialized) return;
            if (!_cacheDOMElements()) return;
            _setupEventListeners();
            isInitialized = true;
        }
    };
})();

window.MessageHistory = MessageHistory;