<?php
/**
 * Plugin Name:         M.H - מערכת CRM
 * Plugin URI:          https://your-website.com/
 * Description:         פתרון CRM מקיף לניהול אנשי קשר ותיעוד היסטוריית הודעות.
 * Version:             16.0.0
 * Author:              M.H
 * Author URI:          https://your-website.com/
 * License:             GPL v2 or later
 * License URI:         https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:         m-h-crm
 * Domain Path:         /languages
 * --- CHANGELOG V15.0.0 ---
 * - MAJOR REFACTOR: Removed the 'pep' Custom Post Type entirely. The plugin now exclusively uses a custom database table.
 * - This change eliminates the admin post editor for contacts and removes all associated hooks (`add_meta_boxes`, `save_post_pep`), permanently resolving all conflicts.
 * - The plugin is now lighter, more focused, and more stable.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

if (!class_exists('M_H_CRM_Plugin')) {
    final class M_H_CRM_Plugin {
        private static $_instance = null;

        public static function instance() {
            if (is_null(self::$_instance)) {
                self::$_instance = new self();
            }
            return self::$_instance;
        }

        private function __construct() {
            $this->define_constants();
            $this->load_dependencies();
            register_activation_hook(__FILE__, [$this, 'activate']);
            add_action('plugins_loaded', [$this, 'init_plugin']);
        }

        public function init_plugin() {
            $this->db_update_check();
            $this->init_plugin_components();
        }

        private function define_constants() {
            if (!defined('MH_CRM_PLUGIN_DIR')) {
                define('MH_CRM_PLUGIN_DIR', plugin_dir_path(__FILE__));
            }
        }
        
        private function load_dependencies() {
            require_once MH_CRM_PLUGIN_DIR . 'includes/class-mh-database-manager.php';
            require_once MH_CRM_PLUGIN_DIR . 'includes/class-crm-asset-manager.php';
            require_once MH_CRM_PLUGIN_DIR . 'includes/class-crm-api-handlers.php';
            require_once MH_CRM_PLUGIN_DIR . 'includes/class-crm-shortcodes.php';
        }

        public function init_plugin_components() {
            $db_manager     = new MH_Database_Manager();
            $api_handlers   = new CRM_API_Handlers($db_manager); 
            $asset_manager  = new CRM_Asset_Manager();
            $shortcodes     = new CRM_Shortcodes();
            
            $asset_manager->init();
            $api_handlers->init();
            $shortcodes->init();
        }

        public function db_update_check() {
            $target_db_version = '2.3'; // Corresponds to the new table structure
            $current_db_version = get_option('mh_crm_db_version');
            if ($current_db_version != $target_db_version) {
                MH_Database_Manager::create_tables();
            }
        }

        public function activate() {
            MH_Database_Manager::create_tables();
            flush_rewrite_rules();
        }
    }
}

function mh_crm_plugin_run() {
    return M_H_CRM_Plugin::instance();
}

mh_crm_plugin_run();