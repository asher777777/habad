<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Core class for the M.H WooCommerce Payments Add-on.
 * Version: 3.8.2
 * --- FULL OPTIMIZED & COMPLETE VERSION ---
 * - ADD: WooCommerce Product Sync (Name, Price, Image) with UI highlight.
 * - ADD: Payment Amount CRM Mapping (Map to tg1, tg2, notes etc.).
 * - ADD: Button Customizer (BG & Text Colors).
 * - KEEP: ALL Form Builder JS logic (Conditional logic, dynamic fields, placeholders).
 * - KEEP: URL Params, Modal handling, and WhatsApp automation.
 * - FIXED: Intelligent Checkout field population with robust Last Name handling.
 */
class MH_WC_Payments_Core {

    private $url_params_handler;
    private $standard_form_handler;
    private $product_sync_handler;

    public function __construct() {
        $this->url_params_handler = new MH_WC_URL_Params();
        
        // Ensure the handler classes are available.
        if ( ! class_exists('MH_WC_Standard_Form_Handler') ) {
            require_once MH_WC_PAYMENTS_DIR . 'includes/class-mh-wc-standard-form-handler.php';
        }
        if ( ! class_exists('MH_WC_Product_Sync') ) {
            require_once MH_WC_PAYMENTS_DIR . 'includes/class-mh-wc-product-sync.php';
        }

        $this->standard_form_handler = new MH_WC_Standard_Form_Handler();
        $this->product_sync_handler  = new MH_WC_Product_Sync();

        add_action( 'init', [ $this, 'register_payment_form_post_type' ] );
        add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );
        add_action( 'save_post_mh_payment_form', [ $this, 'save_meta_data' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_scripts' ] );
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_scripts' ] );
        add_action( 'wp_ajax_mh_handle_wc_form', [ $this, 'handle_form_submission' ] );
        add_action( 'wp_ajax_nopriv_mh_handle_wc_form', [ $this, 'handle_form_submission' ] );
        add_shortcode( 'mh_wc_payment_form', [ $this, 'render_shortcode' ] );
        
        add_action( 'woocommerce_checkout_create_order_line_item', [ $this, 'save_form_data_to_order_item' ], 20, 4 );
        add_action( 'woocommerce_order_status_changed', [ $this, 'handle_payment_status_change' ], 10, 4 );

        add_filter( 'manage_mh_payment_form_posts_columns', [ $this, 'add_shortcode_column_to_list' ] );
        add_action( 'manage_mh_payment_form_posts_custom_column', [ $this, 'display_shortcode_in_column' ], 10, 2 );

        add_filter( 'woocommerce_checkout_get_value', [ $this, 'populate_checkout_fields_from_session' ], 10, 2 );
        add_action( 'woocommerce_checkout_order_processed', [ $this, 'clear_form_session_data' ] );

        // ** STYLING HOOKS **
        add_filter( 'woocommerce_cart_item_name', [ $this, 'custom_checkout_product_display' ], 10, 3 );
        add_filter( 'woocommerce_get_privacy_policy_text', [ $this, 'custom_privacy_policy_text' ] );
        add_filter( 'woocommerce_order_button_text', [ $this, 'custom_order_button_text' ] );
        add_action( 'wp_head', [ $this, 'custom_checkout_styles' ] );
    }
    
    // --- STYLING & DISPLAY LOGIC (FOR CHECKOUT) ---

    public function custom_order_button_text( $button_text ) {
        if ( WC()->session && WC()->session->get('mh_wc_form_id') ) {
            return 'מעבר לתשלום מאובטח';
        }
        return $button_text;
    }

    public function custom_checkout_product_display( $name, $cart_item, $cart_item_key ) {
        if ( ! is_checkout() ) return $name;
        $form_id = $cart_item['mh_form_id'] ?? (WC()->session ? WC()->session->get('mh_wc_form_id') : 0);
        
        if ( $form_id ) {
            $product_info = $this->product_sync_handler->get_effective_product_data( $form_id );
            $image_id = $product_info['image_id'];
            $display_name = !empty($product_info['name']) ? $product_info['name'] : $name;
            
            if ( $image_id ) {
                $image = wp_get_attachment_image( $image_id, 'medium', false, [
                    'style' => 'max-width: 150px; height: auto; border-radius: 8px; display: block; margin: 0 auto 10px auto;'
                ] );
                return '<div style="text-align: center;">' . $image . '<div style="font-weight:600; font-size: 1.1em; color: #333;">' . esc_html($display_name) . '</div></div>';
            }
        }
        return $name;
    }

    public function custom_privacy_policy_text( $text ) {
        if ( is_checkout() && WC()->session && WC()->session->get('mh_wc_form_id') ) {
            return 'הנתונים האישיים שלך ישמשו לביצוע ההזמנה ולמטרות המפורטות ב<a href="#" class="woocommerce-privacy-policy-link" target="_blank">מדיניות הפרטיות</a> שלנו.';
        }
        return $text;
    }

    public function custom_checkout_styles() {
        if ( is_checkout() && ! is_wc_endpoint_url( 'order-received' ) && WC()->session && WC()->session->get('mh_wc_form_id') ) {
            ?>
            <style>
                .mailpoet_woocommerce_checkout_checkbox, .newsletter-signup, p.form-row.mailchimp-newsletter, #mc4wp-checkbox { display: none !important; }
                .woocommerce-checkout-review-order-table { border: none !important; background: transparent; margin-bottom: 25px; }
                .woocommerce-checkout-review-order-table thead, .woocommerce-checkout-review-order-table td.product-total { display: none; }
                .woocommerce-checkout-review-order-table td.product-name { text-align: center; border: none; padding-bottom: 20px; }
                #payment { background: #fff !important; border-radius: 12px; border: 1px solid #eee; padding: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
                #place_order { width: 100%; padding: 15px; font-size: 1.2em; border-radius: 8px; margin-top: 20px; }
            </style>
            <?php
        }
    }

    // --- HELPER METHODS ---

    private function _normalize_phone_for_db($phone) {
        $clean_phone = preg_replace('/\D/', '', $phone);
        if (strpos($clean_phone, '972') === 0 && strlen($clean_phone) > 9) { return '0' . substr($clean_phone, 3); }
        if (strpos($clean_phone, '0') !== 0 && strlen($clean_phone) === 9) { return '0' . $clean_phone; }
        return $clean_phone;
    }

    private function _parse_form_data_array($form_data_array) {
        $submitted_data = [];
        if (is_array($form_data_array)) {
            foreach ($form_data_array as $field) {
                if (isset($field['name']) && isset($field['value'])) {
                    $submitted_data[$field['name']] = $field['value'];
                }
            }
        }
        return $submitted_data;
    }

    // --- ADMIN UI ---

    public function register_payment_form_post_type() {
        register_post_type( 'mh_payment_form', [
            'labels' => ['name' => 'Payment Forms', 'singular_name' => 'Payment Form'],
            'public' => false, 'show_ui' => true, 'show_in_menu' => true,
            'menu_position' => 26, 'menu_icon' => 'dashicons-cart', 'supports' => [ 'title' ],
        ]);
    }

    public function add_meta_boxes() {
        add_meta_box('mh_wc_form_builder', 'Form Builder & Advanced Settings', [ $this, 'render_meta_box' ], 'mh_payment_form', 'normal', 'high');
        add_meta_box('mh_wc_form_shortcode', 'Shortcode', [ $this, 'render_shortcode_metabox' ], 'mh_payment_form', 'side', 'default');
    }

    public function render_meta_box( $post ) {
        wp_nonce_field( 'mh_wc_save_meta_data', 'mh_wc_nonce' );
        
        $form_fields = get_post_meta( $post->ID, '_mh_form_fields', true ) ?: [];
        $save_to_crm = get_post_meta( $post->ID, '_mh_save_to_crm', true );
        $crm_owner_id = get_post_meta( $post->ID, '_mh_crm_owner_id', true ) ?: 1;
        $form_type = get_post_meta( $post->ID, '_mh_form_type', true ) ?: 'payment';
        $submit_button_text = get_post_meta( $post->ID, '_mh_submit_button_text', true );
        $submit_button_bg_color = get_post_meta( $post->ID, '_mh_submit_button_bg_color', true ) ?: '#25D366';
        $submit_button_text_color = get_post_meta( $post->ID, '_mh_submit_button_text_color', true ) ?: '#ffffff';
        
        $wc_product_name = get_post_meta( $post->ID, '_mh_wc_product_name', true );
        $wc_checkout_description = get_post_meta( $post->ID, '_mh_wc_checkout_description', true );
        $wc_product_image_id = get_post_meta( $post->ID, '_mh_wc_product_image_id', true );
        $wc_amount_crm_map = get_post_meta( $post->ID, '_mh_wc_amount_crm_map', true );
        
        $wc_pending_message = get_post_meta( $post->ID, '_mh_wc_pending_message', true );
        $wc_pending_image_id = get_post_meta( $post->ID, '_mh_wc_pending_image_id', true );
        $wc_success_message = get_post_meta( $post->ID, '_mh_wc_success_message', true );
        $wc_success_image_id = get_post_meta( $post->ID, '_mh_wc_success_image_id', true );
        $standard_success_message = get_post_meta( $post->ID, '_mh_standard_success_message', true );
        $standard_redirect_url = get_post_meta( $post->ID, '_mh_standard_redirect_url', true );
        $standard_whatsapp_message = get_post_meta( $post->ID, '_mh_standard_whatsapp_message', true );
        $standard_whatsapp_image_id = get_post_meta( $post->ID, '_mh_standard_whatsapp_image_id', true );

        $crm_db_fields = [
            '' => '-- ללא מיפוי --',
            'conta_name' => 'שם', 'f_m' => 'שם משפחה', 'gender' => 'מגדר', 'birth_date' => 'תאריך לידה',
            'email' => 'דוא"ל ראשי', 'conta_phone' => 'טלפון נייד', 'work_phone' => 'טלפון (עבודה)', 'website' => 'אתר אינטרנט',
            'mh_crm_city' => 'עיר', 'mh_crm_street' => 'רחוב',
            'company_name' => 'שם החברה', 'job_title' => 'תפקיד', 'lead_source' => 'מקור הליד', 'notes' => 'הערות',
            'tg1' => 'תג 1 (סטטוס)', 'tg2' => 'תג 2', 'tg3' => 'תג 3', 'payment_amount' => 'סכום לתשלום (WooCommerce)'
        ];
        ?>
        <style>
            .mh-form-builder-container { padding: 10px; }
            .mh-form-section { border: 1px solid #ccd0d4; padding: 20px; margin-bottom: 25px; border-radius: 6px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            #mh-fields-wrapper .mh-field-row { background: #f9f9f9; border: 1px solid #e1e1e1; padding: 15px; border-radius: 6px; margin-bottom: 15px; position: relative; }
            .mh-field-col-main { display: grid; grid-template-columns: 2fr 1.2fr 1.2fr auto; gap: 10px; align-items: center; }
            .mh-field-col-options { border-top: 1px dashed #ccc; margin-top: 15px; padding-top: 15px; display: block; }
            .mh-highlight-section { background: #fffdf2; border: 1px solid #f2e7b5; border-right: 5px solid #f1c40f; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
            .mh-placeholders-list { background: #f0f6fc; border: 1px dashed #a5c8e8; padding: 10px; border-radius: 4px; margin-top: 15px; }
            .placeholder-btn { cursor: pointer; background: #e1ecf7; padding: 3px 8px; border-radius: 4px; margin: 2px; display: inline-block; border: 1px solid #c3d9ec; font-family: monospace; font-size: 12px; }
            .mh-image-preview { max-width: 120px; height: auto; border: 1px solid #ddd; padding: 5px; margin: 10px 0; display: none; }
            .mh-color-picker-row { display: flex; gap: 30px; align-items: center; margin-top: 10px; background: #f0f0f0; padding: 15px; border-radius: 6px; }
            .mh-color-picker-row input[type="color"] { width: 60px; height: 35px; border: 1px solid #ddd; cursor: pointer; }
            .mh-settings-section[data-type] { display: none; }
            .mh-remove-field-btn { color: #d63638; text-decoration: none; font-weight: bold; }
        </style>

        <div class="mh-form-builder-container">

            <!-- General Settings -->
            <div class="mh-form-section">
                <h3>הגדרות כלליות</h3>
                 <p>
                    <label><strong>סוג הטופס:</strong></label><br>
                    <select id="mh_form_type_select" name="mh_form_type" style="min-width: 250px;">
                        <option value="payment" <?php selected($form_type, 'payment'); ?>>טופס תשלום (WooCommerce)</option>
                        <option value="standard" <?php selected($form_type, 'standard'); ?>>טופס רגיל (לידים)</option>
                    </select>
                </p>
                <p>
                    <label><strong>טקסט כפתור שליחה:</strong></label><br>
                    <input type="text" name="mh_submit_button_text" value="<?php echo esc_attr($submit_button_text); ?>" class="regular-text" placeholder="למשל: המשך לתשלום / שלח הודעה" />
                </p>
                
                <div class="mh-color-picker-row">
                    <div>
                        <label>צבע רקע לכפתור:</label><br>
                        <input type="color" name="mh_submit_button_bg_color" value="<?php echo esc_attr($submit_button_bg_color); ?>">
                    </div>
                    <div>
                        <label>צבע טקסט לכפתור:</label><br>
                        <input type="color" name="mh_submit_button_text_color" value="<?php echo esc_attr($submit_button_text_color); ?>">
                    </div>
                </div>
            </div>

            <!-- Field Builder -->
            <div class="mh-form-section">
                <h3>שדות הטופס</h3>
                <div id="mh-fields-wrapper">
                    <?php 
                    if (is_array($form_fields)) { 
                        foreach ( $form_fields as $index => $field ) { 
                            if ( !is_array($field) ) continue;
                            $this->render_field_row($index, $field, $crm_db_fields, $form_fields); 
                        } 
                    } 
                    ?>
                </div>
                <button type="button" id="mh-add-field-btn" class="button button-primary">הוסף שדה חדש +</button>
            </div>
            
            <!-- Payment Settings -->
            <div class="mh-settings-section" data-type="payment">
                <div class="mh-form-section">
                    <h3>הגדרות תשלום (WooCommerce)</h3>
                    
                    <div class="mh-highlight-section">
                        <?php $this->product_sync_handler->render_product_picker( $post->ID ); ?>
                    </div>
                    
                    <p><label><strong>שם המוצר לחיוב (ידני):</strong><br><input type="text" name="mh_wc_product_name" value="<?php echo esc_attr($wc_product_name); ?>" class="regular-text" /></label></p>
                    <p>
                        <label><strong>תיאור קצר (יוצג בדף התשלום):</strong></label><br>
                        <textarea name="mh_wc_checkout_description" rows="3" style="width: 100%;"><?php echo esc_textarea($wc_checkout_description); ?></textarea>
                    </p>
                    <p>
                        <label><strong>תמונת מוצר ידנית:</strong></label><br>
                        <?php $this->render_image_uploader('mh_wc_product_image_id', $wc_product_image_id); ?>
                    </p>
                    <hr>
                    <p>
                        <label><strong>שמור את סכום התשלום בשדה CRM:</strong></label><br>
                        <select name="mh_wc_amount_crm_map" style="min-width: 250px;">
                            <?php foreach($crm_db_fields as $key => $label): if($key === 'payment_amount') continue; ?>
                                <option value="<?php echo esc_attr($key); ?>" <?php selected( $wc_amount_crm_map, $key ); ?>><?php echo esc_html($label); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <br><small>הסכום יישלח לשדה זה ב-CRM (תג 2, הערות וכו') ברגע יצירת ההזמנה.</small>
                    </p>
                </div>
            </div>

             <div class="mh-settings-section" data-type="standard">
                <div class="mh-form-section">
                    <h3>הגדרות טופס רגיל</h3>
                    <p><label><strong>הודעת הצלחה לאחר שליחה:</strong><br><textarea name="mh_standard_success_message" rows="3" style="width: 100%;"><?php echo esc_textarea($standard_success_message); ?></textarea></label></p>
                    <p><label><strong>העברה לכתובת URL לאחר שליחה (אופציונלי):</strong><br><input type="url" name="mh_standard_redirect_url" value="<?php echo esc_attr($standard_redirect_url); ?>" class="regular-text" placeholder="https://example.com/thanks" /></label></p>
                </div>
            </div>

            <!-- CRM Integration -->
            <div class="mh-form-section">
                <h3>הגדרות CRM</h3>
                <p><label><input type="checkbox" name="mh_save_to_crm" value="1" <?php checked( $save_to_crm, '1' ); ?> /> <strong>שמור/עדכן איש קשר ב-CRM של M.H</strong></label></p>
                 <p>
                    <label><strong>שייך איש קשר למשתמש:</strong></label><br>
                    <select name="mh_crm_owner_id" style="min-width: 250px;">
                        <?php
                        $users = get_users(['role__in' => ['administrator', 'editor', 'author']]);
                        foreach ($users as $user) {
                            echo '<option value="' . esc_attr($user->ID) . '" ' . selected($crm_owner_id, $user->ID, false) . '>' . esc_html($user->display_name) . '</option>';
                        }
                        ?>
                    </select>
                </p>
            </div>

            <?php $this->url_params_handler->render_meta_box_section( $post ); ?>
            
            <!-- WhatsApp Notifications -->
            <div class="mh-form-section">
                <h3>הודעות WhatsApp אוטומטיות</h3>
                <div class="mh-settings-section" data-type="payment" style="display: block;">
                    <p><strong>שלח בעת יצירת הזמנה (ממתין לתשלום):</strong></p>
                    <textarea name="mh_wc_pending_message" class="mh-message-textarea" rows="4" style="width: 100%;"><?php echo esc_textarea($wc_pending_message); ?></textarea>
                    <?php $this->render_image_uploader('mh_wc_pending_image_id', $wc_pending_image_id); ?>
                    <hr>
                    <p><strong>שלח לאחר תשלום מוצלח:</strong></p>
                    <textarea name="mh_wc_success_message" class="mh-message-textarea" rows="4" style="width: 100%;"><?php echo esc_textarea($wc_success_message); ?></textarea>
                    <?php $this->render_image_uploader('mh_wc_success_image_id', $wc_success_image_id); ?>
                </div>
                <div class="mh-settings-section" data-type="standard">
                    <p><strong>שלח לאחר שליחת טופס לידים:</strong></p>
                    <textarea name="mh_standard_whatsapp_message" class="mh-message-textarea" rows="4" style="width: 100%;"><?php echo esc_textarea($standard_whatsapp_message); ?></textarea>
                    <?php $this->render_image_uploader('mh_standard_whatsapp_image_id', $standard_whatsapp_image_id); ?>
                </div>

                <div class="mh-placeholders-list">
                    <strong>פלייסהולדרים:</strong> <span class="mh-placeholders-output"></span>
                    <button type="button" class="placeholder-btn" data-placeholder="{link_kabala}">{link_kabala}</button>
                </div>
            </div>
        </div>

        <script>
             jQuery(document).ready(function($) {
                const wrapper = $('#mh-fields-wrapper');
                const crmFields = <?php echo json_encode($crm_db_fields); ?>;
                
                // --- FORM UI LOGIC ---

                function toggleFormTypeSections() {
                    const selectedType = $('#mh_form_type_select').val();
                    $('.mh-settings-section').hide();
                    $(`.mh-settings-section[data-type="${selectedType}"]`).show();
                }
                $('#mh_form_type_select').on('change', toggleFormTypeSections);
                toggleFormTypeSections();

                function getFieldRowHtml(index) {
                    let mapOptions = Object.entries(crmFields).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
                    let typeOptions = `
                        <option value="text">טקסט</option>
                        <option value="tel">טלפון</option>
                        <option value="email">אימייל</option>
                        <option value="textarea">אזור טקסט</option>
                        <option value="select">בחירה (Select)</option>
                        <option value="number">מספר (סכום)</option>
                        <option value="fixed_amount">סכום קבוע</option>
                        <option value="hidden">שדה מוסתר</option>
                        <option value="hidden_post_id">מזהה פוסט (נסתר)</option>
                        <option value="hidden_post_title">שם פוסט (נסתר)</option>`;
                    
                    return `
                    <div class="mh-field-row" data-index="${index}">
                        <div class="mh-field-col-main">
                            <input type="text" name="mh_form_fields[${index}][label]" required placeholder="תווית השדה" style="width:100%" />
                            <select class="mh-field-type-select" name="mh_form_fields[${index}][type]" style="width:100%">${typeOptions}</select>
                            <select name="mh_form_fields[${index}][map_to]" style="width:100%">${mapOptions}</select>
                            <a href="#" class="mh-remove-field-btn">הסר</a>
                        </div>
                        <div class="mh-field-col-options">
                            <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 10px;">
                                <label><input type="checkbox" name="mh_form_fields[${index}][required]" value="1" /> שדה חובה</label>
                                <input type="text" class="mh-field-default-value-wrapper" name="mh_form_fields[${index}][default_value]" placeholder="ערך ברירת מחדל" style="display:none; width: 150px;" />
                                <label><input type="checkbox" class="mh-url-param-enable" name="mh_form_fields[${index}][url_param_enable]" value="1"> הוסף ל-URL?</label>
                                <input type="text" class="mh-url-param-name" name="mh_form_fields[${index}][url_param_name]" placeholder="שם פרמטר" style="display:none; width: 100px;">
                            </div>
                            <textarea class="mh-field-options-wrapper" name="mh_form_fields[${index}][options]" placeholder="אפשרות 1\\nאפשרות 2 (עבור שדה בחירה)" style="display:none; width: 100%; height: 60px;"></textarea>
                            
                            <div style="display: flex; gap: 15px; margin-top: 10px;">
                                <label><input type="checkbox" class="mh-pull-meta-enable" name="mh_form_fields[${index}][pull_meta_enable]" value="1"> שאיבה מ-Meta Key</label>
                                <label><input type="checkbox" class="mh-conditional-enable" name="mh_form_fields[${index}][cond_enable]" value="1"> לוגיקה תנאית</label>
                            </div>
                            
                            <div class="mh-pull-meta-wrapper" style="display:none; margin-top:10px; padding:10px; background:#f5f5f5; border-radius:4px;">
                                <input type="text" name="mh_form_fields[${index}][pull_meta_key]" placeholder="מפתח שדה (Meta Key)" style="width: 250px;" />
                                <label><input type="checkbox" name="mh_form_fields[${index}][pull_meta_readonly]" value="1"> שדה לקריאה בלבד</label>
                            </div>
                            
                            <div class="mh-conditional-logic-wrapper" style="display:none; margin-top:10px; padding:10px; background:#eff; border-radius:4px;">
                                הצג אם שדה: <select class="mh-cond-field-select" name="mh_form_fields[${index}][cond_field_index]" style="min-width:150px;"></select>
                                <select name="mh_form_fields[${index}][cond_operator]"><option value="is">שווה ל</option><option value="is_not">שונה מ</option></select>
                                <input type="text" name="mh_form_fields[${index}][cond_value]" placeholder="ערך" style="width:100px;" />
                            </div>
                        </div>
                    </div>`;
                }

                // --- EVENTS ---

                $('#mh-add-field-btn').on('click', function() {
                    let nextIdx = wrapper.find('.mh-field-row').length ? Math.max(...wrapper.find('.mh-field-row').map(function() { return $(this).data('index'); }).get()) + 1 : 0;
                    wrapper.append(getFieldRowHtml(nextIdx));
                    updateAllPlaceholders();
                    updateConditionalSelects();
                });

                wrapper.on('click', '.mh-remove-field-btn', function(e) { 
                    e.preventDefault(); 
                    if(confirm('האם אתה בטוח שברצונך להסיר שדה זה?')) {
                        $(this).closest('.mh-field-row').remove(); 
                        updateAllPlaceholders(); 
                        updateConditionalSelects();
                    }
                });

                wrapper.on('change', '.mh-field-type-select', function() {
                    const row = $(this).closest('.mh-field-row');
                    const val = $(this).val();
                    row.find('.mh-field-options-wrapper').toggle(val === 'select');
                    row.find('.mh-field-default-value-wrapper').toggle(['hidden', 'fixed_amount'].includes(val));
                    updateConditionalSelects();
                });

                wrapper.on('change', '.mh-url-param-enable', function() { $(this).siblings('.mh-url-param-name').toggle($(this).is(':checked')); });
                wrapper.on('change', '.mh-pull-meta-enable', function() { $(this).closest('.mh-field-col-options').find('.mh-pull-meta-wrapper').toggle($(this).is(':checked')); });
                wrapper.on('change', '.mh-conditional-enable', function() { $(this).closest('.mh-field-col-options').find('.mh-conditional-logic-wrapper').toggle($(this).is(':checked')); });

                function updateConditionalSelects() {
                    const selectFields = [];
                    wrapper.find('.mh-field-row').each(function() {
                        const idx = $(this).data('index');
                        const lbl = $(this).find('input[name*="[label]"]').val();
                        if ($(this).find('.mh-field-type-select').val() === 'select' && lbl) selectFields.push({idx, lbl});
                    });
                    $('.mh-cond-field-select').each(function() {
                        const cur = $(this).val();
                        $(this).empty().append('<option value="">בחר שדה...</option>');
                        selectFields.forEach(f => $(this).append(`<option value="${f.idx}">${f.lbl}</option>`));
                        $(this).val(cur);
                    });
                }

                function updateAllPlaceholders() {
                    const labels = wrapper.find('input[name*="[label]"]').map(function() { return $(this).val(); }).get().filter(Boolean);
                    $('.mh-placeholders-output').html(labels.map(l => `<span class="placeholder-btn" data-placeholder="{${l}}">{${l}}</span>`).join(' '));
                }
                
                wrapper.on('input', 'input[name*="[label]"]', updateAllPlaceholders);

                $(document).on('click', '.placeholder-btn', function() {
                    const txt = $(this).data('placeholder');
                    const area = $(this).closest('.mh-form-section').find('.mh-message-textarea').first()[0];
                    if (area) {
                        const start = area.selectionStart;
                        area.value = area.value.substring(0, start) + txt + area.value.substring(area.selectionEnd);
                        area.focus();
                        area.selectionStart = area.selectionEnd = start + txt.length;
                    }
                });

                // WP Media Uploader
                $(document).on('click', '.mh-upload-image-btn', function(e) {
                    e.preventDefault();
                    const btn = $(this);
                    const frame = wp.media({ title: 'בחר תמונה', button: { text: 'השתמש בתמונה' }, multiple: false });
                    frame.on('select', function() {
                        const attachment = frame.state().get('selection').first().toJSON();
                        btn.siblings('.mh-image-id-input').val(attachment.id);
                        btn.siblings('.mh-image-preview').attr('src', attachment.url).show();
                        btn.siblings('.mh-remove-image-btn').show();
                    }).open();
                });

                $(document).on('click', '.mh-remove-image-btn', function(e) {
                    e.preventDefault();
                    $(this).siblings('.mh-image-id-input').val('');
                    $(this).siblings('.mh-image-preview').hide();
                    $(this).hide();
                });

                // Init
                updateAllPlaceholders();
                updateConditionalSelects();
                
                // Show/Hide relevant options for existing fields on load
                wrapper.find('.mh-field-row').each(function() {
                    const row = $(this);
                    const type = row.find('.mh-field-type-select').val();
                    row.find('.mh-field-options-wrapper').toggle(type === 'select');
                    row.find('.mh-field-default-value-wrapper').toggle(['hidden', 'fixed_amount'].includes(type));
                    if(row.find('.mh-url-param-enable').is(':checked')) row.find('.mh-url-param-name').show();
                    if(row.find('.mh-pull-meta-enable').is(':checked')) row.find('.mh-pull-meta-wrapper').show();
                    if(row.find('.mh-conditional-enable').is(':checked')) row.find('.mh-conditional-logic-wrapper').show();
                });
            });
        </script>
        <?php
    }

    private function render_field_row($index, $field, $crm_db_fields, $all_fields) {
        $type = $field['type'] ?? 'text';
        ?>
        <div class="mh-field-row" data-index="<?php echo $index; ?>">
            <div class="mh-field-col-main">
                <input type="text" name="mh_form_fields[<?php echo $index; ?>][label]" value="<?php echo esc_attr($field['label']); ?>" required />
                <select class="mh-field-type-select" name="mh_form_fields[<?php echo $index; ?>][type]">
                    <option value="text" <?php selected($type, 'text'); ?>>טקסט</option>
                    <option value="tel" <?php selected($type, 'tel'); ?>>טלפון</option>
                    <option value="email" <?php selected($type, 'email'); ?>>אימייל</option>
                    <option value="textarea" <?php selected($type, 'textarea'); ?>>אזור טקסט</option>
                    <option value="select" <?php selected($type, 'select'); ?>>בחירה (Select)</option>
                    <option value="number" <?php selected($type, 'number'); ?>>מספר (סכום)</option>
                    <option value="fixed_amount" <?php selected($type, 'fixed_amount'); ?>>סכום קבוע</option>
                    <option value="hidden" <?php selected($type, 'hidden'); ?>>שדה מוסתר</option>
                </select>
                <select name="mh_form_fields[<?php echo $index; ?>][map_to]">
                    <?php foreach($crm_db_fields as $k => $v) echo "<option value='$k' ".selected($field['map_to'], $k, false).">$v</option>"; ?>
                </select>
                <a href="#" class="mh-remove-field-btn">הסר</a>
            </div>
            <div class="mh-field-col-options">
                <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 10px;">
                    <label><input type="checkbox" name="mh_form_fields[<?php echo $index; ?>][required]" value="1" <?php checked($field['required'], 1); ?> /> שדה חובה</label>
                    <input type="text" class="mh-field-default-value-wrapper" name="mh_form_fields[<?php echo $index; ?>][default_value]" value="<?php echo esc_attr($field['default_value']); ?>" placeholder="ערך ברירת מחדל" style="width: 150px;" />
                    <label><input type="checkbox" class="mh-url-param-enable" name="mh_form_fields[<?php echo $index; ?>][url_param_enable]" value="1" <?php checked($field['url_param_enable'], 1); ?>> URL Param?</label>
                    <input type="text" class="mh-url-param-name" name="mh_form_fields[<?php echo $index; ?>][url_param_name]" value="<?php echo esc_attr($field['url_param_name']); ?>" placeholder="Parameter" style="width: 100px;">
                </div>
                <textarea class="mh-field-options-wrapper" name="mh_form_fields[<?php echo $index; ?>][options]" placeholder="כל אפשרות בשורה חדשה..."><?php echo esc_textarea($field['options']); ?></textarea>
                
                <div style="display: flex; gap: 15px; margin-top: 10px;">
                    <label><input type="checkbox" class="mh-pull-meta-enable" name="mh_form_fields[<?php echo $index; ?>][pull_meta_enable]" value="1" <?php checked($field['pull_meta_enable'], 1); ?>> משוך מ-Meta Key</label>
                    <label><input type="checkbox" class="mh-conditional-enable" name="mh_form_fields[<?php echo $index; ?>][cond_enable]" value="1" <?php checked($field['cond_enable'], 1); ?>> לוגיקה תנאית</label>
                </div>
                
                <div class="mh-pull-meta-wrapper" style="display:none; margin-top:10px; padding:10px; background:#f5f5f5;">
                    <input type="text" name="mh_form_fields[<?php echo $index; ?>][pull_meta_key]" value="<?php echo esc_attr($field['pull_meta_key']); ?>" placeholder="Meta Key" />
                    <label><input type="checkbox" name="mh_form_fields[<?php echo $index; ?>][pull_meta_readonly]" value="1" <?php checked($field['pull_meta_readonly'], 1); ?>> Readonly</label>
                </div>
                
                <div class="mh-conditional-logic-wrapper" style="display:none; margin-top:10px; padding:10px; background:#eff;">
                    הצג אם שדה: <select class="mh-cond-field-select" name="mh_form_fields[<?php echo $index; ?>][cond_field_index]" data-current="<?php echo $field['cond_field_index']; ?>"></select>
                    <select name="mh_form_fields[<?php echo $index; ?>][cond_operator]">
                        <option value="is" <?php selected($field['cond_operator'], 'is'); ?>>שווה ל</option>
                        <option value="is_not" <?php selected($field['cond_operator'], 'is_not'); ?>>שונה מ</option>
                    </select>
                    <input type="text" name="mh_form_fields[<?php echo $index; ?>][cond_value]" value="<?php echo esc_attr($field['cond_value']); ?>" />
                </div>
            </div>
        </div>
        <?php
    }

    private function render_image_uploader($name, $value) {
        $url = $value ? wp_get_attachment_image_url($value, 'thumbnail') : '';
        ?>
        <div style="margin: 10px 0;">
            <img class="mh-image-preview" src="<?php echo esc_url($url); ?>" style="<?php echo $value ? 'display:block;' : 'display:none;'; ?>" />
            <input type="hidden" class="mh-image-id-input" name="<?php echo esc_attr($name); ?>" value="<?php echo esc_attr($value); ?>" />
            <button type="button" class="button mh-upload-image-btn">העלה/בחר תמונה</button>
            <button type="button" class="button-link-delete mh-remove-image-btn" style="<?php echo $value ? '' : 'display:none;'; ?>">הסר</button>
        </div>
        <?php
    }

    public function render_shortcode_metabox($post) {
        if ( $post->post_status === 'publish' ) {
            echo '<input type="text" value="[mh_wc_payment_form id=\''.$post->ID.'\']" readonly onfocus="this.select();" style="width:100%; text-align:center; direction:ltr;">';
        } else {
            echo '<p>פרסם את הטופס כדי לראות את השורטקוד.</p>';
        }
    }

    // --- SAVE DATA ---

    public function save_meta_data( $post_id ) {
        if ( ! isset( $_POST['mh_wc_nonce'] ) || ! wp_verify_nonce( $_POST['mh_wc_nonce'], 'mh_wc_save_meta_data' ) ) return;
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;

        $meta_keys = [
            '_mh_form_type' => 'text', '_mh_save_to_crm' => 'checkbox', '_mh_crm_owner_id' => 'int',
            '_mh_submit_button_text' => 'text', '_mh_submit_button_bg_color' => 'text', '_mh_submit_button_text_color' => 'text',
            '_mh_wc_product_name' => 'text', '_mh_wc_checkout_description' => 'textarea', '_mh_wc_product_image_id' => 'int',
            '_mh_wc_synced_product_id' => 'int', '_mh_wc_amount_crm_map' => 'text',
            '_mh_wc_pending_message' => 'textarea', '_mh_wc_pending_image_id' => 'int',
            '_mh_wc_success_message' => 'textarea', '_mh_wc_success_image_id' => 'int',
            '_mh_standard_success_message' => 'textarea', '_mh_standard_redirect_url' => 'url',
            '_mh_standard_whatsapp_message' => 'textarea', '_mh_standard_whatsapp_image_id' => 'int'
        ];

        foreach ($meta_keys as $key => $type) {
            $post_val = $_POST[ltrim($key, '_')] ?? null;
            if ($type === 'checkbox') {
                update_post_meta($post_id, $key, $post_val ? '1' : '0');
            } elseif ($post_val !== null) {
                update_post_meta($post_id, $key, $post_val);
            }
        }

        if ( isset($_POST['mh_form_fields']) ) {
            update_post_meta($post_id, '_mh_form_fields', $_POST['mh_form_fields']);
        }
    }

    // --- FRONTEND RENDERING ---

    public function render_shortcode( $atts ) {
        $id = intval($atts['id'] ?? 0);
        if (!$id || get_post_type($id) !== 'mh_payment_form') return '';
        
        wp_enqueue_script( 'mh-wc-form-frontend-js' );
        wp_localize_script( 'mh-wc-form-frontend-js', 'mhWcFormData', ['ajax_url' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('mh_wc_form_submit_nonce')] );
        
        $fields = get_post_meta($id, '_mh_form_fields', true) ?: [];
        $product = $this->product_sync_handler->get_effective_product_data($id);
        
        $bg = get_post_meta($id, '_mh_submit_button_bg_color', true) ?: '#25D366';
        $clr = get_post_meta($id, '_mh_submit_button_text_color', true) ?: '#ffffff';
        $btn_txt = get_post_meta($id, '_mh_submit_button_text', true) ?: 'המשך לתשלום';

        ob_start();
        ?>
        <style>
            .mh-form-card { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
            .mh-form-header img { width: 100%; height: auto; max-height: 250px; object-fit: contain; background: #fcfcfc; padding: 10px; }
            .mh-form-body { padding: 30px; }
            .mh-form-field { margin-bottom: 20px; }
            .mh-form-field label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
            .mh-form-field input, .mh-form-field select, .mh-form-field textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
            .mh-form-submit-btn { width: 100%; padding: 15px; border-radius: 8px; border: none; font-size: 18px; font-weight: bold; cursor: pointer; transition: transform 0.2s; background-color: <?php echo $bg; ?>; color: <?php echo $clr; ?>; }
            .mh-form-submit-btn:hover { filter: brightness(92%); transform: translateY(-2px); }
        </style>
        <div class="mh-form-card">
            <?php if ($product['image_id']): ?>
                <div class="mh-form-header"><?php echo wp_get_attachment_image($product['image_id'], 'large'); ?></div>
            <?php endif; ?>
            <div class="mh-form-body">
                <form class="mh-wc-payment-form" data-form-id="<?php echo $id; ?>">
                    <input type="hidden" name="embedding_post_id" value="<?php echo get_the_ID(); ?>">
                    <?php foreach ($fields as $index => $f): 
                        $attrs = 'data-field-index="'.$index.'"';
                        if(!empty($f['cond_enable'])) $attrs .= ' data-conditional="true" data-cond-target-index="'.$f['cond_field_index'].'" data-cond-operator="'.$f['cond_operator'].'" data-cond-value="'.$f['cond_value'].'"';
                        
                        $val = $f['default_value'];
                        if(!empty($f['pull_meta_enable'])) {
                            $meta = get_post_meta(get_the_ID(), $f['pull_meta_key'], true);
                            if($meta !== '') $val = $meta;
                        }
                    ?>
                        <div class="mh-form-field" <?php echo $attrs; ?>>
                            <?php if(in_array($f['type'], ['hidden', 'hidden_post_id', 'hidden_post_title'])): ?>
                                <input type="hidden" name="<?php echo esc_attr($f['label']); ?>" value="<?php echo ($f['type'] === 'hidden_post_id' ? get_the_ID() : ($f['type'] === 'hidden_post_title' ? get_the_title() : esc_attr($val))); ?>">
                            <?php else: ?>
                                <label><?php echo esc_html($f['label']); ?><?php if(!empty($f['required'])) echo ' <span style="color:red;">*</span>'; ?></label>
                                <?php if($f['type'] === 'textarea'): ?>
                                    <textarea name="<?php echo esc_attr($f['label']); ?>" <?php if(!empty($f['required'])) echo 'required'; ?> <?php if(!empty($f['pull_meta_readonly'])) echo 'readonly'; ?>><?php echo esc_textarea($val); ?></textarea>
                                <?php elseif($f['type'] === 'select'): ?>
                                    <select name="<?php echo esc_attr($f['label']); ?>" <?php if(!empty($f['required'])) echo 'required'; ?>>
                                        <option value="">בחר...</option>
                                        <?php foreach(explode("\n", $f['options']) as $opt) { $opt = trim($opt); echo "<option value='$opt'>$opt</option>"; } ?>
                                    </select>
                                <?php else: ?>
                                    <input type="<?php echo esc_attr($f['type']); ?>" name="<?php echo esc_attr($f['label']); ?>" value="<?php echo esc_attr($val); ?>" <?php if(!empty($f['required'])) echo 'required'; ?> <?php if(!empty($f['pull_meta_readonly'])) echo 'readonly'; ?>>
                                <?php endif; ?>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                    <button type="submit" class="mh-form-submit-btn"><?php echo esc_html($btn_txt); ?></button>
                    <div class="mh-form-response" style="margin-top: 15px; display: none; text-align: center; padding: 10px; border-radius: 8px;"></div>
                </form>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    // --- FORM SUBMISSION ---

    public function handle_form_submission() {
        check_ajax_referer( 'mh_wc_form_submit_nonce', 'nonce' );
        $fid = intval($_POST['form_id']);
        $raw = $_POST['form_data'];
        $data = $this->_parse_form_data_array($raw);
        $post_id = intval($data['embedding_post_id'] ?? 0);

        if (get_post_meta($fid, '_mh_form_type', true) === 'standard') {
            $this->standard_form_handler->handle_submission($fid, $data, $post_id, $this);
            return;
        }

        $product = $this->product_sync_handler->get_effective_product_data($fid);
        $amount = $product['is_synced'] ? floatval($product['price']) : 0;
        
        if (!$amount) {
            foreach(get_post_meta($fid, '_mh_form_fields', true) ?: [] as $f) {
                if ( ($f['map_to'] === 'payment_amount') || in_array($f['type'], ['number', 'fixed_amount']) ) {
                    if (isset($data[$f['label']])) $amount = floatval($data[$f['label']]);
                }
            }
        }

        if ($amount <= 0) wp_send_json_error(['message' => 'סכום תשלום לא תקין.']);

        try {
            WC()->cart->empty_cart();
            $wc_pid = $product['is_synced'] ? $product['id'] : $this->create_temp_product($product['name'], $amount);
            WC()->cart->add_to_cart($wc_pid, 1, 0, [], ['mh_form_id'=>$fid, 'mh_form_data'=>$raw, 'mh_embedding_post_id'=>$post_id]);
            
            WC()->session->set('mh_wc_form_id', $fid);
            WC()->session->set('mh_wc_form_submitted_data', $data);

            if (get_post_meta($fid, '_mh_save_to_crm', true) === '1') {
                $this->save_to_crm($fid, $data, 'הועבר לתשלום', $amount);
            }

            wp_send_json_success(['payment_url' => wc_get_checkout_url()]);
        } catch (Exception $e) { wp_send_json_error(['message' => $e->getMessage()]); }
    }

    private function create_temp_product($name, $amount) {
        $p = new WC_Product_Simple();
        $p->set_name($name ?: 'תשלום'); $p->set_regular_price($amount); $p->set_virtual(true); $p->set_catalog_visibility('hidden'); $p->set_status('publish');
        return $p->save();
    }

    // --- CRM INTEGRATION ---

    public function save_to_crm($fid, $data, $status = null, $amount = 0) {
        global $wpdb;
        $owner = get_post_meta($fid, '_mh_crm_owner_id', true) ?: 1;
        $map = get_post_meta($fid, '_mh_form_fields', true) ?: [];
        $contact = [];
        
        foreach($map as $m) if(!empty($m['map_to']) && isset($data[$m['label']])) $contact[$m['map_to']] = sanitize_text_field($data[$m['label']]);
        
        $amt_map = get_post_meta($fid, '_mh_wc_amount_crm_map', true);
        if ($amt_map && $amount > 0) $contact[$amt_map] = $amount;

        if (empty($contact['conta_phone'])) return;
        $phone = $this->_normalize_phone_for_db($contact['conta_phone']);
        $table = $wpdb->prefix . 'mh_crm_contacts';
        
        $existing = $wpdb->get_row($wpdb->prepare("SELECT id, events FROM $table WHERE conta_phone = %s AND owner_id = %d", $phone, $owner));
        
        $entry = [
            'conta_name'=>$contact['conta_name']??'', 'conta_phone'=>$phone, 'email'=>$contact['email']??'', 
            'tg1'=>$status ?: ($contact['tg1']??''), 'owner_id'=>$owner, 'status'=>'active'
        ];
        
        // Extended whitelist to include ALL supported fields from the form builder
        $allowed_fields = [
            'f_m', 'gender', 'birth_date', 'work_phone', 'website', 
            'mh_crm_city', 'mh_crm_street', 'company_name', 'job_title', 
            'lead_source', 'notes', 'tg2', 'tg3'
        ];

        foreach($allowed_fields as $k) {
            if(isset($contact[$k])) {
                $entry[$k] = $contact[$k];
            }
        }

        // --- AUTO-POPULATION LOGIC ---
        // 1. Lead Source = Page Title
        $embedding_post_id = intval($data['embedding_post_id'] ?? 0);
        if ($embedding_post_id) {
            $page_title = get_the_title($embedding_post_id);
            if ($page_title) {
                $entry['lead_source'] = $page_title;
            }
        }
        
        // 2. Form Name
        $form_title = get_the_title($fid);
        if ($form_title) {
            $entry['last_form_name'] = $form_title;
        }

        if ($existing) {
            $wpdb->update($table, $entry, ['id'=>$existing->id]);
            $contact_id = $existing->id;
        } else {
            $wpdb->insert($table, $entry);
            $contact_id = $wpdb->insert_id;
        }

        $events = $existing ? json_decode($existing->events, true) : [];
        $events[] = ['time'=>current_time('mysql'), 'title'=>'טופס: '.get_the_title($fid), 'text'=>($amount?"סכום: $amount שח. ":"")."סטטוס: $status"];
        $wpdb->update($table, ['events'=>json_encode($events)], ['id'=>$contact_id]);
    }

    public function handle_payment_status_change($oid, $old, $new, $order) {
        if (in_array($new, ['completed', 'processing'])) {
            $fid = 0; $raw = [];
            foreach($order->get_items() as $item) if($fid = $item->get_meta('_mh_form_id')) { $raw = $item->get_meta('_mh_form_data'); break; }
            if($fid) $this->save_to_crm($fid, $this->_parse_form_data_array($raw), 'תשלום בוצע', $order->get_total());
        }
    }

    /**
     * אכלוס דינמי של שדות הקופה מנתוני הסשן
     */
    public function populate_checkout_fields_from_session($value, $key) {
        if ( ! WC()->session ) return $value;
        
        $form_id = WC()->session->get('mh_wc_form_id');
        $submitted_data = WC()->session->get('mh_wc_form_submitted_data');
        
        if ( ! $form_id || ! $submitted_data ) return $value;
        
        $fields = get_post_meta($form_id, '_mh_form_fields', true);
        if ( ! is_array($fields) ) return $value;

        foreach ( $fields as $field ) {
            $label = $field['label'];
            $map_to = $field['map_to'] ?? '';
            $type = $field['type'] ?? '';
            
            if ( ! isset($submitted_data[$label]) ) continue;
            $submitted_val = trim($submitted_data[$label]);

            // מיפוי טלפון
            if ( $key === 'billing_phone' && ($map_to === 'conta_phone' || $type === 'tel') ) return $submitted_val;
            
            // מיפוי אימייל
            if ( $key === 'billing_email' && ($map_to === 'email' || $type === 'email') ) return $submitted_val;
            
            // מיפוי שם פרטי
            if ( $key === 'billing_first_name' && ($map_to === 'conta_name') ) {
                $parts = explode(' ', $submitted_val, 2);
                return $parts[0];
            }
            
            /**
             * FIXED: Robust Last Name Mapping
             * 1. If it's a dedicated last name field (f_m), use it.
             * 2. If it's a full name field (conta_name), use the 2nd part.
             * 3. CRITICAL: If no 2nd part exists, return the 1st part to satisfy WooCommerce validation.
             */
            if ( $key === 'billing_last_name' ) {
                if ($map_to === 'f_m') return $submitted_val;
                if ($map_to === 'conta_name') {
                    $parts = explode(' ', $submitted_val, 2);
                    // Return the second part if it exists, otherwise return the whole string (fallback)
                    return (isset($parts[1]) && trim($parts[1]) !== '') ? $parts[1] : $submitted_val;
                }
            }
        }
        
        return $value;
    }

    public function clear_form_session_data() { if(WC()->session) { WC()->session->__unset('mh_wc_form_id'); WC()->session->__unset('mh_wc_form_submitted_data'); } }
    
    public function save_form_data_to_order_item($item, $key, $values, $order) { 
        if(isset($values['mh_form_id'])) {
            $item->add_meta_data('_mh_form_id', $values['mh_form_id'], true);
        }
        if(isset($values['mh_form_data'])) {
            $item->add_meta_data('_mh_form_data', $values['mh_form_data'], true);
        }
        if(isset($values['mh_embedding_post_id'])) {
            $item->add_meta_data('_mh_embedding_post_id', $values['mh_embedding_post_id'], true);
        }
    }
    public function enqueue_admin_scripts($h) { if($h === 'post.php' || $h === 'post-new.php') wp_enqueue_media(); }
    public function enqueue_frontend_scripts() { wp_register_script( 'mh-wc-form-frontend-js', MH_WC_PAYMENTS_URL . 'assets/js/mh-wc-form-frontend.js', [ 'jquery' ], '3.8.2', true ); }
    public function add_shortcode_column_to_list($c) { $c['shortcode'] = 'שורטקוד'; return $c; }
    public function display_shortcode_in_column($c, $pid) { if($c==='shortcode') echo '<input type="text" readonly value="[mh_wc_payment_form id=\''.$pid.'\']" style="width:100%; direction:ltr;">'; }
    public function get_phone_from_form_data($fid, $d) { foreach(get_post_meta($fid, '_mh_form_fields', true) ?: [] as $f) if($f['type']==='tel' || $f['map_to']==='conta_phone') return $d[$f['label']]; return ''; }
    public function build_final_message($t, $d) { foreach($d as $k=>$v) $t = str_replace('{'.$k.'}', $v, $t); return $t; }
}