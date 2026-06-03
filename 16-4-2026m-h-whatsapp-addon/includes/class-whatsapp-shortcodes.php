<?php
/**
 * File: class-whatsapp-shortcodes.php
 * Description: Handles all shortcodes and UI injections for the WhatsApp Add-on.
 *
 * @package M_H_WhatsApp_Addon
 * @version 17.1.0
 * --- CHANGELOG ---
 * V17.1.0:
 * - UX IMPROVEMENT: Added description text to each filter group in the Group Send modal.
 * - UX IMPROVEMENT: The alphabetical filter is now fully visible when its accordion is open.
 * V17.0.0:
 * - FEATURE: Added an alphabetical range filter to the Group Send modal.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class WhatsApp_Shortcodes {

    public function init() {
        add_shortcode('my_crm_account_details', [$this, 'render_account_details_shortcode']);
        add_shortcode('my_crm_group_manager', [$this, 'render_group_manager_shortcode']);
        add_shortcode('my_crm_whatsapp_contacts_importer', [$this, 'render_whatsapp_contacts_importer_shortcode']);
        add_shortcode('my_crm_group_send', [$this, 'render_group_send_shortcode']);
        add_shortcode('my_crm_message_history', [$this, 'render_message_history_shortcode']);

        add_action('mh_crm_main_actions', [$this, 'inject_group_send_button']);
        add_action('mh_crm_header_actions', [$this, 'inject_account_details_trigger']);
        add_action('mh_crm_footer_modals', [$this, 'inject_whatsapp_modals']);
        add_action('mh_crm_user_profile_shortcodes', [$this, 'inject_shortcodes_to_profile']);
    }

    public function inject_group_send_button() {
        echo '<button data-action="open-group-send-modal" class="btn-primary"><span class="material-icons">groups</span><span>שליחה קבוצתית</span></button>';
    }

    public function inject_account_details_trigger() {
        if (!is_user_logged_in()) { return; }
        ?>
        <div class="crm-account-widget header-integration">
            <button class="profile-button" data-action="open-profile-modal" aria-label="חשבון">
                <div class="default-avatar"><span class="material-icons">account_circle</span></div>
                <span class="profile-text">פרטי חשבון</span>
            </button>
        </div>
        <?php
    }
    
    public function render_account_details_shortcode() {
        if (!is_user_logged_in()) { return ''; }
        ob_start();
        ?>
        <div class="crm-account-widget">
            <button class="profile-button" data-action="open-profile-modal" aria-label="חשבון">
                <div class="default-avatar"><span class="material-icons">account_circle</span></div>
                <span class="profile-text">פרטי חשבון</span>
            </button>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_group_manager_shortcode() {
        if (!is_user_logged_in()) { return $this->get_login_message(); }
        ob_start();
        ?>
        <div id="group-manager-container" class="group-manager-container">
            <div class="manager-header">
                <h1>ייבוא חברים מקבוצות WhatsApp</h1>
                <p>טען את רשימת הקבוצות שלך כדי לייבא חברים ישירות למערכת ה-CRM.</p>
            </div>
            <div class="importer-controls">
                <button id="loadGroupsBtn" class="btn-primary" data-action="load-groups"><span class="material-icons">sync</span> טען קבוצות</button>
                <input type="text" id="groupSearchInput" placeholder="חפש קבוצה...">
            </div>
            <div id="groupTable" class="table-container" style="display:none;"><table class="wp-list-table widefat striped"><thead><tr><th>שם הקבוצה</th><th>פעולות</th></tr></thead><tbody id="groupList"></tbody></table></div>
            <div id="loader" style="display:none; text-align:center; padding: 20px;"><div class="loading-spinner" style="margin:auto;"></div><p id="loader-message">טוען...</p></div>
            <p id="initial-message">לחץ על "טען קבוצות" כדי להתחיל.</p>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_whatsapp_contacts_importer_shortcode() {
        return "Shortcode for WhatsApp Contacts Importer";
    }

    public function render_group_send_shortcode() {
        if (!is_user_logged_in()) { return $this->get_login_message(); }
        ob_start();
        echo '<button data-action="open-group-send-modal" class="btn-primary"><span class="material-icons">groups</span><span>פתח אשף שליחה קבוצתית</span></button>';
        return ob_get_clean();
    }

    public function render_message_history_shortcode() {
        if (!is_user_logged_in()) { return $this->get_login_message(); }
        ob_start();
        ?>
        <div id="message-history-app-wrapper" class="crm-app-wrapper">
            <main class="app-main">
                <div class="history-header"><h2><span class="material-icons">history</span> היסטוריית הודעות שנשלחו</h2><button id="loadHistoryBtn" class="button button-secondary" data-action="load-history"><span class="material-icons">sync</span> טען היסטוריה</button></div>
                <div class="bulk-actions-container"><select id="historyBulkActionSelect"><option value="">בחר פעולה...</option><option value="delete">מחק נבחרים</option></select><button data-action="execute-history-bulk-action">בצע</button></div>
                <div class="table-container"><table id="messageHistoryTable" class="crm-table"><thead><tr><th><input type="checkbox" id="selectAllHistory" title="בחר הכל"></th><th>ID</th><th>תאריך</th><th>תצוגה מקדימה</th><th>סה"כ</th><th>הצלחות</th><th>כשלונות</th><th>פעולות</th></tr></thead><tbody id="messageHistoryTableBody"><tr><td colspan="8" class="empty-table-message"><h3>לחץ על "טען היסטוריה" כדי להציג נתונים.</h3></td></tr></tbody></table></div>
                <div id="messageHistoryPagination" class="pagination" style="display: none;"><button id="msgHistoryPrevPage" data-action="history-prev-page">הקודם</button><span id="msgHistoryPageNumbers"></span><button id="msgHistoryNextPage" data-action="history-next-page">הבא</button></div>
            </main>
        </div>
        <?php
        return ob_get_clean();
    }

    public function inject_whatsapp_modals() {
        $hebrew_alphabet = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'];
        ?>
        <div id="groupSendModal" class="modal">
            <div class="modal-content large gs-modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">אשף שליחה קבוצתית</h2>
                    <button type="button" class="close" data-action="close-modal" title="סגור">&times;</button>
                </div>
                <div class="modal-body" id="gs-wizard-container">
                    <div class="gs-step-indicator">
                        <div class="step active" data-step="1"><div class="step-icon">1</div><div class="step-label">בחירת קהל יעד</div></div>
                        <div class="step-connector"></div>
                        <div class="step" data-step="2"><div class="step-icon">2</div><div class="step-label">בחירת נמענים</div></div>
                        <div class="step-connector"></div>
                        <div class="step" data-step="3"><div class="step-icon">3</div><div class="step-label">תוכן ההודעה ושליחה</div></div>
                    </div>

                    <!-- Step 1: Filtering -->
                    <div class="gs-step-content active" data-step-content="1">
                        <div class="gs-filter-layout">
                            <aside class="gs-filter-panel">
                                <h3 class="gs-filter-panel-title">סנן אנשי קשר</h3>
                                
                                <div class="gs-filter-group open">
                                    <button type="button" class="gs-filter-group-header" data-action="gs-toggle-filter-group">
                                        <span>סינון אלפביתי</span>
                                        <span class="material-icons">expand_more</span>
                                    </button>
                                    <div class="gs-filter-group-content">
                                        <p class="gs-filter-group-description">בחר טווח אותיות לסינון לפי שם פרטי.</p>
                                        <div class="gs-alphabet-filter-container">
                                            <div class="gs-alphabet-filter-item">
                                                <label for="gsAlphabetStart">החל מהאות</label>
                                                <select id="gsAlphabetStart" class="crm-input" data-filter-type="alphabet-start">
                                                    <option value="">הכל</option>
                                                    <?php foreach ($hebrew_alphabet as $letter): ?>
                                                        <option value="<?php echo $letter; ?>"><?php echo $letter; ?></option>
                                                    <?php endforeach; ?>
                                                </select>
                                            </div>
                                            <div class="gs-alphabet-filter-item">
                                                <label for="gsAlphabetEnd">עד האות</label>
                                                <select id="gsAlphabetEnd" class="crm-input" data-filter-type="alphabet-end">
                                                    <option value="">הכל</option>
                                                    <?php foreach ($hebrew_alphabet as $letter): ?>
                                                        <option value="<?php echo $letter; ?>"><?php echo $letter; ?></option>
                                                    <?php endforeach; ?>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="gs-filter-group">
                                    <button type="button" class="gs-filter-group-header" data-action="gs-toggle-filter-group">
                                        <span>תוויות</span>
                                        <span class="material-icons">expand_more</span>
                                    </button>
                                    <div class="gs-filter-group-content">
                                        <p class="gs-filter-group-description">סנן לפי תוויות המשויכות לאנשי הקשר.</p>
                                        <div class="gs-filter-search-wrapper">
                                            <input type="text" id="gsTagSearch" class="gs-filter-search" placeholder="חיפוש תגית...">
                                            <span class="material-icons">search</span>
                                        </div>
                                        <div id="gsTagsContainer" class="gs-filter-options-list"></div>
                                    </div>
                                </div>
                                
                                <div class="gs-filter-group">
                                    <button type="button" class="gs-filter-group-header" data-action="gs-toggle-filter-group">
                                        <span>מגדר</span>
                                        <span class="material-icons">expand_more</span>
                                    </button>
                                    <div class="gs-filter-group-content">
                                        <p class="gs-filter-group-description">הצג אנשי קשר מהמגדר הנבחר.</p>
                                        <div id="gsGenderContainer" class="gs-filter-options-list"></div>
                                    </div>
                                </div>

                                <div class="gs-filter-group">
                                    <button type="button" class="gs-filter-group-header" data-action="gs-toggle-filter-group">
                                        <span>מקור הגעה (ליד)</span>
                                        <span class="material-icons">expand_more</span>
                                    </button>
                                    <div class="gs-filter-group-content">
                                        <p class="gs-filter-group-description">הצג אנשי קשר לפי ערוץ ההגעה שלהם.</p>
                                        <div id="gsLeadSourceContainer" class="gs-filter-options-list"></div>
                                    </div>
                                </div>
                            </aside>

                            <main class="gs-filter-results">
                                <div id="gsSelectedFilters" class="gs-selected-filters-container">
                                    <span class="placeholder">המסננים הפעילים יוצגו כאן.</span>
                                </div>
                                <div class="gs-results-summary">
                                    <span class="material-icons">groups_2</span>
                                    <div class="summary-text">
                                        <span id="gsStep1Count">0</span>
                                        <span>אנשי קשר נבחרו</span>
                                    </div>
                                </div>
                            </main>
                        </div>
                        <div class="gs-step-footer">
                            <button class="btn-secondary" data-action="gs-reset-filters">אפס סינון</button>
                            <button class="btn-primary" data-action="gs-next-step" data-next-step="2">הבא</button>
                        </div>
                    </div>

                    <!-- Step 2: Contact Selection -->
                    <div class="gs-step-content" data-step-content="2">
                        <h3>שלב 2: בחירת נמענים</h3>
                        <div class="contact-selection-controls">
                            <input type="text" id="gsContactSearch" class="crm-input" placeholder="חיפוש לפי שם או טלפון...">
                            <button class="btn-secondary" data-action="gs-select-all-contacts">בחר הכל</button>
                            <button class="btn-secondary" data-action="gs-deselect-all-contacts">בטל בחירה</button>
                        </div>
                        <div id="gsContactsForSelection" class="contact-selection-list"></div>
                        <div class="gs-step-footer">
                            <strong id="gsStep2Count"></strong>
                            <div>
                                <button class="btn-secondary" data-action="gs-prev-step" data-prev-step="1">הקודם</button>
                                <button class="btn-primary" data-action="gs-next-step" data-next-step="3">הבא</button>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Composer & Send -->
                    <div class="gs-step-content" data-step-content="3">
                        <h3>שלב 3: תוכן ההודעה ושליחה</h3>
                        <div class="composer-container">
                            <div class="composer-area">
                                <h4>תוכן ההודעה</h4>
                                <div class="dynamic-tags-container" id="gsDynamicTagsContainer"></div>
                                <textarea id="gsMessageText" class="crm-input" rows="8" placeholder="כתוב את ההודעה שלך כאן..."></textarea>
                                <div class="file-upload-wrapper">
                                    <label for="gsFileInput" class="btn-secondary">
                                        <span class="material-icons">attach_file</span> צרף קובץ
                                    </label>
                                    <input type="file" id="gsFileInput" hidden>
                                    <span id="gsFileName" class="file-name-display"></span>
                                </div>
                            </div>
                            <div class="preview-area">
                                <h4>תצוגה מקדימה</h4>
                                <div class="preview-contact-selector">
                                    <label for="gsPreviewContact">הצג תצוגה מקדימה עבור:</label>
                                    <select id="gsPreviewContact" class="crm-input"></select>
                                </div>
                                <div class="whatsapp-preview">
                                    <div class="whatsapp-message-bubble">
                                        <p id="gsMessagePreview"></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="gs-step-footer final">
                             <button class="btn-secondary" data-action="gs-prev-step" data-prev-step="2">הקודם</button>
                             <button id="gsSendBtn" class="btn-primary" data-action="gs-send"><span class="material-icons">send</span> שלח הודעות</button>
                             <button id="gsStopBtn" class="btn-danger" data-action="gs-stop" style="display: none;"><span class="material-icons">stop_circle</span> עצור שליחה</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="recipientsModal" class="modal"><div class="modal-content large"><div class="modal-header"><h2 class="modal-title">רשימת נמענים</h2><button type="button" class="close" data-action="close-modal" title="סגור">&times;</button></div><div class="modal-body"></div><div class="modal-footer"><button type="button" class="btn-secondary" data-action="close-modal">סגור</button></div></div></div>
        <div id="accountModal" class="modal"><div class="modal-content"><div class="modal-header"><h2 class="modal-title">פרטי חשבון WhatsApp</h2><button type="button" class="close" data-action="close-modal" title="סגור">&times;</button></div><div class="modal-body" id="accountInfo"><div class="loading-spinner"></div></div><div class="modal-footer"><button type="button" class="btn-secondary" data-action="close-modal">סגור</button><button type="button" id="statusButton" class="status-button" data-action="toggle-connection"></button></div></div></div>
        <div id="qrModal" class="modal"><div class="modal-content"><div class="modal-header"><h2 class="modal-title">סרוק קוד QR</h2><button type="button" class="close" data-action="close-modal" title="סגור">&times;</button></div><div class="modal-body qr-container"><p id="qrStatusText" class="qr-status-text">טוען קוד...</p><img id="qrCode" src="" alt="QR Code" class="qr-image" style="display: block; margin: auto;"></div></div></div>
        <?php
    }

    public function inject_shortcodes_to_profile() {
        ?>
        <tr><th><label for="sc_group_send">אשף שליחה קבוצתית</label></th><td><input type="text" id="sc_group_send" class="regular-text" value="[my_crm_group_send]" readonly><button type="button" class="button" onclick="copyShortcode(this, 'sc_group_send')"><?php _e('העתק', 'm-h-whatsapp-addon'); ?></button></td></tr>
        <tr><th><label for="sc_account_details">פרטי חשבון</label></th><td><input type="text" id="sc_account_details" class="regular-text" value="[my_crm_account_details]" readonly><button type="button" class="button" onclick="copyShortcode(this, 'sc_account_details')"><?php _e('העתק', 'm-h-whatsapp-addon'); ?></button></td></tr>
        <tr><th><label for="sc_group_manager">ייבוא מקבוצות</label></th><td><input type="text" id="sc_group_manager" class="regular-text" value="[my_crm_group_manager]" readonly><button type="button" class="button" onclick="copyShortcode(this, 'sc_group_manager')"><?php _e('העתק', 'm-h-whatsapp-addon'); ?></button></td></tr>
        <tr><th><label for="sc_message_history">היסטוריית הודעות</label></th><td><input type="text" id="sc_message_history" class="regular-text" value="[my_crm_message_history]" readonly><button type="button" class="button" onclick="copyShortcode(this, 'sc_message_history')"><?php _e('העתק', 'm-h-whatsapp-addon'); ?></button></td></tr>
        <?php
    }

    private function get_login_message() {
        return '<p class="crm-login-prompt">' . __('You must be logged in to view this content.', 'm-h-whatsapp-addon') . '</p>';
    }
}