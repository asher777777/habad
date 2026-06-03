<?php
/**
 * File: class-crm-api-handlers.php
 * Description: Handles all core REST API endpoints for the M.H CRM Plugin.
 * @package M_H_CRM_Plugin
 * @version 27.0.0
 * --- CHANGELOG V27.0.0 ---
 * - CRITICAL FIX: Made the `format_db_row_as_contact` function robust against missing database columns. It now checks for property existence before access, preventing 500 errors if a schema migration hasn't completed.
 * - REFACTOR: Removed the redundant `get_contact_history_by_phone` function and its REST route, as this logic was correctly moved to the WhatsApp add-on.
 */

if (!defined('ABSPATH')) {
    exit;
}

class CRM_API_Handlers
{

    private $db_manager;
    private $contacts_table;

    public function __construct(MH_Database_Manager $db_manager)
    {
        global $wpdb;
        $this->db_manager = $db_manager;
        $this->contacts_table = $wpdb->prefix . 'mh_crm_contacts';
    }

    public function init()
    {
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    private function format_db_row_as_contact($row)
    {
        if (!is_object($row) && !is_array($row)) {
            return null;
        }
        $row = (object) $row;

        return [
            'id' => property_exists($row, 'id') ? (int) $row->id : null,
            'conta_name' => property_exists($row, 'conta_name') ? $row->conta_name : null,
            'f_m' => property_exists($row, 'f_m') ? $row->f_m : null,
            'gender' => property_exists($row, 'gender') ? $row->gender : null,
            'birth_date' => property_exists($row, 'birth_date') ? $row->birth_date : null,
            'email' => property_exists($row, 'email') ? $row->email : null,
            'conta_phone' => property_exists($row, 'conta_phone') ? $row->conta_phone : null,
            'work_phone' => property_exists($row, 'work_phone') ? $row->work_phone : null,
            'website' => property_exists($row, 'website') ? $row->website : null,
            'company_name' => property_exists($row, 'company_name') ? $row->company_name : null,
            'job_title' => property_exists($row, 'job_title') ? $row->job_title : null,
            'lead_source' => property_exists($row, 'lead_source') ? $row->lead_source : null,
            'notes' => property_exists($row, 'notes') ? $row->notes : null,
            'tg1' => property_exists($row, 'tg1') ? $row->tg1 : null,
            'tg2' => property_exists($row, 'tg2') ? $row->tg2 : null,
            'tg3' => property_exists($row, 'tg3') ? $row->tg3 : null,
            'city' => property_exists($row, 'mh_crm_city') ? $row->mh_crm_city : null,
            'street' => property_exists($row, 'mh_crm_street') ? $row->mh_crm_street : null,
            'status' => property_exists($row, 'status') ? $row->status : 'active',
            'owner_id' => property_exists($row, 'owner_id') ? (int) $row->owner_id : null,

            'events' => (property_exists($row, 'events') && !empty($row->events)) ? json_decode($row->events, true) : [],
            'form_submissions' => (property_exists($row, 'form_submissions') && !empty($row->form_submissions)) ? json_decode($row->form_submissions, true) : [],

            // Defensively access new tracking fields
            'last_form_name' => property_exists($row, 'last_form_name') ? $row->last_form_name : null,
            'last_form_page' => property_exists($row, 'last_form_page') ? $row->last_form_page : null,
            'last_form_submission_date' => property_exists($row, 'last_form_submission_date') ? $row->last_form_submission_date : null,
            'last_message_read_status' => property_exists($row, 'last_message_read_status') ? $row->last_message_read_status : 'unknown',
            'total_spent' => property_exists($row, 'total_spent') ? (float) $row->total_spent : 0.00,
            'order_count' => property_exists($row, 'order_count') ? (int) $row->order_count : 0,
            'last_order_date' => property_exists($row, 'last_order_date') ? $row->last_order_date : null,
        ];
    }

    public function register_rest_routes()
    {
        $namespace = 'mh-crm/v1';

        register_rest_route($namespace, '/contacts', [
            ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_contacts'], 'permission_callback' => [$this, 'user_can_manage_crm']],
            ['methods' => WP_REST_Server::CREATABLE, 'callback' => [$this, 'create_contact'], 'permission_callback' => [$this, 'user_can_manage_crm']],
        ]);

        register_rest_route($namespace, '/contacts/all', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_all_contacts_shim'],
            'permission_callback' => [$this, 'user_can_manage_crm']
        ]);

        register_rest_route($namespace, '/contacts/import', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'import_contacts'],
            'permission_callback' => [$this, 'user_can_manage_crm']
        ]);

        register_rest_route($namespace, '/contacts/(?P<id>\d+)', [
            ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_contact'], 'permission_callback' => [$this, 'user_can_manage_crm']],
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [$this, 'update_contact'], 'permission_callback' => [$this, 'user_can_manage_crm']],
            ['methods' => WP_REST_Server::DELETABLE, 'callback' => [$this, 'delete_contact'], 'permission_callback' => [$this, 'user_can_manage_crm']],
        ]);

        register_rest_route($namespace, '/contacts/bulk-action', [
            'methods' => WP_REST_Server::EDITABLE, // Allow POST, PUT, PATCH to handle cached clients
            'callback' => [$this, 'handle_bulk_action'],
            'permission_callback' => [$this, 'user_can_manage_crm']
        ]);

        register_rest_route($namespace, '/contacts/stats', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_contacts_stats'],
            'permission_callback' => [$this, 'user_can_manage_crm']
        ]);

        register_rest_route($namespace, '/contacts/filters', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_available_filters'],
            'permission_callback' => [$this, 'user_can_manage_crm']
        ]);

        register_rest_route($namespace, '/contacts/orders', ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_contact_orders'], 'permission_callback' => [$this, 'user_can_manage_crm']]);
        register_rest_route($namespace, '/contacts/order/(?P<id>\d+)', ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_order_details'], 'permission_callback' => [$this, 'user_can_manage_crm']]);

        // Endpoint for interactive WooCommerce analytics drilldown
        register_rest_route($namespace, '/analytics/woocommerce-drilldown', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_woocommerce_drilldown_data'],
            'permission_callback' => [$this, 'user_can_manage_crm']
        ]);
    }

    public function user_can_manage_crm()
    {
        return current_user_can('edit_posts');
    }

    public function get_available_filters(WP_REST_Request $request)
    {
        global $wpdb;
        $owner_id = get_current_user_id();

        // Get unique tags across tg1, tg2, tg3
        $tags_query = $wpdb->prepare("
            SELECT DISTINCT tag FROM (
                SELECT tg1 AS tag FROM {$this->contacts_table} WHERE owner_id = %d AND tg1 IS NOT NULL AND tg1 != ''
                UNION
                SELECT tg2 AS tag FROM {$this->contacts_table} WHERE owner_id = %d AND tg2 IS NOT NULL AND tg2 != ''
                UNION
                SELECT tg3 AS tag FROM {$this->contacts_table} WHERE owner_id = %d AND tg3 IS NOT NULL AND tg3 != ''
            ) AS combined_tags ORDER BY tag ASC
        ", $owner_id, $owner_id, $owner_id);
        $tags = $wpdb->get_col($tags_query);

        // Get unique cities
        $cities_query = $wpdb->prepare("SELECT DISTINCT mh_crm_city FROM {$this->contacts_table} WHERE owner_id = %d AND mh_crm_city IS NOT NULL AND mh_crm_city != '' ORDER BY mh_crm_city ASC", $owner_id);
        $cities = $wpdb->get_col($cities_query);

        // Get unique lead sources
        $sources_query = $wpdb->prepare("SELECT DISTINCT lead_source FROM {$this->contacts_table} WHERE owner_id = %d AND lead_source IS NOT NULL AND lead_source != '' ORDER BY lead_source ASC", $owner_id);
        $sources = $wpdb->get_col($sources_query);

        return new WP_REST_Response([
            'tags' => $tags,
            'cities' => $cities,
            'lead_sources' => $sources
        ], 200);
    }

    public function get_contacts(WP_REST_Request $request)
    {
        global $wpdb;
        $params = $request->get_params();
        $owner_id = get_current_user_id();

        // Fix for "undefined" string sent by some clients
        $page_param = isset($params['page']) ? $params['page'] : 1;
        if (!is_numeric($page_param)) {
            $page = 1;
        } else {
            $page = absint($page_param);
        }

        if ($page < 1) {
            $page = 1;
        }
        $per_page = isset($params['per_page']) && intval($params['per_page']) > 0 ? absint($params['per_page']) : -1;
        $offset = ($page - 1) * $per_page;
        $status = isset($params['status']) ? sanitize_text_field($params['status']) : 'active';
        $search = isset($params['search']) ? sanitize_text_field($params['search']) : '';
        $tag_filter = isset($params['tag_filter']) ? sanitize_text_field($params['tag_filter']) : '';
        $city_filter = isset($params['city_filter']) ? sanitize_text_field($params['city_filter']) : '';
        $lead_source_filter = isset($params['lead_source_filter']) ? sanitize_text_field($params['lead_source_filter']) : '';
        $last_form_name = isset($params['last_form_name']) ? sanitize_text_field($params['last_form_name']) : '';

        $orderby = isset($params['orderby']) ? sanitize_text_field($params['orderby']) : 'id';
        $order = isset($params['order']) ? strtoupper(sanitize_text_field($params['order'])) : 'DESC';

        // Whitelist allowed sort columns
        $allowed_sort_columns = ['id', 'conta_name', 'f_m', 'conta_phone', 'email', 'status', 'last_form_submission_date', 'last_order_date', 'order_count', 'total_spent'];
        if (!in_array($orderby, $allowed_sort_columns)) {
            $orderby = 'id';
        }
        if (!in_array($order, ['ASC', 'DESC'])) {
            $order = 'DESC';
        }

        $where_clauses = [$wpdb->prepare('owner_id = %d', $owner_id), $wpdb->prepare('status = %s', $status)];
        if (!empty($search)) {
            $words = array_filter(explode(' ', $search));
            $word_clauses = [];
            
            $table_history = $wpdb->prefix . 'mh_crm_message_history';
            $table_recipients = $wpdb->prefix . 'mh_crm_message_recipients';
            $table_contacts = $this->contacts_table;

            foreach ($words as $word) {
                $search_term = '%' . $wpdb->esc_like($word) . '%';
                
                // For each word, check if it matches ANY contact field OR ANY message content associated with that contact
                // Using RIGHT(..., 9) for phone matching to handle differences between 05x and 972x prefixes
                $word_clauses[] = $wpdb->prepare(
                    "(conta_name LIKE %s OR f_m LIKE %s OR conta_phone LIKE %s OR email LIKE %s OR mh_crm_city LIKE %s OR mh_crm_street LIKE %s OR tg1 LIKE %s OR tg2 LIKE %s OR tg3 LIKE %s OR id IN (
                        SELECT DISTINCT c_sub.id 
                        FROM {$table_contacts} AS c_sub
                        INNER JOIN {$table_recipients} AS r ON (RIGHT(REPLACE(c_sub.conta_phone, '-', ''), 9) = RIGHT(REPLACE(r.recipient_phone, '-', ''), 9))
                        INNER JOIN {$table_history} AS h ON r.message_id = h.id
                        WHERE h.message_content LIKE %s OR r.personalized_content LIKE %s
                    ))",
                    $search_term, $search_term, $search_term, $search_term, $search_term, $search_term, $search_term, $search_term, $search_term, $search_term, $search_term
                );
            }
            
            if (!empty($word_clauses)) {
                $where_clauses[] = '(' . implode(' AND ', $word_clauses) . ')';
            }
        }
        if (!empty($tag_filter)) {
            $where_clauses[] = $wpdb->prepare("(tg1 = %s OR tg2 = %s OR tg3 = %s)", $tag_filter, $tag_filter, $tag_filter);
        }
        if (!empty($city_filter)) {
            $where_clauses[] = $wpdb->prepare("mh_crm_city = %s", $city_filter);
        }
        if (!empty($lead_source_filter)) {
            $where_clauses[] = $wpdb->prepare("lead_source = %s", $lead_source_filter);
        }

        if (!empty($last_form_name)) {
            $where_clauses[] = $wpdb->prepare('last_form_name = %s', $last_form_name);
        }

        $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);

        $total_query = "SELECT COUNT(id) FROM {$this->contacts_table} {$where_sql}";
        $total_contacts = $wpdb->get_var($total_query);

        $limit_sql = ($per_page > 0) ? $wpdb->prepare("LIMIT %d OFFSET %d", $per_page, $offset) : '';
        $results_query = "SELECT * FROM {$this->contacts_table} {$where_sql} ORDER BY {$orderby} {$order} {$limit_sql}";
        $results = $wpdb->get_results($results_query);



        $contacts = array_map([$this, 'format_db_row_as_contact'], $results);

        $response = new WP_REST_Response($contacts);
        $response->header('X-WP-Total', $total_contacts);
        $response->header('X-WP-TotalPages', ($per_page > 0) ? ceil($total_contacts / $per_page) : 1);

        // DEBUG: Trace SQL
        $response->header('X-Debug-Query', $results_query);
        $response->header('X-Debug-Params', json_encode($params));
        $response->header('X-Debug-Where', $where_sql);

        return $response;
    }

    public function get_all_contacts_shim(WP_REST_Request $request)
    {
        $new_request = new WP_REST_Request('GET', '/mh-crm/v1/contacts');
        $new_request->set_query_params(['per_page' => -1, 'status' => 'active']);
        $response = $this->get_contacts($new_request);
        return new WP_REST_Response($response->get_data(), 200);
    }

    public function get_contact(WP_REST_Request $request)
    {
        global $wpdb;
        $id = (int) $request['id'];
        $owner_id = get_current_user_id();

        $contact_row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->contacts_table} WHERE id = %d AND owner_id = %d", $id, $owner_id));

        if (!$contact_row) {
            return new WP_Error('not_found', 'Contact not found or you do not have permission to view it.', ['status' => 404]);
        }
        return new WP_REST_Response($this->format_db_row_as_contact($contact_row), 200);
    }

    public function create_contact(WP_REST_Request $request)
    {
        global $wpdb;
        $owner_id = get_current_user_id();

        if (!$request->has_param('conta_name') || !$request->has_param('conta_phone')) {
            return new WP_Error('missing_fields', 'Name and phone are required.', ['status' => 400]);
        }

        $db_data = ['owner_id' => $owner_id];
        $field_map = [
            'conta_name'   => 'conta_name',
            'f_m'          => 'f_m',
            'conta_phone'  => 'conta_phone',
            'email'        => 'email',
            'gender'       => 'gender',
            'city'         => 'mh_crm_city',
            'street'       => 'mh_crm_street',
            'tg1'          => 'tg1',
            'tg2'          => 'tg2',
            'tg3'          => 'tg3',
            'company_name' => 'company_name',
            'job_title'    => 'job_title',
            'lead_source'  => 'lead_source',
            'work_phone'   => 'work_phone',
            'website'      => 'website',
            'birth_date'   => 'birth_date',
            'last_form_name' => 'last_form_name',
            'last_form_page' => 'last_form_page',
            'last_form_submission_date' => 'last_form_submission_date',
            'notes'        => 'notes',
            'status'       => 'status'
        ];

        foreach ($field_map as $json_key => $db_column) {
            if ($request->has_param($json_key)) {
                $value = $request->get_param($json_key);
                if ($db_column === 'notes') {
                    $db_data[$db_column] = wp_kses_post($value);
                } else {
                    $sanitized_value = sanitize_text_field($value);
                    if ($db_column === 'birth_date' && empty($sanitized_value)) {
                        $sanitized_value = null;
                    }
                    $db_data[$db_column] = $sanitized_value;
                }
            }
        }

        if (!isset($db_data['status'])) {
            $db_data['status'] = 'active';
        }

        $result = $wpdb->insert($this->contacts_table, $db_data);
        
        if ($result === false) {
            error_log("CRM Create Error: " . $wpdb->last_error);
            return new WP_Error('db_error', 'Could not create contact. DB Error: ' . $wpdb->last_error, ['status' => 500]);
        }

        $new_id = $wpdb->insert_id;
        $new_contact_row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->contacts_table} WHERE id = %d", $new_id));
        return new WP_REST_Response($this->format_db_row_as_contact($new_contact_row), 201);
    }

    public function update_contact(WP_REST_Request $request)
    {
        global $wpdb;
        $id = (int) $request['id'];
        $data = $request->get_params();
        $owner_id = get_current_user_id();

        $current_owner = $wpdb->get_var($wpdb->prepare("SELECT owner_id FROM {$this->contacts_table} WHERE id = %d", $id));
        if ($current_owner != $owner_id) {
            return new WP_Error('forbidden', 'You do not have permission to edit this contact.', ['status' => 403]);
        }

        $update_data = [];
        $field_map = [
            'conta_name'   => 'conta_name',
            'f_m'          => 'f_m',
            'conta_phone'  => 'conta_phone',
            'email'        => 'email',
            'gender'       => 'gender',
            'city'         => 'mh_crm_city',
            'street'       => 'mh_crm_street',
            'tg1'          => 'tg1',
            'tg2'          => 'tg2',
            'tg3'          => 'tg3',
            'company_name' => 'company_name',
            'job_title'    => 'job_title',
            'lead_source'  => 'lead_source',
            'work_phone'   => 'work_phone',
            'website'      => 'website',
            'birth_date'   => 'birth_date',
            'last_form_name' => 'last_form_name',
            'notes'        => 'notes',
            'status'       => 'status'
        ];

        foreach ($field_map as $json_key => $db_column) {
            // Check in both JSON params and general params
            if ($request->has_param($json_key)) {
                $value = $request->get_param($json_key);
                
                if ($db_column === 'notes') {
                    $update_data[$db_column] = wp_kses_post($value);
                } else {
                    $sanitized_value = sanitize_text_field($value);
                    if ($db_column === 'birth_date') {
                        if (empty($sanitized_value) || $sanitized_value === '0000-00-00') {
                            $sanitized_value = null;
                        } else {
                            // Basic YYYY-MM-DD validation
                            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $sanitized_value)) {
                                $sanitized_value = null; // Ignore invalid formats
                            }
                        }
                    }
                    $update_data[$db_column] = $sanitized_value;
                }
            }
        }

        if (isset($data['events']) && is_array($data['events'])) {
            $sanitized_events = [];
            foreach ($data['events'] as $event) {
                if (!empty($event['title']) || !empty($event['text'])) {
                    $sanitized_events[] = [
                        'time' => sanitize_text_field($event['time']),
                        'title' => sanitize_text_field($event['title']),
                        'text' => sanitize_textarea_field($event['text'])
                    ];
                }
            }
            $update_data['events'] = json_encode($sanitized_events);
        }

        if (!empty($update_data)) {
            error_log("CRM Update Data for ID $id: " . print_r($update_data, true));
            $result = $wpdb->update($this->contacts_table, $update_data, ['id' => $id]);
            error_log("CRM Update Result: " . var_export($result, true));

            if ($result === false) {
                error_log("CRM Update Error: " . $wpdb->last_error);
                return new WP_Error('db_error', 'Could not update contact. DB Error: ' . $wpdb->last_error, ['status' => 500]);
            }
        } else {
            error_log("CRM Update Data Empty for ID $id. Incoming data: " . print_r($data, true));
        }

        $updated_contact_row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->contacts_table} WHERE id = %d", $id));
        return new WP_REST_Response($this->format_db_row_as_contact($updated_contact_row), 200);
    }

    public function delete_contact(WP_REST_Request $request)
    {
        global $wpdb;
        $id = (int) $request['id'];
        $owner_id = get_current_user_id();

        $result = $wpdb->delete($this->contacts_table, ['id' => $id, 'owner_id' => $owner_id]);

        if ($result === false) {
            return new WP_Error('db_error', 'Could not delete contact.', ['status' => 500]);
        }
        if ($result === 0) {
            return new WP_Error('not_found', 'Contact not found or you do not have permission.', ['status' => 404]);
        }

        return new WP_REST_Response(['deleted' => true, 'id' => $id], 200);
    }

    public function handle_bulk_action(WP_REST_Request $request)
    {
        global $wpdb;
        $params = $request->get_json_params();
        $action = $params['action'];
        $ids = array_map('absint', $params['ids']);
        $owner_id = get_current_user_id();

        if (empty($ids)) {
            return new WP_Error('no_ids', 'No contact IDs provided.', ['status' => 400]);
        }

        $ids_placeholder = implode(',', array_fill(0, count($ids), '%d'));
        $processed_count = 0;

        $sql_args = array_merge([$owner_id], $ids);
        $debug_sql = "";

        switch ($action) {
            case 'trash':
                $debug_sql = $wpdb->prepare("UPDATE {$this->contacts_table} SET status = 'trashed' WHERE owner_id = %d AND id IN ({$ids_placeholder})", $sql_args);
                $processed_count = $wpdb->query($debug_sql);
                break;
            case 'restore':
                $debug_sql = $wpdb->prepare("UPDATE {$this->contacts_table} SET status = 'active' WHERE owner_id = %d AND id IN ({$ids_placeholder})", $sql_args);
                $processed_count = $wpdb->query($debug_sql);
                break;
            case 'delete_permanent':
            case 'delete-permanent': // Handle both formats
                $debug_sql = $wpdb->prepare("DELETE FROM {$this->contacts_table} WHERE owner_id = %d AND status = 'trashed' AND id IN ({$ids_placeholder})", $sql_args);
                $processed_count = $wpdb->query($debug_sql);
                break;
            default:
                return new WP_Error('invalid_action', 'Invalid bulk action: ' . $action, ['status' => 400]);
        }

        // DEBUG LOGGING START
        $log_file = dirname(__DIR__) . '/crm-debug.log';
        $log_entry = "--------------------------------\n";
        $log_entry .= "Timestamp: " . date('Y-m-d H:i:s') . "\n";
        $log_entry .= "Function: handle_bulk_action\n";
        $log_entry .= "Owner ID: " . $owner_id . "\n";
        $log_entry .= "Action: " . $action . "\n";
        $log_entry .= "IDs: " . print_r($ids, true) . "\n";
        $log_entry .= "SQL: " . $debug_sql . "\n";
        $log_entry .= "Processed Count: " . $processed_count . "\n";
        $log_entry .= "DB Last Error: " . $wpdb->last_error . "\n";
        file_put_contents($log_file, $log_entry, FILE_APPEND);
        // DEBUG LOGGING END

        return new WP_REST_Response(['success' => true, 'processed_count' => $processed_count], 200);
    }

    public function import_contacts(WP_REST_Request $request)
    {
        global $wpdb;
        $body = $request->get_json_params();
        $contacts_data = $body['contacts'] ?? [];
        $owner_id = get_current_user_id();
        $results = ['created' => 0, 'updated' => 0, 'skipped' => 0];

        if (!is_array($contacts_data)) {
            return new WP_Error('invalid_data', 'Data must be an array of contacts.', ['status' => 400]);
        }

        $field_map = [
            'conta_name' => 'conta_name',
            'f_m' => 'f_m',
            'conta_phone' => 'conta_phone',
            'email' => 'email',
            'gender' => 'gender',
            'city' => 'mh_crm_city',
            'street' => 'mh_crm_street',
            'tg1' => 'tg1',
            'tg2' => 'tg2',
            'tg3' => 'tg3',
            'company_name' => 'company_name',
            'job_title' => 'job_title',
            'lead_source' => 'lead_source',
            'work_phone' => 'work_phone',
            'website' => 'website',
            'birth_date' => 'birth_date',
            'notes' => 'notes',
            'status' => 'status'
        ];

        foreach ($contacts_data as $contact_data) {
            // First, try explicitly provided ID (Column A)
            $existing_id = !empty($contact_data['id']) ? (int) $contact_data['id'] : 0;
            
            // If no explicit ID, try finding by phone number
            if (!$existing_id && !empty($contact_data['conta_phone'])) {
                $existing_id = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$this->contacts_table} WHERE owner_id = %d AND conta_phone = %s", $owner_id, $contact_data['conta_phone']));
            }
            
            // Require name only for NEW contacts. For updating existing contacts (found by ID or Phone), it's optional.
            if (!$existing_id && empty($contact_data['conta_name'])) {
                $results['skipped']++;
                continue;
            }

            $db_data = ['owner_id' => $owner_id];
            foreach ($field_map as $json_key => $db_column) {
                if (isset($contact_data[$json_key]) && $contact_data[$json_key] !== '') {
                    $db_data[$db_column] = sanitize_text_field($contact_data[$json_key]);
                }
            }

            if ($existing_id) {
                unset($db_data['owner_id']); // Safety: don't alter owner_id on update
                // Validate that the existing record belongs to this owner
                $check_owner = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$this->contacts_table} WHERE owner_id = %d AND id = %d", $owner_id, $existing_id));
                if ($check_owner) {
                    if (!empty($db_data)) {
                        $wpdb->update($this->contacts_table, $db_data, ['id' => $existing_id]);
                        $results['updated']++;
                    } else {
                        // Support case where a row has an ID but nothing to update
                        $results['skipped']++;
                    }
                } else {
                    $results['skipped']++;
                }
            } else {
                if (!isset($db_data['status'])) {
                    $db_data['status'] = 'active';
                }
                $wpdb->insert($this->contacts_table, $db_data);
                if ($wpdb->insert_id) {
                    $results['created']++;
                } else {
                    $results['skipped']++;
                }
            }
        }
        return new WP_REST_Response(['success' => true, 'results' => $results], 200);
    }

    public function get_contacts_stats(WP_REST_Request $request)
    {
        global $wpdb;
        $owner_id = get_current_user_id();

        $active_count = $wpdb->get_var($wpdb->prepare("SELECT COUNT(id) FROM {$this->contacts_table} WHERE owner_id = %d AND status = 'active'", $owner_id));
        $trashed_count = $wpdb->get_var($wpdb->prepare("SELECT COUNT(id) FROM {$this->contacts_table} WHERE owner_id = %d AND status = 'trashed'", $owner_id));



        $stats = [
            'active' => (int) $active_count,
            'trashed' => (int) $trashed_count,
        ];

        return new WP_REST_Response($stats, 200);
    }

    public function get_contact_orders(WP_REST_Request $request)
    {
        if (!class_exists('WooCommerce'))
            return new WP_Error('woocommerce_not_active', 'WooCommerce is not active.', ['status' => 503]);
        $phone = sanitize_text_field($request->get_param('phone'));
        $email = sanitize_email($request->get_param('email'));
        if (empty($phone) && empty($email))
            return new WP_Error('missing_params', 'Either phone or email is required.', ['status' => 400]);
        $args = ['limit' => -1, 'orderby' => 'date', 'order' => 'DESC'];
        if (!empty($email))
            $args['customer'] = $email;
        elseif (!empty($phone))
            $args['billing_phone'] = $phone;
        $orders_query = new WC_Order_Query($args);
        $orders = $orders_query->get_orders();
        $formatted_orders = [];
        $total_value = 0;
        if (!empty($orders)) {
            foreach ($orders as $order) {
                if ($order->is_paid()) {
                    $total_value += $order->get_total();
                }
                $formatted_orders[] = ['id' => $order->get_id(), 'date' => $order->get_date_created()->format('Y-m-d H:i:s'), 'status' => $order->get_status(), 'total' => $order->get_formatted_order_total(), 'url' => $order->get_edit_order_url()];
            }
        }
        $order_count = count($orders);
        $response_data = ['orders' => $formatted_orders, 'stats' => ['total_orders' => $order_count, 'total_value' => wc_price($total_value), 'average_value' => ($order_count > 0) ? wc_price($total_value / $order_count) : wc_price(0)]];
        return new WP_REST_Response($response_data, 200);
    }

    public function get_order_details(WP_REST_Request $request)
    {
        if (!class_exists('WooCommerce'))
            return new WP_Error('woocommerce_not_active', 'WooCommerce is not active.', ['status' => 503]);
        $order_id = (int) $request['id'];
        $order = wc_get_order($order_id);
        if (!$order)
            return new WP_Error('order_not_found', 'Order not found.', ['status' => 404]);
        $line_items = [];
        foreach ($order->get_items() as $item_id => $item) {
            $line_items[] = ['name' => $item->get_name(), 'quantity' => $item->get_quantity(), 'total' => wc_price($item->get_total())];
        }
        $details = ['id' => $order->get_id(), 'status' => $order->get_status(), 'date_created' => $order->get_date_created()->format('Y-m-d H:i'), 'billing' => $order->get_formatted_billing_address(), 'shipping' => $order->get_formatted_shipping_address(), 'payment_method' => $order->get_payment_method_title(), 'items' => $line_items, 'totals' => $order->get_order_item_totals()];
        return new WP_REST_Response($details, 200);
    }

    public function get_woocommerce_drilldown_data(WP_REST_Request $request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce is not active.', ['status' => 503]);
        }

        global $wpdb;
        $type = $request->get_param('type') ?: 'orders';
        $start_date_gmt = gmdate('Y-m-d H:i:s', strtotime('-30 days'));
        $order_statuses = ['wc-completed', 'wc-processing'];
        $order_statuses_placeholder = implode("','", array_map('esc_sql', $order_statuses));

        $hpos_enabled = class_exists('\Automattic\WooCommerce\Utilities\OrderUtil') && \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled();

        $order_ids = [];
        if ($hpos_enabled) {
            $order_ids = $wpdb->get_col($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}wc_orders
                 WHERE status IN ('{$order_statuses_placeholder}') AND date_created_gmt >= %s",
                $start_date_gmt
            ));
        } else {
            $order_ids = $wpdb->get_col($wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts}
                 WHERE post_type = 'shop_order' AND post_status IN ('{$order_statuses_placeholder}') AND post_date_gmt >= %s",
                $start_date_gmt
            ));
        }

        if (empty($order_ids)) {
            return new WP_REST_Response([], 200);
        }

        $results = [];
        if ($type === 'orders' || $type === 'sales') {
            foreach ($order_ids as $order_id) {
                $order = wc_get_order($order_id);
                if ($order) {
                    $contact_name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());

                    $crm_contact_id = $wpdb->get_var($wpdb->prepare(
                        "SELECT id FROM {$this->contacts_table} WHERE conta_phone = %s OR email = %s LIMIT 1",
                        $order->get_billing_phone(),
                        $order->get_billing_email()
                    ));

                    $results[] = [
                        'order_id' => $order->get_id(),
                        'contact_name' => $contact_name,
                        'crm_contact_id' => $crm_contact_id ? (int) $crm_contact_id : null,
                        'date' => $order->get_date_created()->format('Y-m-d H:i'),
                        'total' => $order->get_total(),
                        'currency' => get_woocommerce_currency_symbol()
                    ];
                }
            }
        }

        return new WP_REST_Response($results, 200);
    }
}