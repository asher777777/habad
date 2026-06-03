<?php
/**
 * File: class-whatsapp-api-handlers.php
 * Description: Handles all REST API endpoints for the WhatsApp Add-on.
 *
 * @package M_H_WhatsApp_Addon
 * @version 21.1.1
 * --- CHANGELOG V21.1.1 ---
 * - FIX: Added null coalescing checks for 'total_recipients', 'success_count', and 'failure_count' in save_message_history to prevent PHP warnings.
 * - FIX: Added fallback calculation for total_recipients if not provided in the payload.
 * --- CHANGELOG V21.1.0 ---
 * - CRITICAL FIX (proxy_to_green_api): The proxy now correctly handles non-JSON success responses from the Green API.
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class WhatsApp_API_Handlers
{

    public function __construct()
    {
        // Database setup is handled explicitly on plugin activation
    }

    public function init()
    {
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    public static function setup_database()
    {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        $charset_collate = $wpdb->get_charset_collate();
        $history_table_name = $wpdb->prefix . 'mh_crm_message_history';
        $recipients_table_name = $wpdb->prefix . 'mh_crm_message_recipients';

        $sql_history = "CREATE TABLE $history_table_name (
            id BIGINT(20) NOT NULL AUTO_INCREMENT,
            user_id BIGINT(20) NOT NULL,
            message_content TEXT,
            total_recipients INT(11) NOT NULL DEFAULT 0,
            success_count INT(11) NOT NULL DEFAULT 0,
            failure_count INT(11) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            form_name VARCHAR(255) DEFAULT NULL,
            page_name VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $sql_recipients = "CREATE TABLE $recipients_table_name (
            id BIGINT(20) NOT NULL AUTO_INCREMENT,
            message_id BIGINT(20) NOT NULL,
            whatsapp_message_id VARCHAR(255) DEFAULT NULL,
            recipient_name VARCHAR(255),
            recipient_phone VARCHAR(50),
            status VARCHAR(255),
            is_read TINYINT(1) DEFAULT 0,
            api_response TEXT,
            personalized_content TEXT,
            PRIMARY KEY  (id),
            KEY message_id (message_id),
            KEY recipient_phone (recipient_phone),
            KEY whatsapp_message_id (whatsapp_message_id)
        ) $charset_collate;";

        dbDelta($sql_history);
        dbDelta($sql_recipients);
    }

    public function register_rest_routes()
    {
        $namespace = 'mh-crm/v1';

        register_rest_route($namespace, '/green-api-proxy/(?P<action>[a-zA-Z0-9_]+)', [
            'methods' => WP_REST_Server::ALLMETHODS,
            'callback' => [$this, 'proxy_to_green_api'],
            'permission_callback' => [$this, 'user_can_manage_crm'],
        ]);

        register_rest_route($namespace, '/save-message-history', [
            'methods' => 'POST',
            'callback' => [$this, 'save_message_history'],
            'permission_callback' => [$this, 'user_can_manage_crm'],
        ]);

        register_rest_route($namespace, '/message-history', [
            'methods' => 'GET',
            'callback' => [$this, 'get_message_history'],
            'permission_callback' => [$this, 'user_can_manage_crm'],
        ]);

        register_rest_route($namespace, '/get-message-recipients/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_message_recipients'],
            'permission_callback' => [$this, 'user_can_manage_crm'],
        ]);

        register_rest_route($namespace, '/bulk-delete-history', [
            'methods' => 'POST',
            'callback' => [$this, 'bulk_delete_message_history'],
            'permission_callback' => [$this, 'user_can_manage_crm'],
        ]);

        register_rest_route($namespace, '/whatsapp/contact-history/(?P<phone>[\d\-\+\(\)\s]+)', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_contact_history_by_phone'],
            'permission_callback' => [$this, 'user_can_manage_crm']
        ]);

        register_rest_route('mh-whatsapp/v1', '/sync-all', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_sync_all_messages'],
            'permission_callback' => [$this, 'user_can_manage_crm'],
        ]);

        register_rest_route('mh-whatsapp/v1', '/sync-contact', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_sync_contact'],
            'permission_callback' => [$this, 'user_can_manage_crm'],
        ]);

        register_rest_route('mh-whatsapp/v1', '/delete-message', [
            'methods'  => 'DELETE',
            'callback' => [$this, 'handle_delete_message'],
            'permission_callback' => [$this, 'user_can_manage_crm'],
        ]);
    }

    public function user_can_manage_crm(WP_REST_Request $request)
    {
        if (!current_user_can('edit_posts')) {
            return new WP_Error('rest_forbidden', __('You do not have permission.', 'm-h-whatsapp-addon'), ['status' => 403]);
        }
        return true;
    }

    public function save_message_history(WP_REST_Request $request)
    {
        global $wpdb;
        $history_table = $wpdb->prefix . 'mh_crm_message_history';
        $params = $request->get_json_params();
        $user_id = get_current_user_id();

        // Validation with safer check for 'recipients'
        if (empty($params['message_content']) || !isset($params['recipients']) || !is_array($params['recipients'])) {
            return new WP_Error('missing_params', 'Missing required parameters or recipients list.', ['status' => 400]);
        }

        // Calculate defaults if not provided (fixes PHP Warnings)
        $recipients_count = count($params['recipients']);
        $total_recipients = isset($params['total_recipients']) ? intval($params['total_recipients']) : $recipients_count;
        $success_count = isset($params['success_count']) ? intval($params['success_count']) : 0;
        $failure_count = isset($params['failure_count']) ? intval($params['failure_count']) : 0;

        $history_data = [
            'user_id' => $user_id,
            'message_content' => sanitize_textarea_field($params['message_content']),
            'total_recipients' => $total_recipients,
            'success_count' => $success_count,
            'failure_count' => $failure_count,
            'created_at' => current_time('mysql', 1),
            'form_name' => isset($params['form_name']) ? sanitize_text_field($params['form_name']) : null,
            'page_name' => isset($params['page_name']) ? sanitize_text_field($params['page_name']) : null,
        ];

        $recipients_table = $wpdb->prefix . 'mh_crm_message_recipients';
        $insert_result = $wpdb->insert($history_table, $history_data);
        $message_id = $wpdb->insert_id;

        if (!$insert_result || !$message_id) {
            return new WP_Error('db_error', 'Could not save message history.', ['status' => 500]);
        }

        foreach ($params['recipients'] as $recipient) {
            $wpdb->insert($recipients_table, [
                'message_id' => $message_id,
                'recipient_name' => sanitize_text_field($recipient['name'] ?? ''),
                'recipient_phone' => sanitize_text_field($recipient['phone'] ?? ''),
                'status' => sanitize_text_field($recipient['status'] ?? 'Unknown'),
                'api_response' => wp_json_encode($recipient['response'] ?? null),
                'personalized_content' => sanitize_textarea_field($recipient['personalized_content'] ?? '')
            ]);
        }
        return new WP_REST_Response(['success' => true, 'message_id' => $message_id], 200);
    }

    public function get_message_history(WP_REST_Request $request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $table_name = $wpdb->prefix . 'mh_crm_message_history';
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return new WP_REST_Response(['messages' => [], 'current_page' => 1, 'total_pages' => 0], 200);
        }
        $page = $request->get_param('page') ? intval($request->get_param('page')) : 1;
        $per_page = 20;
        $offset = ($page - 1) * $per_page;
        $total_items = $wpdb->get_var($wpdb->prepare("SELECT COUNT(id) FROM $table_name WHERE user_id = %d", $user_id));
        $total_pages = ceil($total_items / $per_page);
        $messages = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table_name WHERE user_id = %d ORDER BY created_at DESC LIMIT %d OFFSET %d", $user_id, $per_page, $offset));
        return new WP_REST_Response(['messages' => $messages, 'current_page' => $page, 'total_pages' => $total_pages], 200);
    }

    public function get_message_recipients(WP_REST_Request $request)
    {
        global $wpdb;
        $message_id = intval($request['id']);
        $user_id = get_current_user_id();
        $history_table = $wpdb->prefix . 'mh_crm_message_history';
        $recipients_table = $wpdb->prefix . 'mh_crm_message_recipients';
        $owner_id = $wpdb->get_var($wpdb->prepare("SELECT user_id FROM $history_table WHERE id = %d", $message_id));
        if ($owner_id != $user_id) {
            return new WP_Error('permission_denied', 'You cannot view these recipients.', ['status' => 403]);
        }
        $recipients = $wpdb->get_results($wpdb->prepare("SELECT * FROM $recipients_table WHERE message_id = %d", $message_id));
        return new WP_REST_Response($recipients, 200);
    }

    public function bulk_delete_message_history(WP_REST_Request $request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $ids_to_delete = $request->get_param('ids');
        if (empty($ids_to_delete) || !is_array($ids_to_delete)) {
            return new WP_Error('invalid_params', 'No valid IDs provided for deletion.', ['status' => 400]);
        }
        $ids_to_delete = array_map('intval', $ids_to_delete);
        $id_placeholders = implode(',', array_fill(0, count($ids_to_delete), '%d'));
        $history_table = $wpdb->prefix . 'mh_crm_message_history';
        $recipients_table = $wpdb->prefix . 'mh_crm_message_recipients';
        $wpdb->query($wpdb->prepare("DELETE FROM $recipients_table WHERE message_id IN ($id_placeholders)", $ids_to_delete));
        $wpdb->query($wpdb->prepare("DELETE FROM $history_table WHERE user_id = %d AND id IN ($id_placeholders)", $user_id, $ids_to_delete));
        return new WP_REST_Response(['success' => true], 200);
    }

    public function proxy_to_green_api(WP_REST_Request $request)
    {
        $user_id = get_current_user_id();
        $id_instance = get_user_meta($user_id, 'crm_green_id_instance', true);
        $api_token = get_user_meta($user_id, 'crm_green_api_token', true);
        $action = $request['action'];

        if (empty($id_instance) || empty($api_token)) {
            return new WP_Error('not_configured', 'Green-API credentials are not configured in your user profile.', ['status' => 400]);
        }

        $base_url = "https://api.green-api.com/waInstance{$id_instance}";
        $endpoint_url = "{$base_url}/{$action}/{$api_token}";

        $body = null;
        $status = 0;

        if ($action === 'sendFileByUpload' && $request->get_method() === 'POST') {
            if (empty($_FILES['file'])) {
                return new WP_Error('no_file', 'No file was found in the request.', ['status' => 400]);
            }
            $file_data = $_FILES['file'];
            $cfile = new CURLFile($file_data['tmp_name'], $file_data['type'], $file_data['name']);

            $payload = [
                'chatId' => isset($_POST['chatId']) ? sanitize_text_field($_POST['chatId']) : null,
                'caption' => isset($_POST['caption']) ? sanitize_textarea_field($_POST['caption']) : '',
                'file' => $cfile
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $endpoint_url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 120);

            $body = curl_exec($ch);
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_error = curl_error($ch);
            curl_close($ch);

            if ($curl_error) {
                error_log('WhatsApp API Handler cURL Error on file upload: ' . $curl_error);
                return new WP_Error('proxy_curl_failed', $curl_error, ['status' => 502]);
            }
        } else {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $endpoint_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);

            $method = $request->get_method();
            if ($method === 'POST') {
                curl_setopt($ch, CURLOPT_POST, true);
                $params = $request->get_json_params();
                if ($params) {
                    $payload = wp_json_encode($params);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Content-Length: ' . strlen($payload)]);
                }
            } elseif ($method === 'PUT' || $method === 'PATCH' || $method === 'DELETE') {
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
                $params = $request->get_json_params();
                if ($params) {
                    $payload = wp_json_encode($params);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Content-Length: ' . strlen($payload)]);
                }
            }

            $body = curl_exec($ch);
            $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_error = curl_error($ch);
            curl_close($ch);

            if ($curl_error) {
                error_log('WhatsApp API Handler cURL Error: ' . $curl_error);
                return new WP_Error('proxy_curl_failed', $curl_error, ['status' => 502]);
            }
        }

        // Handle non-JSON success responses (Specifically for deleteMessage)
        if ($status === 200 && $action === 'deleteMessage') {
            $decoded_body = json_decode($body);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return new WP_REST_Response(['result' => true, 'message' => 'Deletion successful, non-JSON response received.'], 200);
            }
        }

        $decoded_body = json_decode($body);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $error_message = 'Received an invalid response from the messaging service.';
            error_log('WhatsApp API Handler Error: ' . $error_message . ' Upstream response snippet: ' . substr(strip_tags($body), 0, 200));
            $error_data = ['code' => 'invalid_upstream_response', 'message' => $error_message, 'data' => ['status' => $status, 'response_snippet' => substr(strip_tags($body), 0, 200)]];
            return new WP_REST_Response($error_data, 502);
        }

        return new WP_REST_Response($decoded_body, $status);
    }

    public function get_contact_history_by_phone(WP_REST_Request $request)
    {
        global $wpdb;
        $phone_number = sanitize_text_field($request['phone']);
        $owner_id = get_current_user_id();

        if (empty($phone_number)) {
            return new WP_Error('no_phone', 'Phone number is required.', ['status' => 400]);
        }

        $search_phone = preg_replace('/\D/', '', $phone_number);
        if (substr($search_phone, 0, 1) === '0') {
            $search_phone = '972' . substr($search_phone, 1);
        } elseif (strpos($search_phone, '972') !== 0 && strlen($search_phone) > 7) {
            $search_phone = '972' . $search_phone;
        }

        $history_table = $wpdb->prefix . 'mh_crm_message_history';
        $recipients_table = $wpdb->prefix . 'mh_crm_message_recipients';

        $query = $wpdb->prepare(
            "SELECT h.created_at, h.form_name, h.page_name, r.status, r.personalized_content, r.api_response 
             FROM {$recipients_table} AS r 
             INNER JOIN {$history_table} AS h ON r.message_id = h.id 
             WHERE h.user_id = %d AND r.recipient_phone = %s 
             ORDER BY h.created_at DESC 
             LIMIT 100",
            $owner_id,
            $search_phone
        );

        $results = $wpdb->get_results($query);

        return new WP_REST_Response($results, 200);
    }

    /**
     * Orchestrates the synchronization of WhatsApp messages into the CRM.
     */
    public function handle_sync_all_messages(WP_REST_Request $request)
    {
        error_log('MH WhatsApp Add-on: handle_sync_all_messages triggered for user ' . get_current_user_id());
        $user_id = get_current_user_id();
        $id_instance = get_user_meta($user_id, 'crm_green_id_instance', true);
        $api_token = get_user_meta($user_id, 'crm_green_api_token', true);

        if (empty($id_instance) || empty($api_token)) {
            return new WP_Error('not_configured', 'Green-API credentials not found.', ['status' => 400]);
        }

        // 1. Get all chats/contacts with activity
        $contacts_response = $this->call_green_api_direct($id_instance, $api_token, 'getContacts', 'GET');
        if (is_wp_error($contacts_response)) return $contacts_response;

        $sync_results = ['chats_processed' => 0, 'messages_synced' => 0, 'new_contacts_created' => 0];
        
        // Limit to top 50 active chats to avoid timeouts in a single request
        $chats = array_slice($contacts_response, 0, 50);

        foreach ($chats as $chat) {
            $chat_id = $chat['id'] ?? '';
            if (empty($chat_id) || strpos($chat_id, '@c.us') === false) continue;

            $this->sync_specific_chat($id_instance, $api_token, $chat_id, $user_id, $sync_results);
        }

        return new WP_REST_Response([
            'success' => true,
            'results' => $sync_results,
            'message' => sprintf('Synced %d messages across %d chats.', $sync_results['messages_synced'], $sync_results['chats_processed'])
        ], 200);
    }

    /**
     * REST Handler for syncing a specific contact.
     */
    public function handle_sync_contact(WP_REST_Request $request)
    {
        $user_id = get_current_user_id();
        $id_instance = get_user_meta($user_id, 'crm_green_id_instance', true);
        $api_token = get_user_meta($user_id, 'crm_green_api_token', true);
        $phone = $request->get_param('phone');

        if (empty($phone)) return new WP_Error('missing_phone', 'Phone number is required.', ['status' => 400]);

        $chat_id = $this->format_to_whatsapp_id($phone);
        $sync_results = ['chats_processed' => 0, 'messages_synced' => 0, 'new_contacts_created' => 0];

        $this->sync_specific_chat($id_instance, $api_token, $chat_id, $user_id, $sync_results);

        return new WP_REST_Response([
            'success' => true,
            'results' => $sync_results,
            'message' => sprintf('Synced %d messages for contact.', $sync_results['messages_synced'])
        ], 200);
    }

    /**
     * Core logic to sync history for a single chat ID.
     */
    private function sync_specific_chat($id_instance, $api_token, $chat_id, $user_id, &$sync_results)
    {
        $sync_results['chats_processed']++;
        
        // Get history for this chat
        $history_params = ['chatId' => $chat_id, 'count' => 100]; // Increased depth for specific syncs
        $history = $this->call_green_api_direct($id_instance, $api_token, 'getChatHistory', 'POST', $history_params);
        
        if (!is_array($history)) return;

        foreach ($history as $msg) {
            $synced = $this->process_synced_message($msg, $user_id, $id_instance, $api_token, $chat_id);
            if ($synced) {
                $sync_results['messages_synced']++;
                if ($synced === 'new_contact') $sync_results['new_contacts_created']++;
            }
        }
    }

    private function format_to_whatsapp_id($phone) {
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (strpos($clean, '@') === false) {
             return $clean . '@c.us';
        }
        return $clean;
    }

    /**
     * REST Handler for deleting a WhatsApp message.
     */
    public function handle_delete_message(WP_REST_Request $request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $id_instance = get_user_meta($user_id, 'crm_green_id_instance', true);
        $api_token = get_user_meta($user_id, 'crm_green_api_token', true);
        
        $chat_id = $request->get_param('chatId');
        $msg_id = $request->get_param('idMessage');

        if (empty($chat_id) || empty($msg_id)) {
            return new WP_Error('missing_params', 'chatId and idMessage are required.', ['status' => 400]);
        }

        // 1. Delete from WhatsApp via Green API
        $response = $this->call_green_api_direct($id_instance, $api_token, 'deleteMessage', 'POST', [
            'chatId' => $chat_id,
            'idMessage' => $msg_id
        ]);

        if (is_wp_error($response)) return $response;

        // 2. Remove from local recipients table
        $table_recipients = $wpdb->prefix . 'mh_crm_message_recipients';
        $wpdb->delete($table_recipients, ['whatsapp_message_id' => $msg_id]);

        // 3. Remove from contact timeline (JSON)
        // Note: This matches by meta.whatsapp_message_id
        $this->remove_from_timeline_by_msg_id($msg_id);

        return new WP_REST_Response(['success' => true, 'message' => 'Message deleted successfully.'], 200);
    }

    private function remove_from_timeline_by_msg_id($msg_id) {
        global $wpdb;
        $table_contacts = $wpdb->prefix . 'mh_crm_contacts';
        
        // This is expensive but necessary since events are in JSON
        // Find contacts who have this message ID in their events
        $contacts = $wpdb->get_results($wpdb->prepare("SELECT id, events FROM $table_contacts WHERE events LIKE %s", '%' . $wpdb->esc_like($msg_id) . '%'));

        foreach ($contacts as $contact) {
            $events = json_decode($contact->events, true);
            if (!is_array($events)) continue;

            $updated_events = array_filter($events, function($e) use ($msg_id) {
                return !isset($e['meta']['whatsapp_message_id']) || $e['meta']['whatsapp_message_id'] !== $msg_id;
            });

            if (count($events) !== count($updated_events)) {
                $wpdb->update($table_contacts, ['events' => json_encode(array_values($updated_events))], ['id' => $contact->id]);
            }
        }
    }

    /**
     * Process a single message from WhatsApp history and sync it to the CRM.
     */
    private function process_synced_message($msg, $user_id, $id_instance, $api_token, $chat_id)
    {
        global $wpdb;
        $msg_id = $msg['idMessage'] ?? '';
        if (empty($msg_id)) return false;

        // Check if message already exists in our recipients table
        $table_recipients = $wpdb->prefix . 'mh_crm_message_recipients';
        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_recipients WHERE whatsapp_message_id = %s", $msg_id));
        if ($exists) return false;

        $is_incoming = ($msg['type'] === 'incoming');
        $text = $msg['textMessage'] ?? '';
        $timestamp = $msg['timestamp'] ?? time();
        $sender_id = $msg['senderId'] ?? '';
        $phone = str_replace('@c.us', '', $is_incoming ? $sender_id : ($msg['chatId'] ?? ''));

        if (empty($phone)) return false;

        // Ensure contact exists in CRM
        $contact_info = $this->ensure_crm_contact($phone, $chat_id, $user_id, $id_instance, $api_token);
        $contact_id = $contact_info['id'];
        $is_new_contact = $contact_info['is_new'] ?? false;

        // Add to timeline
        $this->update_contact_timeline($contact_id, $text, $timestamp, $is_incoming, $msg_id, $chat_id);

        // Save to local WhatsApp history tables
        $this->save_to_local_history($user_id, $contact_id, $phone, $text, $msg_id, $msg, $is_incoming);

        return $is_new_contact ? 'new_contact' : true;
    }

    private function ensure_crm_contact($phone, $chat_id, $user_id, $id_instance, $api_token)
    {
        global $wpdb;
        $table_contacts = $wpdb->prefix . 'mh_crm_contacts';
        
        // Try to find by phone
        $contact = $wpdb->get_row($wpdb->prepare("SELECT id, events FROM $table_contacts WHERE owner_id = %d AND (conta_phone = %s OR conta_phone LIKE %s)", $user_id, $phone, '%' . $phone));
        
        if ($contact) {
            return ['id' => $contact->id, 'is_new' => false, 'events' => $contact->events];
        }

        // Not found, fetch info from Green API
        $info = $this->call_green_api_direct($id_instance, $api_token, 'getContactInfo', 'POST', ['chatId' => $chat_id]);
        $name = $info['name'] ?? $info['contactName'] ?? $phone;

        // Create new contact
        $wpdb->insert($table_contacts, [
            'owner_id' => $user_id,
            'conta_name' => $name,
            'conta_phone' => $phone,
            'status' => 'active',
            'lead_source' => 'WhatsApp Sync',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        ]);

        return ['id' => $wpdb->insert_id, 'is_new' => true, 'events' => '[]'];
    }

    private function update_contact_timeline($contact_id, $text, $timestamp, $is_incoming, $whatsapp_id = '', $chat_id = '')
    {
        global $wpdb;
        $table_contacts = $wpdb->prefix . 'mh_crm_contacts';
        
        $current_events_json = $wpdb->get_var($wpdb->prepare("SELECT events FROM $table_contacts WHERE id = %d", $contact_id));
        $events = json_decode($current_events_json, true) ?: [];

        $new_event = [
            'time' => date('Y-m-d\TH:i', $timestamp),
            'title' => $is_incoming ? 'הודעה נכנסת מוואטסאפ' : 'הודעה יוצאת מוואטסאפ',
            'text' => $text,
            'icon' => 'whatsapp',
            'meta' => [
                'whatsapp_message_id' => $whatsapp_id,
                'chat_id' => $chat_id
            ]
        ];

        // Check for duplicates in timeline by content and time (crude but works for history)
        foreach ($events as $existing) {
            if ($existing['time'] === $new_event['time'] && $existing['text'] === $new_event['text']) {
                return; 
            }
        }

        array_unshift($events, $new_event);
        $wpdb->update($table_contacts, ['events' => json_encode($events)], ['id' => $contact_id]);
    }

    private function save_to_local_history($user_id, $contact_id, $phone, $text, $whatsapp_id, $raw_msg, $is_incoming)
    {
        global $wpdb;
        $table_history = $wpdb->prefix . 'mh_crm_message_history';
        $table_recipients = $wpdb->prefix . 'mh_crm_message_recipients';

        $wpdb->insert($table_history, [
            'user_id' => $user_id,
            'message_content' => $text,
            'total_recipients' => 1,
            'success_count' => 1,
            'created_at' => date('Y-m-d H:i:s', $raw_msg['timestamp'] ?? time())
        ]);

        $local_msg_id = $wpdb->insert_id;

        $wpdb->insert($table_recipients, [
            'message_id' => $local_msg_id,
            'whatsapp_message_id' => $whatsapp_id,
            'recipient_phone' => $phone,
            'status' => $raw_msg['status'] ?? 'delivered',
            'is_read' => (isset($raw_msg['status']) && $raw_msg['status'] === 'read') ? 1 : 0,
            'api_response' => json_encode(['idMessage' => $whatsapp_id]),
            'personalized_content' => $text
        ]);
        
        // Update contact last read status
        $wpdb->update($wpdb->prefix . 'mh_crm_contacts', ['last_message_read_status' => $raw_msg['status'] ?? 'unknown'], ['id' => $contact_id]);
    }

    private function call_green_api_direct($id_instance, $api_token, $action, $method = 'POST', $params = [])
    {
        $url = "https://api.green-api.com/waInstance{$id_instance}/{$action}/{$api_token}";
        
        $args = [
            'method' => $method,
            'timeout' => 30,
            'headers' => ['Content-Type' => 'application/json']
        ];

        if ($method === 'POST' && !empty($params)) {
            $args['body'] = json_encode($params);
        }

        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) return $response;

        $body = wp_remote_retrieve_body($response);
        return json_decode($body, true);
    }
}