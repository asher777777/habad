<?php
/**
 * File: class-crm-asset-manager.php
 * Description: Manages and enqueues CRM core scripts and styles.
 *
 * @package M_H_CRM_Plugin
 * @version 15.1.1
 * --- CHANGELOG V15.1.1 ---
 * - CRITICAL FIX: Corrected the script dependency and enqueue order.
 * - The main `app.js` script is now enqueued first, and all other modules (`api.js`, `ui-main.js`, `ui-actions.js`) correctly list it as a dependency.
 * - This resolves the circular dependency issue that caused scripts to fail loading, resulting in missing UI elements like the bulk actions container.
 * --- CHANGELOG V15.1.0 ---
 * - REMOVED: Dequeued the Google Places API script.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class CRM_Asset_Manager {

    public function init() {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function enqueue_assets() {
        global $post;

        $has_core_shortcode = is_admin() || (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'my_crm_app'));
        $should_enqueue = apply_filters('mh_crm_should_enqueue_assets', $has_core_shortcode);

       if ($should_enqueue) {
            $this->enqueue_styles();
            $this->enqueue_scripts();
        }
    }

    private function enqueue_styles() {
        $plugin_assets_url = plugin_dir_url(dirname(__FILE__)) . 'assets/';
        wp_enqueue_style('material-icons', 'https://fonts.googleapis.com/icon?family=Material+Icons', [], null);
        wp_enqueue_style('crm-main-style', $plugin_assets_url . 'css/main.css', ['material-icons'], filemtime(plugin_dir_path(dirname(__FILE__)) . 'assets/css/main.css'));
    }

    private function enqueue_scripts() {
        $plugin_assets_url = plugin_dir_url(dirname(__FILE__)) . 'assets/';
        
        // Enqueue third-party libraries first
        wp_enqueue_script('xlsx-library', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', [], '0.18.5', true);
        
        // Enqueue the main app script which other modules depend on
        $app_path = plugin_dir_path(dirname(__FILE__)) . 'assets/js/app.js';
        wp_enqueue_script('crm-app', $plugin_assets_url . 'js/app.js', ['xlsx-library'], filemtime($app_path), true);
        
        // Define core modules that depend on the main app
        $core_scripts = [
            'crm-api'             => ['path' => 'js/api.js'],
            'crm-ui-main'         => ['path' => 'js/ui-main.js'],
            'crm-ui-actions'      => ['path' => 'js/ui-actions.js'],
        ];

        // Enqueue the core modules, ensuring they depend on 'crm-app'
        foreach ($core_scripts as $handle => $script) {
            $file_path = plugin_dir_path(dirname(__FILE__)) . 'assets/' . $script['path'];
            wp_enqueue_script($handle, $plugin_assets_url . $script['path'], ['crm-app'], filemtime($file_path), true);
        }

        // Localize config data for all CRM scripts
        $all_handles = array_keys($core_scripts);
        $all_handles[] = 'crm-app';
        $this->localize_scripts($all_handles);
    }

    private function localize_scripts($handles) {
        $crm_config_data = [
            'rest_url'       => get_rest_url(null, 'mh-crm/v1'), 
            'nonce'          => wp_create_nonce('wp_rest'),
            'dynamic_fields' => $this->get_dynamic_fields_config(),
        ];

        foreach ($handles as $handle) {
            wp_localize_script($handle, 'crm_config', $crm_config_data);
        }
    }

    private function get_dynamic_fields_config() {
        $default_fields = [
            'שם'         => 'conta_name',
            'שם משפחה' => 'f_m',
            'טלפון'      => 'conta_phone',
            'מגדר'       => 'gender',
            'תג1'        => 'tg1',
            'תג2'        => 'tg2',
            'תג3'        => 'tg3',
        ];

        return apply_filters('mh_crm_dynamic_fields', $default_fields);
    }
}