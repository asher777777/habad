<?php
/**
 * Plugin Name:         M.H - WhatsApp Add-on for CRM
 * Plugin URI:          https://your-website.com/
 * Description:         מרחיב את מערכת M.H CRM עם יכולות WhatsApp מתקדמות: שליחה קבוצתית, ניהול חיבור וייבוא מקבוצות.
 * Version:             17.0.0
 * Author:              M.H
 * Author URI:          https://your-website.com/
 * License:             GPL v2 or later
 * License URI:         https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:         m-h-whatsapp-addon
 * Domain Path:         /languages
 * --- CHANGELOG ---
 * V16.0.4:
 * - FIX: Ensures database tables are explicitly created/updated during plugin activation
 * and also when the WhatsApp_API_Handlers class is initialized, making table setup
 * robust and integrated into the plugin lifecycle.
 * V16.0.3:
 * - FIX: Explicitly calls the database setup method during plugin activation to ensure
 * tables are created or updated reliably upon activation, preventing potential message
 * history saving issues.
 * V16.0.2:
 * - CRITICAL FIX: The activation hook now correctly calls the self-contained database
 * setup method located within the WhatsApp_API_Handlers class.
 * V16.0.1:
 * - REFACTOR: Moved database creation logic into a reusable public static function.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// Ensure the main class is only defined once.
if (!class_exists('M_H_WhatsApp_Addon')) {

    final class M_H_WhatsApp_Addon {

        private static $_instance = null;

        public static function instance() {
            if (is_null(self::$_instance)) {
                self::$_instance = new self();
            }
            return self::$_instance;
        }

        private function __construct() {
            add_action('plugins_loaded', [$this, 'init']);
        }
        
        /**
         * Runs on plugin activation.
         * Ensures database tables are created/updated.
         */
        public static function activate() {
            // We need to include the handler file here because it's not auto-loaded on activation.
            require_once plugin_dir_path(__FILE__) . 'includes/class-whatsapp-api-handlers.php';
            // CRITICAL FIX: Explicitly call the database setup here to ensure tables exist.
            WhatsApp_API_Handlers::setup_database();
        }

        public function init() {
            if (!class_exists('M_H_CRM_Plugin')) {
                add_action('admin_notices', [$this, 'core_plugin_missing_notice']);
                return;
            }

            $this->define_constants();
            $this->load_dependencies();
            $this->init_components();
        }

        public function core_plugin_missing_notice() {
            ?>
            <div class="notice notice-error is-dismissible">
                <p>
                    <b><?php _e('M.H - WhatsApp Add-on:', 'm-h-whatsapp-addon'); ?></b>
                    <?php _e('תוסף זה דורש את תוסף הליבה', 'm-h-whatsapp-addon'); ?>
                    <b><?php _e('M.H - מערכת CRM.', 'm-h-whatsapp-addon'); ?></b>
                    <?php _e('אנא התקן והפעל אותו כדי להשתמש בתוסף הוואטסאפ.', 'm-h-whatsapp-addon'); ?>
                </p>
            </div>
            <?php
        }

        private function define_constants() {
            if (!defined('MH_WHATSAPP_ADDON_DIR')) {
                define('MH_WHATSAPP_ADDON_DIR', plugin_dir_path(__FILE__));
            }
        }

        private function load_dependencies() {
            require_once MH_WHATSAPP_ADDON_DIR . 'includes/class-whatsapp-asset-manager.php';
            require_once MH_WHATSAPP_ADDON_DIR . 'includes/class-whatsapp-api-handlers.php';
            require_once MH_WHATSAPP_ADDON_DIR . 'includes/class-whatsapp-shortcodes.php';
        }

        private function init_components() {
            $asset_manager  = new WhatsApp_Asset_Manager();
            $api_handlers   = new WhatsApp_API_Handlers(); // This will now call setup_database() in its constructor
            $shortcodes     = new WhatsApp_Shortcodes();
            
            $asset_manager->init();
            $api_handlers->init();
            $shortcodes->init();
        }
    }
}

// Register the activation hook.
register_activation_hook(__FILE__, ['M_H_WhatsApp_Addon', 'activate']);

function mh_whatsapp_addon_run() {
    return M_H_WhatsApp_Addon::instance();
}

mh_whatsapp_addon_run();