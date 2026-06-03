<?php
/**
 * Plugin Name:       M.H - WooCommerce Payments
 * Plugin URI:        https://example.com/
 * Description:       Creates payment forms that integrate with WooCommerce and the main M.H CRM.
 * Version:           1.4.0
 * Author:            Your Name
 * Requires at least: 5.0
 * Requires PHP:      7.2
 * Depends:           M.H - מערכת CRM, WooCommerce
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'MH_WC_PAYMENTS_DIR', plugin_dir_path( __FILE__ ) );
define( 'MH_WC_PAYMENTS_URL', plugin_dir_url( __FILE__ ) );
define( 'MH_WC_PAYMENTS_VERSION', '1.4.0' );

function mh_wc_payments_run() {
    $crm_active = class_exists( 'M_H_CRM_Plugin' ) || class_exists( 'M_H_Plugin' );
    
    if ( ! $crm_active || ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', 'mh_wc_payments_missing_deps_notice' );
        return;
    }

    require_once MH_WC_PAYMENTS_DIR . 'includes/class-mh-wc-url-params.php';
    require_once MH_WC_PAYMENTS_DIR . 'includes/class-mh-wc-standard-form-handler.php';
    require_once MH_WC_PAYMENTS_DIR . 'includes/class-mh-wc-product-sync.php'; // NEW
    require_once MH_WC_PAYMENTS_DIR . 'includes/class-mh-wc-payments-core.php';
    require_once MH_WC_PAYMENTS_DIR . 'includes/class-mh-wc-form-duplicator.php';
    require_once MH_WC_PAYMENTS_DIR . 'includes/class-mh-wc-modal-handler.php';

    new MH_WC_Payments_Core();
    new MH_WC_Form_Duplicator();
    new MH_WC_Modal_Handler();
}
add_action( 'plugins_loaded', 'mh_wc_payments_run', 20 );

function mh_wc_payments_missing_deps_notice() {
    $missing = [];
    if (!class_exists('M_H_CRM_Plugin') && !class_exists('M_H_Plugin')) {
        $missing[] = '"M.H - מערכת CRM"';
    }
    if (!class_exists('WooCommerce')) {
        $missing[] = '"WooCommerce"';
    }
    ?>
    <div class="error">
        <p>The <strong>M.H - WooCommerce Payments</strong> add-on requires the following plugins to be active: <?php echo implode(' and ', $missing); ?>.</p>
    </div>
    <?php
}