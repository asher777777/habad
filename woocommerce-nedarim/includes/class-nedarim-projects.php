<?php
/**
 * Nedarim Plus Projects Addon
 * 
 * קובץ תוספת עבור נדרים פלוס המאפשר הוספת שדה פרויקט למוצרים
 * 
 * @package NedarimPlus
 */

if (!defined('ABSPATH')) {
    exit; // יציאה אם יש גישה ישירה
}

if (!class_exists('WC_Nedarim_Projects')) {

    class WC_Nedarim_Projects {

        /**
         * Constructor
         */
        public function __construct() {
            $this->init_hooks();
        }

        /**
         * Init hooks
         */
        public function init_hooks() {
            // הוספת שדה הפרויקט לעמוד עריכת המוצר
            add_action('woocommerce_product_options_general_product_data', array($this, 'add_project_field_to_product'));
            
            // שמירת שדה הפרויקט
            add_action('woocommerce_process_product_meta', array($this, 'save_project_field_to_product'));
            
            // הוספת מידע הפרויקט לפריט העגלה
            add_filter('woocommerce_add_cart_item_data', array($this, 'add_project_to_cart_item'), 10, 3);
            
            // הוספת מידע הפרויקט לפריט ההזמנה
            add_action('woocommerce_checkout_create_order_line_item', array($this, 'add_project_to_order_items'), 10, 4);
            
            // הוספת שדה בהגדרות של התוסף
            add_filter('woocommerce_settings_api_form_fields_nedarim', array($this, 'add_project_setting_field'));
            add_filter('woocommerce_settings_api_form_fields_bitnedarim', array($this, 'add_project_setting_field'));
        }

        /**
         * הוספת שדה פרויקט לעמוד עריכת המוצר
         */
        public function add_project_field_to_product() {
            global $post, $woocommerce;
            
            // קבלת רשימת הפרויקטים מהגדרות התוסף
            $settings = get_option('woocommerce_nedarim_settings', []);
            $projects = isset($settings['projects']) ? explode("\n", $settings['projects']) : [];
            
            if (empty($projects)) {
                return; // אם אין פרויקטים מוגדרים, לא להציג את השדה
            }
            
            // יצירת אפשרויות לבחירה
            $options = [];
            $options[''] = '-- בחר פרויקט --';
            
            foreach ($projects as $project) {
                $project = trim($project);
                if (empty($project)) continue;
                
                // פיצול לערך ושם אם הפורמט הוא "ערך:שם"
                $project_parts = explode(':', $project, 2);
                $project_value = trim($project_parts[0]);
                $project_name = isset($project_parts[1]) ? trim($project_parts[1]) : $project_value;
                
                $options[$project_value] = $project_name;
            }
            
            // בדיקה האם המוצר כבר יש לו פרויקט מוגדר
            $selected_project = get_post_meta($post->ID, '_nedarim_project', true);
            
            // יצירת שדה בחירה
            woocommerce_wp_select(
                array(
                    'id' => '_nedarim_project',
                    'label' => __('פרויקט בנדרים פלוס', 'nedarim-plus'),
                    'description' => __('בחר את הפרויקט אליו ישויך התשלום בנדרים פלוס', 'nedarim-plus'),
                    'desc_tip' => true,
                    'options' => $options,
                    'value' => $selected_project,
                )
            );
        }

        /**
         * שמירת שדה הפרויקט במוצר
         */
        public function save_project_field_to_product($post_id) {
            $project = isset($_POST['_nedarim_project']) ? sanitize_text_field($_POST['_nedarim_project']) : '';
            update_post_meta($post_id, '_nedarim_project', $project);
        }

        /**
         * הוספת מידע הפרויקט לפריט העגלה
         */
        public function add_project_to_cart_item($cart_item_data, $product_id, $variation_id) {
            $project = get_post_meta($product_id, '_nedarim_project', true);
            
            if (!empty($project)) {
                $cart_item_data['nedarim_project'] = $project;
            }
            
            return $cart_item_data;
        }

        /**
         * הוספת מידע הפרויקט לפריט ההזמנה
         */
        public function add_project_to_order_items($item, $cart_item_key, $values, $order) {
            if (isset($values['nedarim_project'])) {
                $item->add_meta_data('_nedarim_project', $values['nedarim_project'], true);
            }
        }

        /**
         * הוספת שדה להגדרות התוסף
         */
        public function add_project_setting_field($fields) {
            $fields['projects'] = array(
                'title'       => __('רשימת פרויקטים', 'nedarim-plus'),
                'type'        => 'textarea',
                'description' => __('הזן רשימת פרויקטים לבחירה, שורה לכל פרויקט. ניתן להשתמש בפורמט "ערך:שם" (לדוגמה: "project1:פרויקט 1").', 'nedarim-plus'),
                'default'     => '',
                'desc_tip'    => true,
            );
            
            return $fields;
        }

        /**
         * קבלת הפרויקט שנבחר מההזמנה
         */
        public static function get_project_from_order($order) {
            // בדיקה האם יש פרויקט בפריטי ההזמנה
            $project = '';
            foreach ($order->get_items() as $item) {
                $project_meta = $item->get_meta('_nedarim_project');
                if (!empty($project_meta)) {
                    $project = $project_meta;
                    break;
                }
            }
            
            return $project;
        }
    }

    // יצירת אינסטנס של המחלקה
    $GLOBALS['wc_nedarim_projects'] = new WC_Nedarim_Projects();
}

/**
 * הוספת פרויקט לנתוני התשלום בכרטיס אשראי
 */
function add_project_to_nedarim_transaction($curl_body, $order) {
    if (class_exists('WC_Nedarim_Projects')) {
        $project = WC_Nedarim_Projects::get_project_from_order($order);
        
        if (!empty($project)) {
            $curl_body['Project'] = $project;
        }
    }
    
    return $curl_body;
}

/**
 * הוק לשינוי נתוני התשלום בכרטיס אשראי
 */
function modify_nedarim_transaction($order_id) {
    // כאן נשאיר ריק כי נשתמש בפילטרים לשינוי הנתונים
}

/**
 * הוק לשינוי נתוני התשלום בביט
 */
function modify_bit_nedarim_transaction($order_id) {
    // כאן נשאיר ריק כי נשתמש בפילטרים לשינוי הנתונים
}