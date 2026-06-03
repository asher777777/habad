<?php
require_once('../../../wp-load.php');
global $wpdb;
$table = $wpdb->prefix . 'mh_crm_contacts';
$columns = $wpdb->get_results("DESCRIBE $table");
header('Content-Type: application/json');
echo json_encode($columns, JSON_PRETTY_PRINT);
