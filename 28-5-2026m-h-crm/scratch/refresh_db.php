<?php
require_once('../../../wp-load.php');
require_once('../includes/class-mh-database-manager.php');
MH_Database_Manager::create_tables();
echo "Tables refreshed!";
