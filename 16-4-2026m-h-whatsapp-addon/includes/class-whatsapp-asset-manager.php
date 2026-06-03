<?php
/**
 * File: class-whatsapp-asset-manager.php
 * Description: Manages and enqueues scripts and styles for the WhatsApp Add-on.
 *
 * @package M_H_WhatsApp_Addon
 * @version 16.0.1
 * --- CHANGELOG ---
 * V16.0.1:
 * - CACHE BUSTING: Incremented the script version number to force browsers to load the latest
 * version of the JavaScript files, ensuring the new direct-upload logic is used.
 * V16.0.0 (Optimized with Dependency Management)
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class WhatsApp_Asset_Manager {

    public function init() {
        add_filter('mh_crm_should_enqueue_assets', [$this, 'should_enqueue_whatsapp_assets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets'], 20);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets'], 20);
    }

    public function should_enqueue_whatsapp_assets($should_enqueue) {
        if ($should_enqueue) {
            return true;
        }

        global $post;
        if (is_a($post, 'WP_Post') && (
            has_shortcode($post->post_content, 'my_crm_app') ||
            has_shortcode($post->post_content, 'my_crm_account_details') ||
            has_shortcode($post->post_content, 'my_crm_group_manager') ||
            has_shortcode($post->post_content, 'my_crm_group_send') ||
            has_shortcode($post->post_content, 'my_crm_message_history')
        )) {
            return true;
        }

        return $should_enqueue;
    }

    public function enqueue_assets() {
        if (!apply_filters('mh_crm_should_enqueue_assets', false)) {
            return;
        }

        $this->enqueue_styles();
        $this->enqueue_scripts();
    }

    private function enqueue_styles() {
        $plugin_assets_url = plugin_dir_url(dirname(__FILE__)) . 'assets/';
        $style_path = plugin_dir_path(dirname(__FILE__)) . 'assets/css/whatsapp-styles.css';
        $version = file_exists($style_path) ? filemtime($style_path) : time();

        wp_enqueue_style(
            'whatsapp-addon-style', 
            $plugin_assets_url . 'css/whatsapp-styles.css', 
            ['crm-main-style'], 
            $version
        );
    }

    private function enqueue_scripts() {
        $plugin_assets_url = plugin_dir_url(dirname(__FILE__)) . 'assets/';
        // --- THE FIX IS HERE ---
        // By changing this version number, we force all browsers to download the new script files
        // instead of using an old cached version.
        $version = '11.0.3'; 

        $addon_modules = [
            'crm-green-api'       => ['path' => 'js/green-api.js', 'deps' => ['crm-api']],
            'crm-ui-group-send'   => ['path' => 'js/ui-group-send.js', 'deps' => ['crm-ui-main', 'crm-green-api']],
            'crm-group-manager'   => ['path' => 'js/group-manager.js', 'deps' => ['crm-green-api']],
            'crm-message-history' => ['path' => 'js/message-history.js', 'deps' => ['crm-ui-main']]
        ];

        foreach ($addon_modules as $handle => $script) {
            $file_path = plugin_dir_path(dirname(__FILE__)) . 'assets/' . $script['path'];
            $version = file_exists($file_path) ? filemtime($file_path) : time();
            wp_enqueue_script($handle, $plugin_assets_url . $script['path'], $script['deps'], $version, true);
        }

        $init_path = plugin_dir_path(dirname(__FILE__)) . 'assets/js/whatsapp-init.js';
        $init_version = file_exists($init_path) ? filemtime($init_path) : time();

        wp_enqueue_script(
            'whatsapp-addon-init',
            $plugin_assets_url . 'js/whatsapp-init.js',
            array_merge(['crm-app'], array_keys($addon_modules)),
            $init_version,
            true
        );
    }
}