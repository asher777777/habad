<?php
/**
 * File: class-crm-shortcodes.php
 * Description: Handles all core CRM shortcodes and provides hooks for add-ons.
 * Version: 18.2.0
 * --- CHANGELOG V18.2.0 ---
 * - UI/UX: Added a "Check Read Status" button to the Timeline tab controls to allow on-demand fetching of message statuses.
 * --- CHANGELOG V18.1.0 ---
 * - UI/UX: Re-instated the 'Events' tab as a separate entity from the 'Timeline' tab for manual user logging.
 * - UI/UX: Upgraded the 'Timeline' tab to include a search input and prepare for a detailed interaction table.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class CRM_Shortcodes
{

    public function init()
    {
        add_shortcode('my_crm_app', [$this, 'render_crm_app_shortcode']);
        new CRM_User_Settings();
    }

    public function render_crm_app_shortcode()
    {
        if (!is_user_logged_in()) {
            return $this->get_login_message();
        }
        $this->enqueue_initializer_script();
        $this->render_core_modals();
        ob_start();
        ?>
        <div id="crm-app-wrapper" class="crm-app-wrapper">
            <main class="app-main">
                <header class="crm-branding-header">
                    <div class="brand-logo">
                        <img src="" alt="כנפיים Logo" id="crm-logo-img" style="display:none;">
                        <span class="material-icons brand-icon">flutter_dash</span>
                    </div>
                    <div class="brand-title">
                        <h1>כנפיים</h1>
                        <p>CRM לניהול חכם</p>
                    </div>
                    <div class="header-actions">
                        <?php do_action('mh_crm_header_actions'); ?>
                    </div>
                </header>

                <div class="controls">
                    <div class="control-group main-actions">
                        <button data-action="add-contact" class="btn-primary"><span
                                class="material-icons">person_add</span><span>הוסף איש קשר</span></button>
                        <?php do_action('mh_crm_main_actions'); ?>
                    </div>
                    <div class="control-group secondary-actions">
                        <button data-action="trigger-excel-upload"><span class="material-icons">upload_file</span><span>ייבוא
                                מאקסל</span></button>
                        <button data-action="download-excel"><span class="material-icons">download</span><span>ייצוא
                                לאקסל</span></button>
                        <button data-action="refresh-contacts"><span class="material-icons">sync</span><span>טען
                                מחדש</span></button>
                        <button data-action="sync-whatsapp-messages" class="btn-whatsapp-sync"><span class="material-icons">whatsapp</span><span>סנכרן וואטסאפ</span></button>
                    </div>
                </div>
                <div class="content-area">
                    <div class="view-tabs">
                        <button class="view-tab active" data-action="view-contacts" data-status="active"
                            data-view-id="contacts-view">
                            <span class="material-icons">people</span>
                            <span>פעילים</span>
                            <span class="tab-counter" id="active-counter">0</span>
                        </button>
                        <button class="view-tab" data-action="view-contacts" data-status="trashed" data-view-id="contacts-view">
                            <span class="material-icons">delete_sweep</span>
                            <span>סל אשפה</span>
                            <span class="tab-counter" id="trash-counter">0</span>
                        </button>
                        <?php do_action('mh_crm_view_tabs'); ?>
                    </div>

                    <div id="contacts-view" class="view-container">
                        <div class="table-controls">
                            <div class="search-container">
                                <span class="material-icons">search</span>
                                <input type="text" id="searchInput" placeholder="חפש בכל השדות...">
                            </div>
                            <div class="filters-container">
                                <select id="filterTag" class="crm-select-filter"><option value="">כל התוויות</option></select>
                                <select id="filterCity" class="crm-select-filter"><option value="">כל הערים</option></select>
                                <select id="filterSource" class="crm-select-filter"><option value="">כל המקורות</option></select>
                            </div>
                            <div class="bulk-actions-container">
                                <select id="bulkActionSelect">
                                    <option value="">פעולות על נבחרים...</option>
                                    <option value="trash">העבר לאשפה</option>
                                    <option value="delete-permanent">מחק לצמיתות</option>
                                    <option value="restore">שחזר</option>
                                    <option value="message">שלח הודעה</option>
                                </select>
                                <button data-action="execute-bulk-action" class="btn-secondary">ביצוע</button>
                            </div>
                        </div>
                        <div id="paginationContainer" class="pagination" style="display: none;"><button id="prevPage"
                                data-action="go-to-prev-page">הקודם</button><span id="pageNumbers"></span><button id="nextPage"
                                data-action="go-to-next-page">הבא</button></div>
                        <div class="table-container">
                            <table id="contactsTable">
                                <thead></thead>
                                <tbody id="tableBody">
                                    <tr>
                                        <td colspan="8" class="empty-table-message"><span
                                                class="material-icons empty-icon">group</span>
                                            <h3>טוען אנשי קשר...</h3>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <?php do_action('mh_crm_view_containers'); ?>

                </div>
            </main>
        </div>
        <?php
        return ob_get_clean();
    }

    private function enqueue_initializer_script()
    {
        add_action('wp_footer', function () {
            static $script_printed = false;
            if ($script_printed)
                return;
            $script_printed = true;
            echo "<script>document.addEventListener('DOMContentLoaded', () => { if (window.CRM_APP) { window.CRM_APP.init(); } });</script>";
        }, 99);
    }

    private function render_core_modals()
    {
        static $modals_rendered = false;
        if ($modals_rendered)
            return;
        $modals_rendered = true;
        add_action('wp_footer', function () {
            ?>
            <div id="addContactModal" class="modal">
                <div class="modal-content">
                    <form id="addContactForm">
                        <div class="modal-header">
                            <h2 class="modal-title">הוספת איש קשר חדש</h2><button type="button" class="close"
                                data-action="close-modal" title="סגור">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-grid">
                                <div class="form-group"><label for="add_conta_name">שם פרטי</label><input type="text"
                                        id="add_conta_name" name="conta_name" required></div>
                                <div class="form-group"><label for="add_f_m">שם משפחה</label><input type="text" id="add_f_m"
                                        name="f_m"></div>
                            </div>
                            <div class="form-group"><label for="add_conta_phone">טלפון</label><input type="tel" id="add_conta_phone"
                                    name="conta_phone" required></div>
                            <div class="form-group"><label for="add_email">דוא"ל</label><input type="email" id="add_email"
                                    name="email"></div>
                        </div>
                        <div class="modal-footer"><button type="button" class="btn-secondary"
                                data-action="close-modal">ביטול</button><button type="button" class="btn-primary"
                                data-action="submit-add-contact-form"><span class="material-icons">save</span> הוסף איש קשר</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="editContactModal" class="modal">
                <div class="modal-content large">
                    <form id="editContactForm">
                        <input type="hidden" id="editContactId" name="contact_id">
                        <div class="modal-header">
                            <h2 class="modal-title">עריכת איש קשר: <span id="editContactName"></span></h2>
                            <button type="button" class="close" data-action="close-modal" title="סגור">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="edit-modal-tabs">
                                <button type="button" class="tab-link active" data-action="view-tab" data-tab="tab-details">פרטים
                                    כלליים</button>
                                <button type="button" class="tab-link" data-action="view-tab" data-tab="tab-tags">תיוגים
                                    והערות</button>
                                <button type="button" class="tab-link" data-action="view-tab" data-tab="tab-company">חברה</button>
                                <button type="button" class="tab-link" data-action="view-tab" data-tab="tab-events">אירועים</button>
                                <button type="button" class="tab-link" data-action="view-tab" data-tab="tab-timeline">ציר
                                    זמן</button>
                                <button type="button" class="tab-link" data-action="view-tab" data-tab="tab-payments">היסטוריית
                                    תשלומים</button>
                            </div>
                            <div class="tab-content-wrapper">
                                <div id="tab-details" class="tab-content active">
                                    <h4>מידע בסיסי</h4>
                                    <div class="form-grid">
                                        <div class="form-group"><label for="edit_conta_name">שם פרטי</label><input type="text"
                                                id="edit_conta_name" name="conta_name"></div>
                                        <div class="form-group"><label for="edit_f_m">שם משפחה</label><input type="text"
                                                id="edit_f_m" name="f_m"></div>
                                        <div class="form-group"><label for="edit_gender">מגדר</label><select id="edit_gender"
                                                name="gender">
                                                <option value="">בחר...</option>
                                                <option value="זכר">זכר</option>
                                                <option value="נקבה">נקבה</option>
                                                <option value="אחר">אחר</option>
                                            </select></div>
                                        <div class="form-group"><label for="edit_birth_date">תאריך לידה</label><input type="date"
                                                id="edit_birth_date" name="birth_date"></div>
                                    </div>
                                    <h4>פרטי יצירת קשר</h4>
                                    <div class="form-grid">
                                        <div class="form-group"><label for="edit_email">דוא"ל</label><input type="email"
                                                id="edit_email" name="email"></div>
                                        <div class="form-group"><label for="edit_conta_phone">טלפון נייד</label><input type="tel"
                                                id="edit_conta_phone" name="conta_phone"></div>
                                        <div class="form-group"><label for="edit_work_phone">טלפון עבודה</label><input type="tel"
                                                id="edit_work_phone" name="work_phone"></div>
                                        <div class="form-group"><label for="edit_website">אתר</label><input type="url"
                                                id="edit_website" name="website"></div>
                                    </div>
                                    <h4>כתובת</h4>
                                    <div class="form-grid">
                                        <div class="form-group"><label for="edit_city">עיר</label><input type="text" id="edit_city"
                                                name="city"></div>
                                        <div class="form-group"><label for="edit_street">רחוב</label><input type="text"
                                                id="edit_street" name="street"></div>
                                    </div>
                                </div>
                                <div id="tab-tags" class="tab-content">
                                    <h4>תגים</h4>
                                    <div class="form-grid">
                                        <div class="form-group"><label for="edit_tg1">תג 1</label><input type="text" id="edit_tg1"
                                                name="tg1"></div>
                                        <div class="form-group"><label for="edit_tg2">תג 2</label><input type="text" id="edit_tg2"
                                                name="tg2"></div>
                                        <div class="form-group"><label for="edit_tg3">תג 3</label><input type="text" id="edit_tg3"
                                                name="tg3"></div>
                                    </div>
                                    <h4>הערות</h4>
                                    <div class="form-group"><label for="edit_notes">הערות</label><textarea id="edit_notes"
                                            name="notes" rows="8"></textarea></div>
                                </div>
                                <div id="tab-company" class="tab-content">
                                    <h4>מידע על החברה</h4>
                                    <div class="form-grid">
                                        <div class="form-group"><label for="edit_company_name">שם חברה</label><input type="text"
                                                id="edit_company_name" name="company_name"></div>
                                        <div class="form-group"><label for="edit_job_title">תפקיד</label><input type="text"
                                                id="edit_job_title" name="job_title"></div>
                                        <div class="form-group"><label for="edit_last_form_name">שם טופס אחרון</label><input
                                                type="text" id="edit_last_form_name" name="last_form_name"></div>
                                        <div class="form-group">
                                            <label for="edit_lead_source">מקור הליד</label>
                                            <input type="text" id="edit_lead_source" name="lead_source" list="lead_source_list"
                                                placeholder="הקלד או בחר...">
                                            <datalist id="lead_source_list">
                                                <option value="טופס מהאתר">
                                                <option value="פייסבוק">
                                                <option value="גוגל">
                                                <option value="המלצה">
                                                <option value="כנס">
                                                <option value="אחר">
                                            </datalist>
                                        </div>
                                    </div>
                                </div>
                                <div id="tab-events" class="tab-content">
                                    <h4>היסטוריית אירועים ופגישות</h4>
                                    <div id="events-repeater-container"></div>
                                    <button type="button" class="button button-secondary" data-action="add-event-row"><span
                                            class="material-icons">add</span>הוסף אירוע חדש</button>
                                </div>
                                <div id="tab-timeline" class="tab-content">
                                    <h4>ציר זמן אינטראקציות</h4>
                                    <div class="timeline-controls">
                                        <input type="text" id="timelineSearchInput" class="crm-input"
                                            placeholder="חפש בציר הזמן...">
                                        <button type="button" class="btn-secondary" data-action="check-timeline-statuses"><span
                                                class="material-icons">published_with_changes</span> בדוק סטטוס קריאה</button>
                                    </div>
                                    <div id="contact-timeline-container">
                                        <!-- Timeline table will be rendered here by JavaScript -->
                                    </div>
                                </div>
                                <div id="tab-payments" class="tab-content">
                                    <h4>הזמנות ותשלומים</h4>
                                    <div id="contact-payment-history-container"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" data-action="close-modal">ביטול</button>
                            <button type="button" class="btn-primary" data-action="submit-edit-contact-form"><span
                                    class="material-icons">save</span> שמירת שינויים</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="sendMessageModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">שלח הודעת WhatsApp</h2><button type="button" class="close" data-action="close-modal"
                            title="סגור">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>אתה שולח הודעה אל <strong id="sendMessageRecipientCount">0</strong> נמענים.</p>
                        <div id="sendMessageRecipientList" class="recipient-list"></div>
                        <div class="form-group"><label for="sendMessageText">תוכן ההודעה</label><textarea id="sendMessageText"
                                class="crm-input" rows="6" placeholder="הקלד את הודעתך כאן..."></textarea></div>
                        <div class="file-upload-wrapper"><label for="sendMessageFileInput" class="btn-secondary"><span
                                    class="material-icons">attach_file</span> צרף קובץ</label><input type="file"
                                id="sendMessageFileInput" hidden><span id="sendMessageFileName" class="file-name-display"></span>
                        </div>
                    </div>
                    <div class="modal-footer"><button type="button" class="btn-secondary"
                            data-action="close-modal">ביטול</button><button type="button" class="btn-primary"
                            data-action="send-from-modal" id="sendFromModalBtn"><span class="material-icons">send</span>
                            שלח</button></div>
                </div>
            </div>
            <div id="orderDetailModal" class="modal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2 class="modal-title">פרטי הזמנה <span id="order-detail-id"></span></h2><button type="button"
                            class="close" data-action="close-modal" title="סגור">&times;</button>
                    </div>
                    <div class="modal-body" id="order-detail-body"></div>
                    <div class="modal-footer"><button type="button" class="btn-secondary" data-action="close-modal">סגור</button>
                    </div>
                </div>
            </div>
            <div id="confirmationModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">אישור פעולה</h2><button type="button" class="close" data-action="close-modal"
                            title="סגור">&times;</button>
                    </div>
                    <div class="modal-body" id="confirmationMessageText">האם אתה בטוח שברצונך להמשיך?</div>
                    <div class="modal-footer"><button type="button" class="btn-secondary"
                            data-action="close-modal">ביטול</button><button type="button" class="btn-primary"
                            data-action="confirm-action" id="confirmActionButton">אישור</button></div>
                </div>
            </div>
            <input type="file" id="excelFileInput" accept=".xlsx, .xls, .csv" style="display: none;">
            <div id="notificationContainer"></div>
            <div id="loadingOverlay" class="loading-overlay" style="display: none;">
                <div class="loading-spinner"></div>
            </div>
            <div id="progressOverlay" class="loading-overlay" style="display: none;">
                <div class="progress-container">
                    <div class="progress-bar-wrapper">
                        <div id="progressBar" class="progress-bar"></div>
                    </div>
                    <div id="progressText" class="progress-text"></div>
                </div>
            </div>
            <?php do_action('mh_crm_footer_modals'); ?>
        <?php
        });
    }

    private function get_login_message()
    {
        ob_start();
        ?>
        <div class="crm-login-wrapper">
            <div class="login-card">
                <div class="login-header">
                    <div class="login-brand">
                        <span class="material-icons brand-icon">flutter_dash</span>
                        <h1>כנפיים</h1>
                    </div>
                    <h2>ברוכים הבאים</h2>
                    <p>אנא התחבר כדי לגשת למערכת ה-CRM</p>
                </div>
                <div class="login-form-container">
                    <?php 
                    wp_login_form([
                        'echo'           => true,
                        'redirect'       => (is_ssl() ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'],
                        'form_id'        => 'crmLoginForm',
                        'label_username' => __('שם משתמש', 'm-h-crm'),
                        'label_password' => __('סיסמה', 'm-h-crm'),
                        'label_remember' => __('זכור אותי', 'm-h-crm'),
                        'label_log_in'   => __('כניסה למערכת', 'm-h-crm'),
                        'remember'       => true,
                        'value_remember' => true,
                    ]); 
                    ?>
                </div>
                <div class="login-footer">
                    <a href="<?php echo wp_lostpassword_url(); ?>"><?php _e('שכחת סיסמה?', 'm-h-crm'); ?></a>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

class CRM_User_Settings
{
    public function __construct()
    {
        add_action('show_user_profile', [$this, 'render_user_profile_fields']);
        add_action('edit_user_profile', [$this, 'render_user_profile_fields']);
        add_action('personal_options_update', [$this, 'save_user_profile_fields']);
        add_action('edit_user_profile_update', [$this, 'save_user_profile_fields']);
    }

    public function render_user_profile_fields($user)
    {
        ?>
        <hr>
        <h3><?php _e('הגדרות Green API', 'm-h-crm'); ?></h3>
        <table class="form-table">
            <tr>
                <th><label for="crm_green_id_instance">ID Instance</label></th>
                <td><input type="text" name="crm_green_id_instance" id="crm_green_id_instance"
                        value="<?php echo esc_attr(get_user_meta($user->ID, 'crm_green_id_instance', true)); ?>"
                        class="regular-text" /></td>
            </tr>
            <tr>
                <th><label for="crm_green_api_token">API Token</label></th>
                <td><input type="password" name="crm_green_api_token" id="crm_green_api_token"
                        value="<?php echo esc_attr(get_user_meta($user->ID, 'crm_green_api_token', true)); ?>"
                        class="regular-text" /></td>
            </tr>
        </table>
        <hr>
        <h3><?php _e('שורטקודים זמינים', 'm-h-crm'); ?></h3>
        <table class="form-table">
            <tbody>
                <tr>
                    <th><label for="sc_crm_app">מערכת CRM ראשית</label></th>
                    <td><input type="text" id="sc_crm_app" class="regular-text" value="[my_crm_app]" readonly><button
                            type="button" class="button"
                            onclick="this.previousElementSibling.select(); document.execCommand('copy');"><?php _e('העתק', 'm-h-crm'); ?></button>
                    </td>
                </tr>
                <?php do_action('mh_crm_user_profile_shortcodes'); ?>
            </tbody>
        </table>
        <?php
    }

    public function save_user_profile_fields($user_id)
    {
        if (!current_user_can('edit_user', $user_id))
            return;
        if (isset($_POST['crm_green_id_instance']))
            update_user_meta($user_id, 'crm_green_id_instance', sanitize_text_field($_POST['crm_green_id_instance']));
        if (isset($_POST['crm_green_api_token']))
            update_user_meta($user_id, 'crm_green_api_token', sanitize_text_field($_POST['crm_green_api_token']));
    }
}