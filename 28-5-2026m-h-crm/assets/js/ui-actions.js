/**
 * File: ui-actions.js
 * Description: Handles all user-driven actions within the CRM.
 * @package M_H_CRM_Plugin
 * @version 21.2.2
 * --- CHANGELOG V21.2.2 ---
 * - FIX (handleDeleteWhatsappMessage): Further improved error handling for delete action to prevent any false-positive errors.
 * - FIX (init): Correctly re-established the event listener for the 'check-timeline-statuses' action button, fixing the broken status check functionality.
 * --- CHANGELOG V21.2.1 ---
 * - FIX: Improved error handling for non-JSON success response on message deletion.
 */

window.UI = window.UI || {};

(function(UI) {
    'use strict';
    UI.actions = {};
    let DOMElements = {};

    let sendMessageState = { recipients: [] };
    let editContactState = { contact: null, paymentsLoaded: false, timelineLoaded: false };
    let isSyncing = false;
    
    /**
     * Handlers for WhatsApp-related actions
     */
    const handleSyncContactWhatsapp = async (button) => {
        const phone = button.dataset.phone || (editContactState.contact ? editContactState.contact.conta_phone : '');
        if (!phone) {
             CRM_APP.utils.showNotification('לא ניתן לסנכרן: חסר מספר טלפון.', 'warning');
             return;
        }
        
        button.disabled = true;
        const originalContent = button.innerHTML;
        button.innerHTML = `<span class="material-icons spin">sync</span> סנכרון...`;

        CRM_APP.utils.showProgress(`מסנכרן היסטוריית וואטסאפ עבור ${phone}...`);
        
        try {
            const response = await window.API.syncContactWhatsapp(phone);
            CRM_APP.utils.updateProgress(100, 'סנכרון הושלם!');
            CRM_APP.utils.showNotification(`סונכרנו ${response.results.messages_synced} הודעות עבור איש קשר זה.`, 'success');
            
            // Reload timeline tab
            await UI.actions.loadEditModalTabData('tab-timeline');
        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
        } finally {
            CRM_APP.utils.hideProgress();
            button.disabled = false;
            button.innerHTML = originalContent;
        }
    };

    const handleDeleteWhatsappMessage = async (button) => {
        console.log('[WhatsApp] Deletion requested for button:', button);
        const row = button.closest('tr');
        if (!row) {
            console.error('[WhatsApp] Deletion failed: Could not find parent row.');
            return;
        }
        
        const chatId = row.dataset.chatId || row.getAttribute('data-chat-id');
        const messageId = row.dataset.messageId || row.getAttribute('data-message-id');

        console.log(`[WhatsApp] Row data found - ChatId: ${chatId}, MessageId: ${messageId}`);

        if (!chatId || !messageId) {
            console.warn('[WhatsApp] Deletion aborted: missing messageId or chatId.');
            CRM_APP.utils.showNotification('לא ניתן למחוק הודעה זו: חסר מזהה הודעה או מזהה צ׳אט.', 'warning');
            return;
        }

        UI.showConfirmation('האם אתה בטוח שברצונך למחוק הודעה זו מוואטסאפ ומהתיעוד ב-CRM?', async () => {
             console.log('[WhatsApp] Deletion confirmed by user for message:', messageId);
             button.disabled = true;
             CRM_APP.utils.showLoader();
             try {
                 await window.API.deleteWhatsappMessage(chatId, messageId);
                 CRM_APP.utils.showNotification('ההודעה נמחקה בהצלחה.', 'success');
                 row.remove(); // Optimistic removal
             } catch (error) {
                 console.error('[WhatsApp] API Deletion Error:', error);
                 CRM_APP.utils.showNotification('מחיקה נכשלה: ' + (error.message || error), 'error');
             } finally {
                 CRM_APP.utils.hideLoader();
                 button.disabled = false;
             }
        });
    };



    const handleCheckTimelineStatuses = async (button) => {
        const tableBody = document.querySelector('#timeline-table tbody');
        if (!tableBody) return;
        const messageRows = tableBody.querySelectorAll('tr[data-message-id]');
        if (messageRows.length === 0) {
            CRM_APP.utils.showNotification('לא נמצאו הודעות לבדיקה בציר הזמן.', 'info');
            return;
        }
    
        button.disabled = true;
        button.innerHTML = `<span class="material-icons spin">sync</span> בודק סטטוסים...`;
    
        for (const row of messageRows) {
            const { chatId, messageId } = row.dataset;
            const statusCell = row.querySelector('.timeline-read-status');
    
            if (!messageId || !chatId || statusCell.textContent !== 'לא נבדק') continue;
    
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
                statusCell.classList.add(statusClass);
            } catch (error) {
                statusCell.textContent = 'שגיאה';
                statusCell.classList.add('status-error');
            }
            await new Promise(res => setTimeout(res, 300)); // Rate limit API calls
        }
    
        button.disabled = false;
        button.innerHTML = `<span class="material-icons">published_with_changes</span> בדוק סטטוס קריאה`;
    };
    
    const handleReplyToMessage = (button) => {
        const { contact } = editContactState;
        if (contact && contact.conta_phone) {
            openSendMessageModal([contact]);
        } else {
            CRM_APP.utils.showNotification('לא ניתן להשיב, לאיש הקשר אין מספר טלפון.', 'error');
        }
    };

    const handleSyncWhatsappMessages = async (button) => {
        console.log('handleSyncWhatsappMessages triggered');
        if (isSyncing) {
            console.log('Already syncing, ignoring click.');
            return;
        }
        isSyncing = true;
        
        button.disabled = true;
        const originalContent = button.innerHTML;
        button.innerHTML = `<span class="material-icons spin">sync</span> סנכרון...`;

        console.log('Showing progress overlay...');
        CRM_APP.utils.showProgress('מתחיל סנכרון הודעות וואטסאפ מכל החשבון...');
        CRM_APP.utils.updateProgress(10, 'יוצר קשר עם שרת ההודעות...');

        try {
            console.log('Calling API.syncWhatsappMessages()...');
            if (!window.API || !window.API.syncWhatsappMessages) {
                throw new Error('API object or syncWhatsappMessages method not found in window.API');
            }
            const response = await window.API.syncWhatsappMessages();
            console.log('API Response received:', response);
            
            CRM_APP.utils.updateProgress(100, 'הסנכרון הושלם!');
            
            if (response.success) {
                const { results } = response;
                let summary = `סנכרון הושלם! סונכרנו ${results.messages_synced} הודעות מ-${results.chats_processed} שיחות.`;
                if (results.new_contacts_created > 0) {
                    summary += ` נוספו ${results.new_contacts_created} אנשי קשר חדשים.`;
                }
                console.log('Sync successful:', summary);
                CRM_APP.utils.showNotification(summary, 'success');
                
                // Refresh contacts list to show new contacts
                console.log('Refreshing contacts list...');
                await UI.refreshContacts(true);
            } else {
                throw new Error(response.message || 'שגיאת סנכרון לא ידועה.');
            }
        } catch (error) {
            console.error('Sync process caught error:', error);
            CRM_APP.utils.showNotification('סנכרון נכשל: ' + error.message, 'error');
        } finally {
            console.log('Sync process finished, cleaning up...');
            isSyncing = false;
            button.disabled = false;
            button.innerHTML = originalContent;
            CRM_APP.utils.hideProgress();
        }
    };

    UI.actions.init = () => {
        DOMElements = UI.getDOMElements();
        document.getElementById('excelFileInput')?.addEventListener('change', handleExcelUpload);
        document.getElementById('sendMessageFileInput')?.addEventListener('change', e => {
            const fileNameEl = document.getElementById('sendMessageFileName');
            if (fileNameEl) fileNameEl.textContent = e.target.files[0]?.name || '';
        });

        document.body.addEventListener('input', e => {
            if (e.target.id === 'timelineSearchInput') {
                const searchTerm = e.target.value.toLowerCase();
                const tableBody = document.querySelector('#timeline-table tbody');
                if (!tableBody) return;
                tableBody.querySelectorAll('tr').forEach(row => {
                    const rowText = row.textContent.toLowerCase();
                    row.style.display = rowText.includes(searchTerm) ? '' : 'none';
                });
            }
        });
        
        console.log('Attaching global click listener for CRM actions in ui-actions.js...');
        document.addEventListener('click', e => {
             const actionTarget = e.target.closest('[data-action]');
             if (!actionTarget) return;
             const action = actionTarget.dataset.action;
             
             // List of actions this module specifically handles
             const actionHandlers = {
                'delete-whatsapp-message': () => handleDeleteWhatsappMessage(actionTarget),
                'check-timeline-statuses': () => handleCheckTimelineStatuses(actionTarget),
                'reply-to-message': () => handleReplyToMessage(actionTarget),
                'sync-whatsapp-messages': () => handleSyncWhatsappMessages(actionTarget),
                'sync-contact-whatsapp': () => handleSyncContactWhatsapp(actionTarget)
             };

             if (actionHandlers[action]) {
                console.log('ui-actions.js: Executing handler for action:', action);
                e.preventDefault();
                e.stopPropagation();
                actionHandlers[action]();
             }
        });
    };
    
    // NOTE: For brevity, only the changed function and its context are shown.
    // The full file should be used for replacement.
    
    // Helper and other action functions (unchanged)
    const openSendMessageModal = (contacts) => {
        if (!contacts || contacts.length === 0) {
            return CRM_APP.utils.showNotification('לא נבחרו אנשי קשר עם מספרי טלפון תקינים.', 'warning');
        }
        sendMessageState.recipients = contacts;
        const modal = document.getElementById('sendMessageModal');
        modal.querySelector('#sendMessageRecipientCount').textContent = contacts.length;
        modal.querySelector('#sendMessageRecipientList').innerHTML = contacts.map(c => `<div class="recipient-list-item">${c.conta_name} (${c.conta_phone})</div>`).join('');
        modal.querySelector('#sendMessageText').value = '';
        modal.querySelector('#sendMessageFileInput').value = '';
        modal.querySelector('#sendMessageFileName').textContent = '';
        UI.openModal('sendMessageModal');
    };

    const handleSendFromModal = async () => {
        const message = document.getElementById('sendMessageText').value.trim();
        const file = document.getElementById('sendMessageFileInput').files[0];
        if (!message && !file) return CRM_APP.utils.showNotification('יש לכתוב הודעה או לבחור קובץ.', 'warning');
        if (sendMessageState.recipients.length === 0) return CRM_APP.utils.showNotification('לא נבחרו נמענים.', 'warning');

        const sendBtn = document.getElementById('sendFromModalBtn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span class="spinner"></span> שולח...`;
        CRM_APP.utils.showProgress(`מתחיל שליחה ל-${sendMessageState.recipients.length} נמענים...`);

        let successCount = 0;
        let failureCount = 0;
        const recipientsLog = [];
        const totalRecipients = sendMessageState.recipients.length;

        for (let i = 0; i < totalRecipients; i++) {
            const contact = sendMessageState.recipients[i];
            const normalizedPhone = CRM_APP.utils.cleanPhoneNumber(contact.conta_phone);
            CRM_APP.utils.updateProgress(Math.round(((i + 1) / totalRecipients) * 100), `שולח אל ${contact.conta_name}... (${i + 1}/${totalRecipients})`);
            
            try {
                let response;
                if (file) {
                    response = await window.GreenAPI.sendFile(normalizedPhone, file, message);
                } else {
                    response = await window.GreenAPI.sendMessage(normalizedPhone, message);
                }
                successCount++;
                recipientsLog.push({ name: contact.conta_name, phone: normalizedPhone, status: 'השליחה הצליחה', response: JSON.stringify(response) });
            } catch (error) {
                failureCount++;
                recipientsLog.push({ name: contact.conta_name, phone: normalizedPhone, status: `השליחה נכשלה: ${error.message}`, response: JSON.stringify({ error: error.message }) });
            }
        }
        CRM_APP.utils.hideProgress();
        
        if (typeof window.API.saveMessageHistory === 'function') {
            try {
                await window.API.saveMessageHistory({ message_content: message || `קובץ: ${file ? file.name : 'ללא תוכן'}`, recipients: recipientsLog });
            } catch(error) {
                CRM_APP.utils.showNotification('שגיאה בשמירת היסטוריית ההודעה.', 'error');
            }
        }

        CRM_APP.utils.showNotification(`השליחה הושלמה! ${successCount} הצלחות, ${failureCount} כשלונות.`, 'success');
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<span class="material-icons">send</span> שלח`;
        UI.closeModal('sendMessageModal');
    };

    const openEditContactModal = async (contactId) => {
        CRM_APP.utils.showLoader();
        try {
            const contact = await window.API.getContact(contactId);
            if (!contact) {
                throw new Error('לא נמצא איש קשר.');
            }
            
            editContactState = { contact, paymentsLoaded: false, timelineLoaded: false };

            const modal = document.getElementById('editContactModal');
            const form = document.getElementById('editContactForm');
            
            form.elements.contact_id.value = contact.id;
            modal.querySelector('#editContactName').textContent = contact.conta_name;
            
            const fieldsToPopulate = [ 'conta_name', 'f_m', 'gender', 'birth_date', 'email', 'conta_phone', 'work_phone', 'website', 'company_name', 'job_title', 'lead_source', 'notes', 'tg1', 'tg2', 'tg3', 'city', 'street', 'last_form_name' ];
            fieldsToPopulate.forEach(field => {
                 if (form.elements[field]) form.elements[field].value = contact[field] || '';
            });
            
            renderEventRows(contact.events || []);
            
            modal.querySelector('#contact-timeline-container').innerHTML = '<p>לחץ על הלשונית כדי לטעון...</p>';
            modal.querySelector('#contact-payment-history-container').innerHTML = '<p>לחץ על הלשונית כדי לטעון...</p>';
            
            modal.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            modal.querySelector('.tab-link[data-tab="tab-details"]').classList.add('active');
            modal.querySelector('#tab-details').classList.add('active');
            
            UI.openModal('editContactModal');

        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };

    const loadEditModalTabData = async (tabId) => {
        const { contact, paymentsLoaded, timelineLoaded } = editContactState;
        if (!contact) return;

        if (tabId === 'tab-timeline' && !timelineLoaded) {
            const container = document.getElementById('contact-timeline-container');
            container.innerHTML = '<div class="loading-spinner"></div>';
            
            try {
                const historyPromise = window.API.getWhatsappContactHistory(contact.conta_phone);
                const fullContactPromise = window.API.getContact(contact.id);
                
                const [history, fullContact] = await Promise.all([historyPromise, fullContactPromise]);

                editContactState.contact = fullContact;
                const events = fullContact.events || [];
                
                let timelineItems = [];

                if(history && history.length > 0) {
                    history.forEach(item => {
                        let apiResponse = {};
                        try {
                           if(item.api_response) apiResponse = JSON.parse(JSON.parse(item.api_response));
                        } catch(e) { try { if(item.api_response) apiResponse = JSON.parse(item.api_response); } catch(e2) { apiResponse = {}; } }

                        timelineItems.push({
                            date: new Date(item.created_at),
                            type: 'הודעה',
                            icon: 'message',
                            description: item.personalized_content,
                            formName: item.form_name || '-',
                            pageName: item.page_name || '-',
                            readStatus: apiResponse.idMessage ? 'לא נבדק' : 'אין מזהה',
                            actions: [
                                {action: 'reply-to-message', icon: 'reply', title: 'השב להודעה'},
                                apiResponse.idMessage ? {action: 'delete-whatsapp-message', icon: 'delete', title: 'מחק הודעה זו'} : null,
                            ].filter(Boolean),
                            apiResponse: apiResponse,
                            raw: item
                        });
                    });
                }
                
                events.forEach(event => {
                    const meta = event.meta || {};
                    let type, icon;

                    switch(event.icon) {
                        case 'payment':
                            type = 'תשלום';
                            icon = 'payment';
                            break;
                        case 'description':
                            type = 'טופס';
                            icon = 'description';
                            break;
                        default:
                            type = 'אירוע';
                            icon = event.icon || 'event';
                    }

                    timelineItems.push({
                        date: new Date(event.time),
                        type: type,
                        icon: icon,
                        description: `<strong>${event.title}</strong><br>${event.text}`,
                        formName: meta.form_name || '-',
                        pageName: meta.page_name || '-',
                        readStatus: '-',
                        actions: [
                            (icon === 'whatsapp' && meta.whatsapp_message_id) ? {action: 'delete-whatsapp-message', icon: 'delete_outline', title: 'מחק הודעה מוואטסאפ'} : null
                        ].filter(Boolean),
                        apiResponse: {
                            idMessage: meta.whatsapp_message_id,
                            chatId: meta.chat_id
                        },
                        raw: event
                    });
                });

                timelineItems.sort((a, b) => b.date - a.date);

                if (timelineItems.length === 0) {
                    container.innerHTML = `
                        <div class="timeline-header-actions">
                            <button class="btn btn-whatsapp-sync-small" data-action="sync-contact-whatsapp" data-phone="${contact.conta_phone}">
                                <span class="material-icons">sync</span> סנכרן וואטסאפ לאיש קשר זה
                            </button>
                        </div>
                        <p class="empty-table-message">לא נמצאו אינטראקציות מתועדות.</p>`;
                } else {
                    container.innerHTML = `
                        <div class="timeline-header-actions" style="margin-bottom: 15px; display: flex; justify-content: flex-end;">
                            <button class="btn btn-whatsapp-sync-small" data-action="sync-contact-whatsapp" data-phone="${contact.conta_phone}">
                                <span class="material-icons">sync</span> סנכרן וואטסאפ לאיש קשר זה
                            </button>
                        </div>
                        <div class="table-container">
                            <table id="timeline-table">
                                <thead>
                                    <tr>
                                        <th>תאריך</th>
                                        <th>סוג</th>
                                        <th>תיאור</th>
                                        <th>שם טופס</th>
                                        <th>שם עמוד</th>
                                        <th>סטטוס קריאה</th>
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                     ${timelineItems.map(item => {
                                         let chatId = item.apiResponse?.chatId || '';
                                         if (!chatId && item.apiResponse?.idMessage) {
                                             chatId = `${CRM_APP.utils.cleanPhoneNumber(contact.conta_phone)}@c.us`;
                                         }
                                         const messageId = item.apiResponse?.idMessage || '';

                                        return `
                                        <tr data-chat-id="${chatId}" data-message-id="${messageId}">
                                            <td class="timeline-date">${item.date.toLocaleString('he-IL')}</td>
                                            <td class="timeline-type" data-type-icon="${item.icon}"><span class="material-icons">${item.icon}</span> ${item.type}</td>
                                            <td class="timeline-content">${item.description}</td>
                                            <td class="timeline-form-name">${item.formName}</td>
                                            <td class="timeline-page-name">${item.pageName}</td>
                                            <td class="timeline-read-status">${item.readStatus}</td>
                                            <td class="timeline-actions">
                                                ${item.actions.map(action => `
                                                    <button class="btn" data-action="${action.action}" title="${action.title}">
                                                        <span class="material-icons">${action.icon}</span>
                                                    </button>
                                                `).join('')}
                                            </td>
                                        </tr>
                                    `}).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
                editContactState.timelineLoaded = true;

            } catch (error) {
                console.error("Timeline loading error:", error);
                container.innerHTML = '<p class="error-message">שגיאה בטעינת ציר הזמן.</p>';
            }

        } else if (tabId === 'tab-payments' && !paymentsLoaded) {
            const container = document.getElementById('contact-payment-history-container');
            container.innerHTML = '<div class="loading-spinner"></div>';
            try {
                const { orders, stats } = await window.API.getContactOrders(contact.conta_phone, contact.email);
                let statsHtml = `<div class="payment-stats-header"><div class="stat-item"><span class="stat-value">${stats.total_orders}</span><span class="stat-label">סה"כ הזמנות</span></div><div class="stat-item"><span class="stat-value">${stats.average_value}</span><span class="stat-label">ממוצע</span></div><div class="stat-item"><span class="stat-value">${stats.total_value}</span><span class="stat-label">סה"כ</span></div></div>`;
                container.innerHTML = statsHtml + (orders.length > 0
                    ? `<div class="table-container"><table id="payment-history-table"><thead><tr><th>הזמנה</th><th>תאריך</th><th>סטטוס</th><th>סך הכל</th><th>פעולות</th></tr></thead><tbody>${orders.map(o => `<tr><td>#${o.id}</td><td>${new Date(o.date).toLocaleString('he-IL')}</td><td><span class="order-status ${'wc-' + o.status}">${o.status}</span></td><td>${o.total}</td><td><button class="btn" data-action="view-order-details" data-id="${o.id}" title="צפה בפרטים"><span class="material-icons">visibility</span></button></td></tr>`).join('')}</tbody></table></div>`
                    : '<p style="text-align: center; padding: 20px;">לא נמצאו הזמנות.</p>');
                editContactState.paymentsLoaded = true;
            } catch (error) {
                container.innerHTML = '<p class="error-message">שגיאה בטעינת היסטוריית התשלומים.</p>';
            }
        }
    };
    
    const submitEditContactForm = async () => {
        const form = document.getElementById('editContactForm');
        const contactId = form.elements.contact_id.value;
        if (!contactId) return;
        
        CRM_APP.utils.showLoader();
        
        const updatedData = {};
        const fieldsToCollect = [ 'conta_name', 'f_m', 'gender', 'birth_date', 'email', 'conta_phone', 'work_phone', 'website', 'company_name', 'job_title', 'lead_source', 'notes', 'tg1', 'tg2', 'tg3', 'city', 'street', 'last_form_name' ];
        
        fieldsToCollect.forEach(field => {
            if (form.elements[field]) {
                updatedData[field] = form.elements[field].value;
            }
        });

        const events = [];
        document.querySelectorAll('#events-repeater-container .event-row').forEach(row => {
            const eventData = { time: row.querySelector('[name="event_time"]').value, title: row.querySelector('[name="event_title"]').value, text: row.querySelector('[name="event_text"]').value };
            if(eventData.time || eventData.title || eventData.text) events.push(eventData);
        });
        updatedData.events = events;

        try {
            const updatedContact = await window.API.updateContact(contactId, updatedData);
            CRM_APP.utils.showNotification('איש הקשר עודכן בהצלחה!', 'success');
            UI.closeModal('editContactModal');
            
            // Optimistic / Immediate UI Update
            const row = document.querySelector(`tr[data-contact-id="${contactId}"]`);
            if (row) {
                // Update specific cells if they exist in the row
                Object.keys(updatedData).forEach(key => {
                    const cell = row.querySelector(`td[data-field="${key}"]`);
                    if (cell) {
                        cell.textContent = updatedData[key];
                        cell.dataset.originalValue = updatedData[key];
                    }
                });
                
                // Also update the internal state if accessible, to prevent reversion on sort
                const internalState = UI.getState();
                if (internalState && internalState.contacts) {
                    const contactIndex = internalState.contacts.findIndex(c => c.id == contactId);
                    if (contactIndex !== -1) {
                         internalState.contacts[contactIndex] = { ...internalState.contacts[contactIndex], ...updatedContact };
                    }
                }
            }
            
            // Optional: Background refresh if needed, but not blocking user interaction
            // UI.refreshContacts(false); 
        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };

    const renderEventRows = (events) => {
        const container = document.getElementById('events-repeater-container');
        if (!container) return;
        container.innerHTML = (events && events.length > 0) 
            ? events.map(event => createEventRow(event).outerHTML).join('') 
            : '<p class="empty-table-message">לא תועדו אירועים.</p>';
    };

    const createEventRow = (event = { time: '', title: '', text: '' }) => {
        const row = document.createElement('div');
        row.className = 'event-row';
        row.innerHTML = `<input type="datetime-local" name="event_time" value="${event.time || ''}" placeholder="תאריך ושעה"><input type="text" name="event_title" value="${event.title || ''}" placeholder="כותרת האירוע"><textarea name="event_text" placeholder="פירוט...">${event.text || ''}</textarea><button type="button" class="delete-event-btn" data-action="delete-event-row" title="מחק אירוע"><span class="material-icons">delete</span></button>`;
        return row;
    };
    
    const addEventRow = () => {
        const container = document.getElementById('events-repeater-container');
        if (!container) return;
        if (container.querySelector('p')) container.innerHTML = '';
        container.appendChild(createEventRow());
    };

    const deleteEventRow = (button) => {
        const row = button.closest('.event-row');
        if(row) row.remove();
        const container = document.getElementById('events-repeater-container');
        if (container && container.children.length === 0) container.innerHTML = '<p>לא תועדו אירועים.</p>';
    };

    const handleAddContact = () => {
        const form = document.getElementById('addContactForm');
        if (form) form.reset();
        UI.openModal('addContactModal');
    };

    const submitAddContactForm = async () => {
        const form = document.getElementById('addContactForm');
        if (!form) return;
        CRM_APP.utils.showLoader();
        const newContactData = Object.fromEntries(new FormData(form).entries());
        try {
            await window.API.createContact(newContactData);
            CRM_APP.utils.showNotification('איש הקשר נוסף בהצלחה!', 'success');
            UI.closeModal('addContactModal');
            
            // Reset state to ensure the new contact is visible
            const state = UI.getState();
            state.currentPage = 1;
            state.currentView = 'active';
            state.currentSearch = '';
            state.tagFilter = '';
            state.cityFilter = '';
            state.leadSourceFilter = '';
            
            // Reset UI controls
            const dom = UI.getDOMElements();
            if (dom.searchInput) dom.searchInput.value = '';
            if (dom.filterTag) dom.filterTag.value = '';
            if (dom.filterCity) dom.filterCity.value = '';
            if (dom.filterSource) dom.filterSource.value = '';
            if (dom.viewTabsContainer) {
                dom.viewTabsContainer.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
                const activeTabBtn = dom.viewTabsContainer.querySelector('.view-tab[data-status="active"]');
                if (activeTabBtn) activeTabBtn.classList.add('active');
            }
            
            await UI.refreshContacts(true);
        } catch (error) {
            if (error.data?.existing_id) {
                UI.closeModal('addContactModal');
                UI.showConfirmation(`איש קשר עם מספר טלפון זה כבר קיים. האם תרצה לערוך את איש הקשר הקיים?`, () => UI.actions.openEditContactModal(error.data.existing_id));
            } else {
                CRM_APP.utils.showNotification(error, 'error');
            }
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };

    const handleCellEdit = async (event) => {
        const cell = event.target;
        const originalValue = cell.dataset.originalValue;
        const currentValue = cell.textContent.trim();
        if (currentValue === originalValue) return;
        const id = cell.closest('tr').dataset.contactId;
        const field = cell.dataset.field;
        try {
            await window.API.updateContact(id, { [field]: currentValue });
            CRM_APP.utils.showNotification('השינוי נשמר בהצלחה', 'success');
            cell.dataset.originalValue = currentValue;
            if (field === 'status') UI.refreshStats();
        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
            cell.textContent = originalValue;
        }
    };

    const handleSendMessageToSingle = async (dataset) => {
        const contactId = dataset.id;
        CRM_APP.utils.showLoader();
        try {
            const contact = await window.API.getContact(contactId);
            if (!contact || !contact.conta_phone) {
                throw new Error('לאיש הקשר אין מספר טלפון זמין.');
            }
            openSendMessageModal([contact]);
        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };
    
    const handleBulkAction = async () => {
        const selectEl = document.getElementById('bulkActionSelect');
        if (!selectEl) return;
        
        const action = selectEl.value;
        const selectedCheckboxes = document.querySelectorAll('.contact-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.id, 10));

        if (!action) return CRM_APP.utils.showNotification('אנא בחר פעולה לביצוע.', 'warning');
        if (selectedIds.length === 0) return CRM_APP.utils.showNotification('יש לבחור לפחות איש קשר אחד.', 'warning');
        
        if (action === 'message') {
            CRM_APP.utils.showLoader();
            try {
                const contactPromises = selectedIds.map(id => window.API.getContact(id));
                const contacts = await Promise.all(contactPromises);
                const validContacts = contacts.filter(c => c && c.conta_phone);
                
                if (validContacts.length === 0) {
                    CRM_APP.utils.showNotification('לא נבחרו אנשי קשר עם טלפון תקין.', 'warning');
                } else {
                    openSendMessageModal(validContacts);
                }
            } catch (error) {
                 CRM_APP.utils.showNotification('שגיאה בטעינת פרטי אנשי הקשר.', 'error');
            } finally {
                CRM_APP.utils.hideLoader();
                selectEl.value = '';
            }
            return;
        }
        
        const confirmationMessages = {
            trash: `האם להעביר ${selectedIds.length} אנשי קשר לסל האשפה?`,
            restore: `האם לשחזר ${selectedIds.length} אנשי קשר מסל האשפה?`,
            delete_permanent: `פעולה זו תמחק לצמיתות ${selectedIds.length} אנשי קשר. האם להמשיך?`
        };
        
        UI.showConfirmation(confirmationMessages[action], async () => {
            CRM_APP.utils.showProgress(`מבצע פעולה על ${selectedIds.length} אנשי קשר...`);
            try {
                await window.API.bulkAction(action, selectedIds);
                CRM_APP.utils.updateProgress(100, 'הפעולה הושלמה בהצלחה!');
                await UI.refreshContacts(true);
            } catch (error) {
                CRM_APP.utils.showNotification(error, 'error');
            } finally {
                CRM_APP.utils.hideProgress();
                selectEl.value = '';
            }
        });
    };

    const handleExcelDownload = async () => {
        CRM_APP.utils.showLoader();
        try {
            const { contacts: allFilteredContacts } = await window.API.getContacts({
                status: UI.getState().currentView,
                search: UI.getState().currentSearch,
                per_page: -1
            });

            if (allFilteredContacts.length === 0) {
                CRM_APP.utils.showNotification('אין אנשי קשר לייצא בתצוגה הנוכחית.', 'info');
                return;
            }
            const headers = { 'id': 'מזהה (ID)', 'conta_name': 'שם פרטי', 'f_m': 'שם משפחה', 'conta_phone': 'טלפון נייד', 'email': 'דוא"ל', 'gender': 'מגדר', 'city': 'עיר', 'street': 'רחוב', 'tg1': 'תג 1', 'tg2': 'תג 2', 'tg3': 'תג 3', 'company_name': 'שם חברה', 'job_title': 'תפקיד', 'lead_source': 'מקור הליד', 'work_phone': 'טלפון עבודה', 'website': 'אתר', 'birth_date': 'תאריך לידה', 'notes': 'הערות' };
            const dataForSheet = allFilteredContacts.map(contact => {
                let row = {};
                for (const key in headers) { row[headers[key]] = contact[key] || ''; }
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
            XLSX.writeFile(workbook, "contacts_export.xlsx");
        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };

    const handleExcelUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const contactsFromJson = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
                const totalContacts = contactsFromJson.length;
                if (totalContacts === 0) { throw new Error('הקובץ ריק או בפורמט לא נתמך.'); }

                CRM_APP.utils.showProgress(`מעבד ${totalContacts} אנשי קשר...`);

                const headerMap = {
                    'מזהה (ID)': 'id', 'שם פרטי': 'conta_name', 'שם משפחה': 'f_m', 'טלפון נייד': 'conta_phone', 'דוא"ל': 'email', 'מגדר': 'gender', 'עיר': 'city', 'רחוב': 'street', 'תג 1': 'tg1', 'תג 2': 'tg2', 'תג 3': 'tg3', 'שם חברה': 'company_name', 'תפקיד': 'job_title', 'מקור הליד': 'lead_source', 'טלפון עבודה': 'work_phone', 'אתר': 'website', 'תאריך לידה': 'birth_date', 'הערות': 'notes',
                    'ID': 'id', 'שם': 'conta_name', 'טלפון': 'conta_phone', 'אימייל': 'email'
                };

                const contactsToImport = contactsFromJson.map(row => {
                    const contactData = {};
                    for (const header in row) {
                        const normalizedHeader = header.trim();
                        if (headerMap[normalizedHeader]) {
                            contactData[headerMap[normalizedHeader]] = String(row[header]);
                        }
                    }
                    return contactData;
                });
                
                const batchSize = 50;
                let allResults = { created: 0, updated: 0, skipped: 0 };

                for (let i = 0; i < totalContacts; i += batchSize) {
                    const batch = contactsToImport.slice(i, i + batchSize);
                    const response = await window.API.importContacts(batch);
                    allResults.created += response.results.created;
                    allResults.updated += response.results.updated;
                    allResults.skipped += response.results.skipped;
                    
                    const processedCount = i + batch.length;
                    CRM_APP.utils.updateProgress(
                        Math.round((processedCount / totalContacts) * 100),
                        `מעבד ${processedCount} מתוך ${totalContacts}...`
                    );
                }

                const { created, updated, skipped } = allResults;
                let summary = `יבוא הושלם! ${created} אנשי קשר נוצרו, ${updated} עודכנו.`;
                if (skipped > 0) { summary += ` (${skipped} שורות דולגו).`; }
                CRM_APP.utils.hideProgress();
                CRM_APP.utils.showNotification(summary, 'success');
                await UI.refreshContacts(true);

            } catch (error) {
                CRM_APP.utils.hideProgress();
                CRM_APP.utils.showNotification(error, 'error');
            } finally {
                event.target.value = '';
            }
        };
        reader.onerror = () => {
             CRM_APP.utils.showNotification('שגיאה בקריאת הקובץ.', 'error');
             CRM_APP.utils.hideProgress();
        };
        reader.readAsArrayBuffer(file);
    };

    const handleViewOrderDetails = async (orderId) => {
        CRM_APP.utils.showLoader();
        try {
            const details = await window.API.getContactOrderDetails(orderId);
            const modal = document.getElementById('orderDetailModal');
            modal.querySelector('#order-detail-id').textContent = `#${details.id}`;
            modal.querySelector('#order-detail-body').innerHTML = `
                <div class="order-details-grid">
                    <div class="order-details-box">
                        <h4>פרטי הזמנה</h4>
                        <p><strong>תאריך:</strong> ${details.date_created}</p>
                        <p><strong>סטטוס:</strong> <span class="order-status wc-${details.status}">${details.status}</span></p>
                        <p><strong>אמצעי תשלום:</strong> ${details.payment_method}</p>
                        <h4>פרטי חיוב</h4>
                        <p>${details.billing.replace(/<br\s*\/?>/gi, '\n')}</p>
                    </div>
                    <div class="order-details-box">
                        <h4>פריטים</h4>
                        <table id="order-items-table">
                            ${details.items.map(item => `<tr><td>${item.name} (x${item.quantity})</td><td>${item.total}</td></tr>`).join('')}
                        </table>
                        <hr>
                        <h4>סיכום</h4>
                        <table id="order-items-table">
                            ${Object.entries(details.totals).map(([key, val]) => `<tr><td>${val.label}</td><td>${val.value}</td></tr>`).join('')}
                        </table>
                    </div>
                </div>`;
            UI.openModal('orderDetailModal');
        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };
    
    const handleSingleItemAction = (dataset, action) => {
        const idAsInt = parseInt(dataset.id, 10);
        const actionMap = {
            'trash': { verb: 'trash', message: 'האם להעביר את איש הקשר לסל האשפה?' },
            'restore': { verb: 'restore', message: 'האם לשחזר את איש הקשר?' },
            'delete_permanent': { verb: 'delete_permanent', message: 'פעולה זו תמחק את איש הקשר לצמיתות. האם להמשיך?' },
        };
        const actionConfig = actionMap[action];
        if (!actionConfig) return;

        UI.showConfirmation(actionConfig.message, async () => {
            CRM_APP.utils.showLoader();
            try {
                await window.API.bulkAction(actionConfig.verb, [idAsInt]);
                await UI.refreshContacts(true); 
                CRM_APP.utils.showNotification('הפעולה בוצעה בהצלחה.', 'success');
            } catch (error) {
                CRM_APP.utils.showNotification(error, 'error');
            } finally {
                CRM_APP.utils.hideLoader();
            }
        });
    };
    


    const triggerExcelUpload = () => document.getElementById('excelFileInput')?.click();

    UI.actions.handleExcelDownload = handleExcelDownload;
    UI.actions.handleBulkAction = handleBulkAction;
    UI.actions.handleTrashContact = (dataset) => handleSingleItemAction(dataset, 'trash');
    UI.actions.handleRestoreContact = (dataset) => handleSingleItemAction(dataset, 'restore');
    UI.actions.handleDeletePermanentContact = (dataset) => handleSingleItemAction(dataset, 'delete_permanent');
    UI.actions.handleSendMessageToSingle = handleSendMessageToSingle;
    UI.actions.openEditContactModal = openEditContactModal;
    UI.actions.loadEditModalTabData = loadEditModalTabData;
    UI.actions.submitEditContactForm = submitEditContactForm;
    UI.actions.handleAddContact = handleAddContact;
    UI.actions.submitAddContactForm = submitAddContactForm;
    UI.actions.handleCellEdit = handleCellEdit;
    UI.actions.handleSendFromModal = handleSendFromModal;
    UI.actions.addEventRow = addEventRow;
    UI.actions.deleteEventRow = deleteEventRow;
    UI.actions.handleViewOrderDetails = (dataset) => handleViewOrderDetails(dataset.id);
    UI.actions.triggerExcelUpload = triggerExcelUpload;

})(window.UI);