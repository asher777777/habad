/**
 * File: ui-main.js
 * Description: The core UI module for the CRM. This version is refactored to support add-on views like Analytics.
 * @package M_H_CRM_Plugin
 * @version 15.0.0
 * --- CHANGELOG V15.0.0 ---
 * - CRITICAL PERFORMANCE FIX: Reworked the entire data fetching logic to use server-side pagination and searching.
 * The app no longer loads all contacts into memory, making it scalable for large databases.
 * - BUG FIX: Fixed the tab switching mechanism for "Trash" and "Analytics" views. They now correctly trigger data re-fetching or module loading.
 * - REFACTOR: Simplified state management. `allContactsCache` is removed, and the state now holds only the current page's data.
 * - UX: Implemented a debounce function for the search input to prevent excessive API calls while typing.
 */

window.UI = window.UI || {};

(function (UI) {
    'use strict';

    let isInitialized = false;

    const state = {
        dynamicFields: {
            'conta_name': 'שם פרטי',
            'f_m': 'שם משפחה',
            'conta_phone': 'טלפון',
            'gender': 'מגדר',
            'tg1': 'תג 1',
            'tg2': 'תג 2',
            'tg3': 'תג 3'
        },
        contacts: [], // Holds only the contacts for the currently displayed page
        currentSort: { column: 'id', direction: 'desc' },
        allowedSortFields: ['id', 'conta_name', 'f_m', 'conta_phone', 'email', 'status'], // Whitelist for UI
        itemsPerPage: 50,
        totalContacts: 0,
        totalPages: 0,
        currentView: 'active', // 'active' or 'trashed'
        activeViewId: 'contacts-view', // 'contacts-view' or 'analytics-view', etc.
        currentSearch: '',
        tagFilter: '',
        cityFilter: '',
        leadSourceFilter: '',
        confirmation: { onConfirm: null }
    };

    const DOMElements = {};

    // Utility to prevent rapid API calls on search input
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const _cacheDOMElements = () => {
        const crmWrapper = document.getElementById('crm-app-wrapper');
        if (!crmWrapper) return false;
        DOMElements.wrapper = crmWrapper;
        DOMElements.tableBody = crmWrapper.querySelector('#tableBody');
        DOMElements.tableHead = crmWrapper.querySelector('#contactsTable thead');
        DOMElements.searchInput = crmWrapper.querySelector('#searchInput');
        DOMElements.paginationContainer = crmWrapper.querySelector('#paginationContainer');
        DOMElements.pageNumbers = crmWrapper.querySelector('#pageNumbers');
        DOMElements.prevPage = crmWrapper.querySelector('#prevPage');
        DOMElements.nextPage = crmWrapper.querySelector('#nextPage');
        DOMElements.bulkActionSelect = crmWrapper.querySelector('#bulkActionSelect');
        DOMElements.viewTabsContainer = crmWrapper.querySelector('.view-tabs');
        DOMElements.trashCounter = crmWrapper.querySelector('#trash-counter');
        DOMElements.activeCounter = crmWrapper.querySelector('#active-counter');
        DOMElements.confirmationMessageText = document.getElementById('confirmationMessageText');
        DOMElements.filterTag = document.getElementById('filterTag');
        DOMElements.filterCity = document.getElementById('filterCity');
        DOMElements.filterSource = document.getElementById('filterSource');
        return true;
    };

    const _setupEventListeners = () => {
        document.body.addEventListener('click', _handleDelegatedClick);

        // Debounced search input
        DOMElements.searchInput?.addEventListener('input', debounce(e => {
            state.currentSearch = e.target.value;
            state.currentPage = 1;
            _fetchContacts();
        }, 300));
        
        const handleFilterChange = (e) => {
            if (e.target.id === 'filterTag') state.tagFilter = e.target.value;
            if (e.target.id === 'filterCity') state.cityFilter = e.target.value;
            if (e.target.id === 'filterSource') state.leadSourceFilter = e.target.value;
            state.currentPage = 1;
            _fetchContacts();
        };

        DOMElements.filterTag?.addEventListener('change', handleFilterChange);
        DOMElements.filterCity?.addEventListener('change', handleFilterChange);
        DOMElements.filterSource?.addEventListener('change', handleFilterChange);

        DOMElements.tableBody?.addEventListener('focusout', (e) => {
            if (e.target.isContentEditable) UI.actions.handleCellEdit(e);
        });
        DOMElements.tableHead?.addEventListener('change', (e) => {
            if (e.target.id === 'selectAll') {
                DOMElements.tableBody.querySelectorAll('.contact-checkbox')
                    .forEach(checkbox => checkbox.checked = e.target.checked);
            }
        });

        // Sorting handler
        DOMElements.tableHead?.addEventListener('click', (e) => {
            const th = e.target.closest('th[data-sort]');
            if (!th) return;
            const column = th.dataset.sort;
            _handleSort(column);
        });
    };

    const _handleSort = (column) => {
        if (state.currentSort.column === column) {
            state.currentSort.direction = state.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.currentSort.column = column;
            state.currentSort.direction = 'desc'; // Default to desc for new column
        }
        state.currentPage = 1;
        _renderTableHeader(); // Re-render to show arrows
        _fetchContacts();
    };

    const _handleDelegatedClick = (e) => {
        const actionTarget = e.target.closest('[data-action]');
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;

        // Prevent default for button-like elements, but not for links if needed
        if (actionTarget.tagName === 'BUTTON' || actionTarget.role === 'button' || actionTarget.closest('button')) {
            e.preventDefault();
        }

        // Tab switching is a primary UI concern, handle it here.
        if (action.startsWith('view-')) {
            _handleViewSwitch(actionTarget);
            return;
        }

        const actionHandlers = {
            'refresh-contacts': () => _fetchContacts(true),
            'trash-contact': () => UI.actions.handleTrashContact(actionTarget.dataset),
            'restore-contact': () => UI.actions.handleRestoreContact(actionTarget.dataset),
            'delete-permanent-contact': () => UI.actions.handleDeletePermanentContact(actionTarget.dataset),
            'execute-bulk-action': UI.actions.handleBulkAction,
            'add-contact': UI.actions.handleAddContact,
            'trigger-excel-upload': UI.actions.triggerExcelUpload,
            'download-excel': UI.actions.handleExcelDownload,
            'send-message': () => UI.actions.handleSendMessageToSingle(actionTarget.dataset),
            'submit-add-contact-form': UI.actions.submitAddContactForm,
            'edit-contact': () => UI.actions.openEditContactModal(actionTarget.dataset.id),
            'submit-edit-contact-form': UI.actions.submitEditContactForm,
            'add-event-row': UI.actions.addEventRow,
            'delete-event-row': () => UI.actions.deleteEventRow(actionTarget),
            'go-to-prev-page': () => { if (state.currentPage > 1) { state.currentPage--; _fetchContacts(); } },
            'go-to-next-page': () => { if (!actionTarget.disabled) { state.currentPage++; _fetchContacts(); } },
            'close-modal': () => UI.closeModal(actionTarget.closest('.modal').id),
            'confirm-action': () => { UI.closeModal('confirmationModal'); if (state.confirmation.onConfirm) { state.confirmation.onConfirm(); } },
            'view-order-details': () => UI.actions.handleViewOrderDetails(actionTarget.dataset.id),
            'send-from-modal': UI.actions.handleSendFromModal
        };

        if (actionHandlers[action]) {
            actionHandlers[action]();
        }

        // --- ADDED: Dispatch custom event for add-ons (e.g. WhatsApp Add-on) ---
        // This ensures compatibility with modules that listen for the 'mh-crm-action' event.
        document.body.dispatchEvent(new CustomEvent('mh-crm-action', {
            detail: { 
                action: action, 
                target: actionTarget, 
                dataset: actionTarget.dataset 
            },
            bubbles: true,
            cancelable: true
        }));
    };

    const _handleViewSwitch = (tabElement) => {
        const viewId = tabElement.dataset.viewId;
        const newStatus = tabElement.dataset.status;

        // Handle tabs inside a modal (like edit contact)
        if (tabElement.matches('.modal .tab-link')) {
            const modal = tabElement.closest('.modal');
            modal.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            tabElement.classList.add('active');
            modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const activeTabContent = modal.querySelector(`#${tabElement.dataset.tab}`);
            if (activeTabContent) activeTabContent.classList.add('active');

            // Trigger data loading for specific tabs in edit modal
            if (typeof UI.actions.loadEditModalTabData === 'function') {
                UI.actions.loadEditModalTabData(tabElement.dataset.tab);
            }
            return;
        }

        // Handle main view tabs (Contacts, Trash, Analytics)
        if (state.activeViewId === viewId && state.currentView === newStatus) return; // No change

        DOMElements.viewTabsContainer.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.view-container').forEach(container => container.style.display = 'none');

        tabElement.classList.add('active');
        const newViewContainer = document.getElementById(viewId);
        if (newViewContainer) newViewContainer.style.display = 'block';

        state.activeViewId = viewId;

        if (viewId === 'contacts-view') {
            state.currentView = newStatus;
            state.currentPage = 1;
            _updateBulkActions();
            _fetchContacts(true); // Force refresh with new status
        } else if (viewId === 'analytics-view') {
            if (window.ANALYTICS && typeof window.ANALYTICS.loadData === 'function') {
                window.ANALYTICS.loadData();
            }
        }
    };

    const refreshStats = async () => {
        try {
            const stats = await window.API.getStats();
            if (DOMElements.activeCounter) DOMElements.activeCounter.textContent = stats.active || 0;
            if (DOMElements.trashCounter) DOMElements.trashCounter.textContent = stats.trashed || 0;
        } catch (error) {
            console.error("Failed to refresh stats:", error);
        }
    };

    const _fetchContacts = async (forceStatsRefresh = false) => {
        CRM_APP.utils.showLoader();
        try {
            const params = {
                page: state.currentPage,
                per_page: state.itemsPerPage,
                status: state.currentView,
                search: state.currentSearch,
                tag_filter: state.tagFilter,
                city_filter: state.cityFilter,
                lead_source_filter: state.leadSourceFilter,
                orderby: state.currentSort.column,
                order: state.currentSort.direction
            };
            const { contacts, total, totalPages } = await window.API.getContacts(params);

            // DEBUG: Temporary notification to diagnose data issue
            // CRM_APP.utils.showNotification(`Debug: Fetched ${contacts.length} contacts. Total from API: ${total}`, 'info');

            state.contacts = contacts;
            state.totalContacts = total;
            state.totalPages = totalPages;

            _renderTable(state.contacts);
            _updatePagination();

            // Sync tab counters based on current status
            if (state.currentView === 'active' && DOMElements.activeCounter) {
                DOMElements.activeCounter.textContent = total;
            } else if (state.currentView === 'trashed' && DOMElements.trashCounter) {
                DOMElements.trashCounter.textContent = total;
            }

            if (forceStatsRefresh) {
                await refreshStats();
            }
        } catch (error) {
            CRM_APP.utils.showNotification(error, 'error');
            DOMElements.tableBody.innerHTML = `<tr><td colspan="${Object.keys(state.dynamicFields).length + 2}" class="empty-table-message"><h3>שגיאה בטעינת נתונים</h3></td></tr>`;
        } finally {
            CRM_APP.utils.hideLoader();
        }
    };

    const _updateBulkActions = () => {
        if (!DOMElements.bulkActionSelect) return;
        const isTrashView = state.currentView === 'trashed';
        if (DOMElements.bulkActionSelect.querySelector('option[value="trash"]'))
            DOMElements.bulkActionSelect.querySelector('option[value="trash"]').style.display = isTrashView ? 'none' : 'block';
        if (DOMElements.bulkActionSelect.querySelector('option[value="delete-permanent"]'))
            DOMElements.bulkActionSelect.querySelector('option[value="delete-permanent"]').style.display = isTrashView ? 'block' : 'none';
        if (DOMElements.bulkActionSelect.querySelector('option[value="restore"]'))
            DOMElements.bulkActionSelect.querySelector('option[value="restore"]').style.display = isTrashView ? 'block' : 'none';
        DOMElements.bulkActionSelect.value = '';
    };

    const _renderTableHeader = () => {
        if (!DOMElements.tableHead) return;

        const getSortIcon = (col) => {
            if (state.currentSort.column !== col) return '<span class="material-icons sort-icon">unfold_more</span>';
            return state.currentSort.direction === 'asc'
                ? '<span class="material-icons sort-icon active">arrow_upward</span>'
                : '<span class="material-icons sort-icon active">arrow_downward</span>';
        };

        DOMElements.tableHead.innerHTML = `
            <tr>
                <th><input type="checkbox" id="selectAll" title="בחר הכל"></th>
                ${Object.keys(state.dynamicFields).map(key => {
            // Check if this field allows sorting (based on your API whitelist)
            const canSort = state.allowedSortFields.includes(key);
            const sortAttr = canSort ? `data-sort="${key}" class="sortable-header"` : '';
            const icon = canSort ? getSortIcon(key) : '';
            return `<th ${sortAttr}>${state.dynamicFields[key]} ${icon}</th>`;
        }).join('')}
                <th>פעולות</th>
            </tr>`;
    };

    const _renderTable = (contacts) => {
        if (!DOMElements.tableBody) return;
        const fieldKeys = Object.keys(state.dynamicFields);

        if (contacts.length === 0) {
            const message = state.currentSearch ? 'לא נמצאו אנשי קשר תואמים לחיפוש.' : (state.currentView === 'active' ? 'לא נמצאו אנשי קשר פעילים.' : 'סל האשפה ריק.');
            DOMElements.tableBody.innerHTML = `<tr><td colspan="${fieldKeys.length + 2}" class="empty-table-message"><h3>${message}</h3></td></tr>`;
            return;
        }

        const getActionButtons = (contact) => {
            if (state.currentView === 'trashed') {
                return `<button class="btn" data-action="restore-contact" data-id="${contact.id}" title="שחזר"><span class="material-icons">restore_from_trash</span></button>
                        <button class="btn" data-action="delete-permanent-contact" data-id="${contact.id}" title="מחק לצמיתות"><span class="material-icons">delete_forever</span></button>`;
            }
            // Use an actual anchor tag for the send button to avoid issues, styled as a button
            return `<button class="btn" data-action="edit-contact" data-id="${contact.id}" title="ערוך"><span class="material-icons">edit</span></button>
                    <button class="btn" data-action="trash-contact" data-id="${contact.id}" title="העבר לאשפה"><span class="material-icons">delete</span></button>
                    <button class="btn" data-action="send-message" data-id="${contact.id}" data-phone="${contact.conta_phone || ''}" title="שלח הודעה"><span class="material-icons">send</span></button>`;
        };

        DOMElements.tableBody.innerHTML = contacts.map(contact => `
            <tr data-contact-id="${contact.id}">
                <td><input type="checkbox" class="contact-checkbox" data-id="${contact.id}"></td>
                ${fieldKeys.map(key => {
                    const label = state.dynamicFields[key] || '';
                    return `<td class="editable-cell" data-label="${label}" data-field="${key}" data-original-value="${String(contact[key] || '')}">${String(contact[key] || '')}</td>`;
                }).join('')}
                <td class="action-cell" data-label="פעולות">${getActionButtons(contact)}</td>
            </tr>`).join('');
    };

    const _updatePagination = () => {
        if (!DOMElements.paginationContainer) return;
        if (state.totalPages <= 1) {
            DOMElements.paginationContainer.style.display = 'none';
        } else {
            DOMElements.paginationContainer.style.display = 'flex';
            DOMElements.pageNumbers.textContent = `עמוד ${state.currentPage} מתוך ${state.totalPages} (${state.totalContacts} תוצאות)`;
            DOMElements.prevPage.disabled = state.currentPage <= 1;
            DOMElements.nextPage.disabled = state.currentPage >= state.totalPages;
        }
    };

    UI.openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('visible');
            document.body.classList.add('modal-open');
        }
    };
    UI.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('visible');
            if (document.querySelectorAll('.modal.visible').length === 0) {
                document.body.classList.remove('modal-open');
            }
        }
    };
    UI.showConfirmation = (message, onConfirm) => {
        state.confirmation.onConfirm = onConfirm;
        if (DOMElements.confirmationMessageText) {
            DOMElements.confirmationMessageText.textContent = message;
            UI.openModal('confirmationModal');
        } else { if (confirm(message)) { onConfirm(); } }
    };
    UI.getState = () => state;
    UI.getDOMElements = () => DOMElements;
    UI.refreshContacts = (forceStatsRefresh = true) => _fetchContacts(forceStatsRefresh);
    UI.refreshStats = refreshStats;

    UI.init = function () {
        if (isInitialized) return;
        const contactsView = document.getElementById('contacts-view');
        if (!contactsView) {
            console.log("M.H CRM: Contacts view not found, skipping main table UI initialization.");
            isInitialized = true;
            return;
        }

        if (!_cacheDOMElements()) return;
        const configFields = window.crm_config?.dynamic_fields || {};
        // Invert the config to be Key => Label (it comes as Label => Key)
        state.dynamicFields = Object.fromEntries(Object.entries(configFields).map(([label, key]) => [key, label]));
        _renderTableHeader();
        _setupEventListeners();
        if (UI.actions && typeof UI.actions.init === 'function') UI.actions.init();

        // Load dynamic filters
        window.API.getFilters().then(filters => {
            if (!filters) return;
            if (DOMElements.filterTag && filters.tags) {
                const options = filters.tags.map(t => `<option value="${t}">${t}</option>`).join('');
                DOMElements.filterTag.innerHTML = `<option value="">כל התוויות</option>${options}`;
            }
            if (DOMElements.filterCity && filters.cities) {
                const options = filters.cities.map(c => `<option value="${c}">${c}</option>`).join('');
                DOMElements.filterCity.innerHTML = `<option value="">כל הערים</option>${options}`;
            }
            if (DOMElements.filterSource && filters.lead_sources) {
                const options = filters.lead_sources.map(s => `<option value="${s}">${s}</option>`).join('');
                DOMElements.filterSource.innerHTML = `<option value="">כל המקורות</option>${options}`;
            }
        }).catch(err => console.error("Failed to load filters:", err));

        _updateBulkActions();
        _fetchContacts(true); // Initial data fetch

        // --- ADDED: Initialize Add-on Modules (e.g. WhatsApp, WooCommerce Extensions) ---
        if (window.CRM_ADDON_MODULES) {
            Object.values(window.CRM_ADDON_MODULES).forEach(module => {
                if (typeof module.init === 'function') {
                    try { module.init(); } catch (e) { console.error("Error initializing add-on module:", e); }
                }
            });
        }

        contactsView.style.display = 'block';
        isInitialized = true;
    };
})(window.UI);