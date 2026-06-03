<?php
/**
 * File: class-mh-database-manager.php
 * Description: Handles all database interactions for the M.H CRM Plugin.
 *
 * @package M_H_CRM_Plugin
 * @version 18.0.0
 * --- CHANGELOG V18.0.0 ---
 * - DB SCHEMA: Added comprehensive tracking and filtering columns:
 * - last_form_name, last_form_page, last_form_submission_date for form tracking.
 * - last_message_read_status for future message status integration.
 * - total_spent, order_count, last_order_date for WooCommerce purchase history summary.
 * - DB VERSION: Incremented to 2.3 to trigger the major schema update.
 * --- CHANGELOG V17.0.0 ---
 * - DB SCHEMA: Added initial columns for advanced filtering.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class MH_Database_Manager {

    private static $db_version = '2.3'; // DB version for the contacts table structure

    /**
     * Creates or updates all necessary database tables for the plugin.
     * This is the single source of truth for the database schema.
     */
    public static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // --- Dedicated Contacts Table (Managed by Core CRM) ---
        $contacts_table_name = $wpdb->prefix . 'mh_crm_contacts';
        $sql_contacts = "CREATE TABLE {$contacts_table_name} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            owner_id BIGINT(20) UNSIGNED NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            
            -- Core Fields
            conta_name VARCHAR(255) DEFAULT NULL,
            f_m VARCHAR(255) DEFAULT NULL,
            conta_phone VARCHAR(50) DEFAULT NULL,
            email VARCHAR(255) DEFAULT NULL,
            gender VARCHAR(50) DEFAULT NULL,
            
            -- Address Fields
            mh_crm_city VARCHAR(255) DEFAULT NULL,
            mh_crm_street VARCHAR(255) DEFAULT NULL,
            
            -- Tag Fields
            tg1 VARCHAR(255) DEFAULT NULL,
            tg2 VARCHAR(255) DEFAULT NULL,
            tg3 VARCHAR(255) DEFAULT NULL,

            -- Company Fields
            company_name VARCHAR(255) DEFAULT NULL,
            job_title VARCHAR(255) DEFAULT NULL,
            lead_source VARCHAR(100) DEFAULT NULL,

            -- Other Contact Info
            work_phone VARCHAR(50) DEFAULT NULL,
            website VARCHAR(255) DEFAULT NULL,
            birth_date DATE DEFAULT NULL,
            notes LONGTEXT DEFAULT NULL,
            events LONGTEXT DEFAULT NULL,
            form_submissions LONGTEXT DEFAULT NULL,

            -- Form Tracking Fields
            last_form_name VARCHAR(255) DEFAULT NULL,
            last_form_page VARCHAR(255) DEFAULT NULL,
            last_form_submission_date DATETIME DEFAULT NULL,
            
            -- Message Tracking Fields
            last_message_read_status VARCHAR(50) NOT NULL DEFAULT 'unknown',

            -- WooCommerce Summary Fields
            total_spent DECIMAL(10, 2) DEFAULT 0.00,
            order_count INT(11) DEFAULT 0,
            last_order_date DATETIME DEFAULT NULL,

            -- Timestamps
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            PRIMARY KEY (id),
            INDEX owner_id_status (owner_id, status),
            INDEX conta_phone (conta_phone),
            INDEX email (email),
            INDEX last_form_name (last_form_name)
        ) {$charset_collate};";
        
        dbDelta($sql_contacts);
        
        update_option('mh_crm_db_version', self::$db_version);
    }
}