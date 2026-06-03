/**
 * File: ui-group-send.js
 * Description: Manages all functionality for the new Group Send Wizard, featuring the Smart Filter Panel.
 * Version: 17.0.3
 * --- CHANGELOG ---
 * V17.0.3:
 * - DEBUG: Added console log to verify current version.
 * - FIX: Hardened the tag replacement logic for preview and send.
 */
window.UI = window.UI || {};

(function(UI) {
    'use strict';

    UI.groupSend = {};
    console.log("M.H CRM: WhatsApp GroupSend Module V17.0.5 Loaded (CRITICAL CACHE BUST)");

    // Local mapping to ensure Hebrew labels even if server config is missing or incorrect
    const FIELD_LABELS = {
        'conta_name': 'שם פרטי',
        'f_m': 'שם משפחה',
        'conta_phone': 'טלפון',
        'gender': 'מגדר',
        'tg1': 'תג 1',
        'tg2': 'תג 2',
        'tg3': 'תג 3',
        'lead_source': 'מקור הליד',
        'last_form_name': 'הטופס האחרון',
        'notes': 'הערות',
        'company_name': 'שם החברה'
    };

    const state = {
        allContacts: [],
        filteredContacts: [],
        selectedContacts: [],
        filters: {
            tags: new Set(),
            genders: new Set(),
            leadSources: new Set(),
            alphabetRange: { start: '', end: '' } // State for the alphabet filter
        },
        currentStep: 1,
        isSending: false,
    };

    const DOMElements = {};
    let isDomCached = false;

    const _cacheDOMElements = () => {
        if (isDomCached) return true;
        const modal = document.getElementById('groupSendModal');
        if (!modal) return false;
        
        DOMElements.modal = modal;
        DOMElements.wizardContainer = modal.querySelector('#gs-wizard-container');
        DOMElements.steps = modal.querySelectorAll('.gs-step-indicator .step');
        DOMElements.stepContents = modal.querySelectorAll('.gs-step-content');
        
        // --- Step 1 (Filter Panel) ---
        DOMElements.alphabetStart = modal.querySelector('#gsAlphabetStart');
        DOMElements.alphabetEnd = modal.querySelector('#gsAlphabetEnd');
        DOMElements.tagsContainer = modal.querySelector('#gsTagsContainer');
        DOMElements.genderContainer = modal.querySelector('#gsGenderContainer');
        DOMElements.leadSourceContainer = modal.querySelector('#gsLeadSourceContainer');
        DOMElements.step1Count = modal.querySelector('#gsStep1Count');
        DOMElements.tagSearch = modal.querySelector('#gsTagSearch');
        DOMElements.selectedFiltersContainer = modal.querySelector('#gsSelectedFilters');


        // --- Step 2 ---
        DOMElements.contactSearch = modal.querySelector('#gsContactSearch');
        DOMElements.contactsForSelection = modal.querySelector('#gsContactsForSelection');
        DOMElements.step2Count = modal.querySelector('#gsStep2Count');

        // --- Step 3 ---
        DOMElements.messageText = modal.querySelector('#gsMessageText');
        DOMElements.dynamicTagsContainer = modal.querySelector('.composer-area .dynamic-tags-container');
        DOMElements.fileInput = modal.querySelector('#gsFileInput');
        DOMElements.fileName = modal.querySelector('#gsFileName');
        DOMElements.previewContactSelect = modal.querySelector('#gsPreviewContact');
        DOMElements.messagePreview = modal.querySelector('#gsMessagePreview');
        DOMElements.sendBtn = modal.querySelector('#gsSendBtn');
        DOMElements.stopBtn = modal.querySelector('#gsStopBtn');
        
        isDomCached = true;
        return true;
    };

    const openModal = async () => {
        if (!_cacheDOMElements()) return;
        _resetState();
        UI.openModal('groupSendModal');
        _goToStep(1);
        CRM_APP.utils.showLoader();
        try {
            let coreContacts = UI.getState().allContactsCache;
            if (!coreContacts || coreContacts.length === 0) {
                coreContacts = await window.API.getAllContacts();
            }
            state.allContacts = coreContacts.filter(c => c.status !== 'trashed');
            _populateFilterPanel();
            _applyFiltersAndUpdateUI();
        } catch (error) {
            CRM_APP.utils.showNotification(error, "error");
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };

    const _resetState = () => {
        state.filteredContacts = [];
        state.selectedContacts = [];
        state.filters.tags.clear();
        state.filters.genders.clear();
        state.filters.leadSources.clear();
        state.filters.alphabetRange = { start: '', end: '' };
        state.currentStep = 1;
        state.isSending = false;
        
        if (isDomCached) {
            if (DOMElements.tagSearch) DOMElements.tagSearch.value = '';
            if (DOMElements.messageText) DOMElements.messageText.value = '';
            if (DOMElements.fileInput) DOMElements.fileInput.value = '';
            if (DOMElements.fileName) DOMElements.fileName.textContent = '';
            if (DOMElements.contactSearch) DOMElements.contactSearch.value = '';
            if (DOMElements.alphabetStart) DOMElements.alphabetStart.value = '';
            if (DOMElements.alphabetEnd) DOMElements.alphabetEnd.value = '';
            document.querySelectorAll('.gs-filter-group').forEach(el => el.classList.remove('open'));
            document.querySelectorAll('.gs-filter-option input').forEach(el => el.checked = false);
        }
    };
    
    const _goToStep = (stepNumber) => {
        if (stepNumber > state.currentStep && state.filteredContacts.length === 0) {
            CRM_APP.utils.showNotification('יש לסנן לפחות איש קשר אחד כדי להמשיך.', 'info');
            return;
        }
        if (stepNumber > state.currentStep && state.currentStep === 2 && state.selectedContacts.length === 0) {
            CRM_APP.utils.showNotification('יש לבחור לפחות נמען אחד כדי להמשיך.', 'info');
            return;
        }
        state.currentStep = stepNumber;
        DOMElements.steps.forEach(step => {
            const stepIndex = parseInt(step.dataset.step, 10);
            step.classList.toggle('active', stepIndex <= stepNumber);
        });
        DOMElements.stepContents.forEach(content => {
            content.classList.toggle('active', parseInt(content.dataset.stepContent, 10) === stepNumber);
        });
        if (stepNumber === 2) _renderContactSelection();
        else if (stepNumber === 3) _renderMessageComposer();
    };

    const _populateFilterPanel = () => {
        const unique = { tags: new Map(), genders: new Map(), leadSources: new Map() };
        state.allContacts.forEach(c => {
            ['tg1', 'tg2', 'tg3'].forEach(tgKey => { if (c[tgKey]) { const tag = c[tgKey].trim(); if(tag) unique.tags.set(tag, (unique.tags.get(tag) || 0) + 1); } });
            if (c.gender) unique.genders.set(c.gender, (unique.genders.get(c.gender) || 0) + 1);
            if (c.lead_source) unique.leadSources.set(c.lead_source, (unique.leadSources.get(c.lead_source) || 0) + 1);
        });
        const renderOptions = (container, map, type) => {
            if (!container) return;
            const sortedMap = new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
            container.innerHTML = [...sortedMap].map(([name, count]) => `
                <div class="gs-filter-option" data-filter-name="${name.toLowerCase()}">
                    <label>
                        <input type="checkbox" data-filter-type="${type}" value="${name}">
                        <span class="option-name">${name}</span>
                        <span class="option-count">${count}</span>
                    </label>
                </div>
            `).join('');
        };
        renderOptions(DOMElements.tagsContainer, unique.tags, 'tags');
        renderOptions(DOMElements.genderContainer, unique.genders, 'genders');
        renderOptions(DOMElements.leadSourceContainer, unique.leadSources, 'leadSources');
    };
    
    const _getFilteredContacts = () => {
        const { tags, genders, leadSources, alphabetRange } = state.filters;

        return state.allContacts.filter(c => {
            // Standard filters
            const contactTags = [c.tg1, c.tg2, c.tg3].filter(Boolean);
            const tagMatch = tags.size === 0 || contactTags.some(t => tags.has(t));
            const genderMatch = genders.size === 0 || genders.has(c.gender);
            const leadSourceMatch = leadSources.size === 0 || leadSources.has(c.lead_source);

            // Alphabetical range filter
            let alphabetMatch = true;
            if (alphabetRange.start || alphabetRange.end) {
                const firstLetter = (c.conta_name || '').charAt(0);
                if (!firstLetter) {
                    alphabetMatch = false; // No name, no match
                } else if (alphabetRange.start && alphabetRange.end) {
                    // Both start and end defined
                    if (alphabetRange.start > alphabetRange.end) {
                        alphabetMatch = firstLetter >= alphabetRange.start || firstLetter <= alphabetRange.end;
                    } else {
                        alphabetMatch = firstLetter >= alphabetRange.start && firstLetter <= alphabetRange.end;
                    }
                } else if (alphabetRange.start) {
                    // Only start defined
                    alphabetMatch = firstLetter >= alphabetRange.start;
                } else if (alphabetRange.end) {
                    // Only end defined
                    alphabetMatch = firstLetter <= alphabetRange.end;
                }
            }

            return tagMatch && genderMatch && leadSourceMatch && alphabetMatch;
        });
    };

    const _applyFiltersAndUpdateUI = () => {
        const filtered = _getFilteredContacts();
        state.filteredContacts = filtered;
        state.selectedContacts = [...filtered];
        if(DOMElements.step1Count) DOMElements.step1Count.textContent = filtered.length;
        _renderSelectedFilterPills();
    };

    const _renderSelectedFilterPills = () => {
        if (!DOMElements.selectedFiltersContainer) return;
        const pillsHTML = [];
        
        const { start, end } = state.filters.alphabetRange;
        if (start && end) {
            pillsHTML.push(`<span class="gs-selected-filter-tag" data-filter-type="alphabetRange">שם: ${start} - ${end} <button data-action="gs-remove-filter"><span class="material-icons">close</span></button></span>`);
        }

        state.filters.tags.forEach(val => pillsHTML.push(`<span class="gs-selected-filter-tag" data-filter-type="tags" data-filter-value="${val}">${val} <button data-action="gs-remove-filter"><span class="material-icons">close</span></button></span>`));
        state.filters.genders.forEach(val => pillsHTML.push(`<span class="gs-selected-filter-tag" data-filter-type="genders" data-filter-value="${val}">${val} <button data-action="gs-remove-filter"><span class="material-icons">close</span></button></span>`));
        state.filters.leadSources.forEach(val => pillsHTML.push(`<span class="gs-selected-filter-tag" data-filter-type="leadSources" data-filter-value="${val}">${val} <button data-action="gs-remove-filter"><span class="material-icons">close</span></button></span>`));

        if (pillsHTML.length > 0) {
            DOMElements.selectedFiltersContainer.innerHTML = pillsHTML.join('');
        } else {
            DOMElements.selectedFiltersContainer.innerHTML = `<span class="placeholder">המסננים הפעילים יוצגו כאן.</span>`;
        }
    };
    
    const _renderContactSelection = () => {
        if (!DOMElements.contactSearch || !DOMElements.contactsForSelection) return;
        const contacts = state.filteredContacts;
        let searchTerm = DOMElements.contactSearch.value.toLowerCase();
        const filteredForDisplay = searchTerm ?
            contacts.filter(c => (c.conta_name || '').toLowerCase().includes(searchTerm) || (c.conta_phone || '').includes(searchTerm))
            : contacts;
        DOMElements.contactsForSelection.innerHTML = filteredForDisplay.map(contact => {
            const isSelected = state.selectedContacts.some(sc => sc.id === contact.id);
            return `<div class="contact-selection-item"><input type="checkbox" id="gs-contact-${contact.id}" data-contact-id="${contact.id}" ${isSelected ? 'checked' : ''}><label for="gs-contact-${contact.id}">${contact.conta_name || 'ללא שם'} (${contact.conta_phone || 'ללא טלפון'})</label></div>`;
        }).join('') || '<p class="empty-table-message">לא נמצאו אנשי קשר תואמים לחיפוש.</p>';
        _updateStep2Count();
    };

    const toggleContact = (checkbox) => {
        const contactId = parseInt(checkbox.dataset.contactId, 10);
        if (checkbox.checked) {
            if (!state.selectedContacts.some(c => c.id === contactId)) {
                const contactToAdd = state.filteredContacts.find(c => c.id === contactId);
                if (contactToAdd) state.selectedContacts.push(contactToAdd);
            }
        } else {
            state.selectedContacts = state.selectedContacts.filter(c => c.id !== contactId);
        }
        _updateStep2Count();
    };
    
    const selectAllContacts = (select = true) => { state.selectedContacts = select ? [...state.filteredContacts] : []; _renderContactSelection(); };
    const _updateStep2Count = () => { if (DOMElements.step2Count) { DOMElements.step2Count.textContent = `נבחרו ${state.selectedContacts.length} נמענים`; } };

    const _renderMessageComposer = () => {
        const dynamicFields = UI.getState().dynamicFields || {};
        
        // Use FIELD_LABELS as the source of truth for labels, ensuring no brackets
        const processedFields = Object.keys(FIELD_LABELS).reduce((acc, key) => {
            const label = FIELD_LABELS[key] || dynamicFields[key] || key;
            acc[key] = label.replace(/[{}]/g, ''); 
            return acc;
        }, {});

        DOMElements.dynamicTagsContainer.innerHTML = Object.entries(processedFields).map(([fieldKey, displayName]) => `
            <button type="button" class="tag-button" data-action="gs-insert-tag" data-tag="{${displayName}}">${displayName}</button>
        `).join('');
        DOMElements.previewContactSelect.innerHTML = state.selectedContacts.map(c => `<option value="${c.id}">${c.conta_name}</option>`).join('');
        _updatePreview();
    };
    
    const insertTagToMessage = (tag) => {
        const textarea = DOMElements.messageText;
        if (!textarea) return;
        const start = textarea.selectionStart;
        textarea.value = textarea.value.substring(0, start) + tag + textarea.value.substring(start);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + tag.length;
        _updatePreview();
    };

    const _updatePreview = () => {
        if (!DOMElements.previewContactSelect || !DOMElements.messageText || !DOMElements.messagePreview) return;
        const selectedContactId = parseInt(DOMElements.previewContactSelect.value, 10);
        const contact = state.selectedContacts.find(c => c.id === selectedContactId);
        let message = DOMElements.messageText.value;
        if (contact) {
            for (const fieldKey of Object.keys(FIELD_LABELS)) {
                const displayName = FIELD_LABELS[fieldKey];
                const cleanLabel = displayName.replace(/[{}]/g, '');
                
                const variations = [
                    `{${cleanLabel}}`,
                    `{${fieldKey}}`,
                    `{{${cleanLabel}}}`,
                    `{{${fieldKey}}}`
                ];
                
                const val = contact[fieldKey] !== undefined && contact[fieldKey] !== null ? String(contact[fieldKey]) : '';
                
                variations.forEach(tag => {
                    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    message = message.replace(new RegExp(escaped, 'g'), val);
                });
            }
        }
        DOMElements.messagePreview.textContent = message;
    };
    
    const handleSendMessage = async () => {
        if (state.isSending) return;
        let message = DOMElements.messageText.value.trim();
        const file = DOMElements.fileInput.files[0];
        if (!message && !file) return CRM_APP.utils.showNotification('יש לכתוב הודעה או לבחור קובץ.', 'warning');
        if (state.selectedContacts.length === 0) return CRM_APP.utils.showNotification('לא נבחרו נמענים.', 'warning');
        if (file && !message) message = ''; 
        
        const uniqueContactsMap = new Map();
        state.selectedContacts.forEach(contact => {
            if (contact.conta_phone) {
                const normalizedPhone = CRM_APP.utils.cleanPhoneNumber(contact.conta_phone);
                if (normalizedPhone && !uniqueContactsMap.has(normalizedPhone)) {
                    uniqueContactsMap.set(normalizedPhone, contact);
                }
            }
        });
        
        const uniqueRecipientEntries = Array.from(uniqueContactsMap.entries());

        if (uniqueRecipientEntries.length === 0) {
            return CRM_APP.utils.showNotification('לא נמצאו נמענים עם מספרי טלפון תקינים לשליחה.', 'warning');
        }

        let confirmationMessage = `האם לשלוח הודעה אל ${uniqueRecipientEntries.length} נמענים ייחודיים?`;
        if (uniqueRecipientEntries.length < state.selectedContacts.length) {
            const duplicatesRemoved = state.selectedContacts.length - uniqueRecipientEntries.length;
            confirmationMessage += ` (${duplicatesRemoved} כפילויות הוסרו).`;
        }

        UI.showConfirmation(confirmationMessage, async () => {
            state.isSending = true;
            DOMElements.sendBtn.disabled = true; DOMElements.stopBtn.style.display = 'inline-flex'; DOMElements.sendBtn.innerHTML = `<span class="material-icons spin">sync</span> שולח...`;
            CRM_APP.utils.showProgress(`מתחיל שליחה...`);

            const dynamicFields = UI.getState().dynamicFields || {};
            let successCount = 0, failureCount = 0; const recipientsLog = [];

            for (let i = 0; i < uniqueRecipientEntries.length; i++) {
                if (!state.isSending) break;
                
                const [normalizedPhone, contact] = uniqueRecipientEntries[i];

                CRM_APP.utils.updateProgress(Math.round(((i + 1) / uniqueRecipientEntries.length) * 100), `שולח אל ${contact.conta_name || normalizedPhone}... (${i + 1}/${uniqueRecipientEntries.length})`);
                
                let personalizedMessage = message;
                for (const fieldKey of Object.keys(FIELD_LABELS)) { 
                    const displayName = FIELD_LABELS[fieldKey];
                    const cleanLabel = displayName.replace(/[{}]/g, '');
                    const val = contact[fieldKey] !== undefined && contact[fieldKey] !== null ? String(contact[fieldKey]) : '';
                    
                    const variations = [`{${cleanLabel}}`, `{${fieldKey}}`, `{{${cleanLabel}}}`, `{{${fieldKey}}}`];
                    variations.forEach(tag => {
                        const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        personalizedMessage = personalizedMessage.replace(new RegExp(escaped, 'g'), val);
                    });
                }
                
                try {
                    let response;
                    if (file) {
                        response = await window.GreenAPI.sendFile(contact.conta_phone, file, personalizedMessage);
                    } else {
                        if (!personalizedMessage) throw new Error('Message content cannot be empty.');
                        response = await window.GreenAPI.sendMessage(contact.conta_phone, personalizedMessage);
                    }
                    successCount++;
                    recipientsLog.push({
                        name: contact.conta_name,
                        phone: normalizedPhone, // **FIX: Send the normalized phone for consistent DB storage**
                        status: 'השליחה הצליחה',
                        response: JSON.stringify(response),
                        personalized_content: personalizedMessage
                    });
                } catch (error) {
                    console.error('Error sending message via GreenAPI for contact', contact.conta_phone, ':', error); failureCount++;
                    recipientsLog.push({
                        name: contact.conta_name,
                        phone: normalizedPhone, // **FIX: Send the normalized phone for consistent DB storage**
                        status: `השליחה נכשלה: ${error.message}`,
                        response: JSON.stringify({ error: error.message }),
                        personalized_content: personalizedMessage
                    });
                }
                await new Promise(res => setTimeout(res, 500));
            }
            CRM_APP.utils.hideProgress();
            
            if (recipientsLog.length > 0) {
                try {
                    await window.API.saveMessageHistory({
                        message_content: message || `קובץ: ${file ? file.name : 'ללא תוכן'}`,
                        total_recipients: uniqueRecipientEntries.length,
                        success_count: successCount,
                        failure_count: failureCount,
                        recipients: recipientsLog
                    });
                } catch(error) {
                    console.error('Error saving message history:', error);
                    CRM_APP.utils.showNotification('שגיאה בשמירת היסטוריית ההודעה.', 'error');
                }
            }

            CRM_APP.utils.showNotification(`השליחה הושלמה! ${successCount} הצלחות, ${failureCount} כשלונות.`, 'success');
            
            state.isSending = false; DOMElements.sendBtn.disabled = false; DOMElements.stopBtn.style.display = 'none'; DOMElements.sendBtn.innerHTML = `<span class="material-icons">send</span> שלח הודעות`;
        });
    };
    
    const stopSending = () => { state.isSending = false; CRM_APP.utils.showNotification('השליחה נעצרה.', 'info'); };
    
    const _handleDelegatedClick = (e) => {
        const target = e.target.closest('[data-action]');
        if (!target || !target.dataset.action.startsWith('gs-')) return;
        e.preventDefault();
        const action = target.dataset.action;
        const actions = {
            'gs-next-step': () => _goToStep(parseInt(target.dataset.nextStep, 10)),
            'gs-prev-step': () => _goToStep(parseInt(target.dataset.prevStep, 10)),
            'gs-select-all-contacts': () => selectAllContacts(true),
            'gs-deselect-all-contacts': () => selectAllContacts(false),
            'gs-insert-tag': () => insertTagToMessage(target.dataset.tag),
            'gs-send': handleSendMessage, 'gs-stop': stopSending,
            'gs-toggle-filter-group': () => target.closest('.gs-filter-group').classList.toggle('open'),
            'gs-reset-filters': () => { _resetState(); _populateFilterPanel(); _applyFiltersAndUpdateUI(); },
            'gs-remove-filter': () => {
                const pill = target.closest('.gs-selected-filter-tag');
                const type = pill.dataset.filterType;
                if (type === 'alphabetRange') {
                    state.filters.alphabetRange = { start: '', end: '' };
                    if (DOMElements.alphabetStart) DOMElements.alphabetStart.value = '';
                    if (DOMElements.alphabetEnd) DOMElements.alphabetEnd.value = '';
                } else {
                    const value = pill.dataset.filterValue;
                    const checkbox = DOMElements.modal.querySelector(`input[data-filter-type="${type}"][value="${value}"]`);
                    if (checkbox) checkbox.checked = false;
                    state.filters[type].delete(value);
                }
                _applyFiltersAndUpdateUI();
            }
        };
        if (actions[action]) actions[action]();
    };

    const _handleCoreAction = (e) => { if (e.detail.action === 'open-group-send-modal') { e.preventDefault(); openModal(); } };
    
    const _setupEventListeners = () => {
        document.body.addEventListener('click', _handleDelegatedClick);
        document.body.addEventListener('mh-crm-action', _handleCoreAction);
        DOMElements.modal.addEventListener('change', e => {
            const target = e.target;
            if (target.matches('.gs-filter-option input[type="checkbox"]')) {
                const type = target.dataset.filterType;
                const value = target.value;
                if(target.checked) state.filters[type].add(value);
                else state.filters[type].delete(value);
                _applyFiltersAndUpdateUI();
            }
            // Handle alphabet filter change
            if (target.matches('#gsAlphabetStart, #gsAlphabetEnd')) {
                state.filters.alphabetRange.start = DOMElements.alphabetStart.value;
                state.filters.alphabetRange.end = DOMElements.alphabetEnd.value;
                _applyFiltersAndUpdateUI();
            }
        });
        DOMElements.tagSearch?.addEventListener('input', e => {
            const searchTerm = e.target.value.toLowerCase();
            DOMElements.tagsContainer.querySelectorAll('.gs-filter-option').forEach(option => {
                option.style.display = option.dataset.filterName.includes(searchTerm) ? 'flex' : 'none';
            });
        });
        DOMElements.contactsForSelection?.addEventListener('change', e => { if (e.target.type === 'checkbox') toggleContact(e.target); });
        DOMElements.contactSearch?.addEventListener('input', _renderContactSelection);
        DOMElements.messageText?.addEventListener('input', _updatePreview);
        DOMElements.previewContactSelect?.addEventListener('change', _updatePreview);
        DOMElements.fileInput?.addEventListener('change', e => { if (DOMElements.fileName) DOMElements.fileName.textContent = e.target.files[0]?.name || ''; });
    };

    let isInitialized = false;

    UI.groupSend.init = () => {
        if (isInitialized) return;
        if (!_cacheDOMElements()) return;
        _setupEventListeners();
        isInitialized = true;
    };
})(window.UI);