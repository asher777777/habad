<?php
/**
 * Nedarim Standard Payment Gateway.
 *
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WC_Gateway_Nedarim Class.
 */
class WC_Gateway_Nedarim extends WC_Payment_Gateway
{
    /**
     * Logger instance
     *
     * @var WC_Logger
     */
    public static $log = false;


    /**
     * Constructor for the gateway.
     */
    public function __construct()
    {
        $this->id = 'nedarim';
        $this->order_button_text = $this->get_option('button_text');
        $this->method_title = _Translate('Nedarim Plus', 'נדרים פלוס');
        $this->method_description = _Translate('Receive payment with credit card.', 'קבלת תשלום באמצעות כרטיס אשראי.');
        $this->has_fields = false;

        $this->init_form_fields();
        $this->init_settings();

        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');

        // Save settings
        if (is_admin()) {
            //debug_to_console(WOOCOMMERCE_VERSION);
            if (version_compare(WOOCOMMERCE_VERSION, '2.0.0', '>=')) {
                add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
            } else {
                add_action('woocommerce_update_options_payment_gateways', array($this, 'process_admin_options'));
            }
        }

        if (!$this->is_valid_for_use()) {
            $this->enabled = 'no';
        }

    }


    /**
     * Return whether or not this gateway still requires setup to function.
     *
     * When this gateway is toggled on via AJAX, if this returns true a
     * redirect will occur to the settings page instead.
     *
     * @since 3.4.0
     * @return bool
     */
    public function needs_setup()
    {
        return !(empty($this->settings['mosadid']) || empty($this->settings['apivalid']));
    }

    /**
     * Checks to see if all criteria is met before showing payment method.
     *
     * @since 4.0.0
     * @version 4.0.0
     * @return bool
     */
    public function is_available()
    {
        if ('yes' !== $this->enabled) {
            return false;
        }

        if (!$this->is_valid_for_use()) {
            return false;
        }
        return true;
    }

    /**
     * Processes and saves options.
     * If there is an error thrown, will continue to save and validate fields, but will leave the erroring field out.
     *
     * @return bool was anything saved?
     */
    public function process_admin_options()
    {
        $saved = parent::process_admin_options();

        // Maybe clear logs.
        if ('yes' !== $this->get_option('debug', 'no')) {
            if (empty(self::$log)) {
                self::$log = wc_get_logger();
            }
            self::$log->clear('nedarim');
        }

        return $saved;
    }

    /**
     * Get gateway icon.
     *
     * @return string
     */
    public function get_icon()
    {
        $icon_html = '';
        if ($this->get_option('show_cc_icon') == 'yes') {
            $icon_html .= '<img style="height: 40px" src="' . WC_NEDARIM_PLUGIN_URL . '/assets/images/visa_master.png?0"/>';
        }
        if ($this->get_option('show_icon') == 'yes') {
            $icon_html .= '<img style="height: 40px" src="' . WC_NEDARIM_PLUGIN_URL . '/assets/images/nedarim.png?0"/>';
        }
        return apply_filters('woocommerce_gateway_icon', $icon_html, $this->id);
    }

    /**
     * Get Nedarim images for a country.
     *
     * @param string $country Country code.
     * @return array of image URLs
     */
    protected function get_icon_image()
    {
        return apply_filters('woocommerce_nedarim_icon', WC_NEDARIM_PLUGIN_URL . '/assets/images/nedarim.png?0');
    }

    /**
     * Check if this gateway is enabled and available in the user's country.
     *
     * @return bool
     */
    public function is_valid_for_use()
    {
        return in_array(
            get_woocommerce_currency(),
            apply_filters(
                'woocommerce_nedarim_supported_currencies',
                array('ILS', 'USD')
            ),
            true
        );
    }

    /**
     * Admin Panel Options.
     * - Options for bits like 'title' and availability on a country-by-country basis.
     *
     */
    public function admin_options()
    {
        if ($this->is_valid_for_use()) {
            parent::admin_options();
        } else {
            ?>
            <div class="inline error">
                <p>
                    <strong>
                        <?php esc_html_e('Gateway disabled', 'woocommerce-gateway-nedarim'); ?>
                    </strong>:
                    <?php esc_html_e('Nedarim does not support your store currency.', 'woocommerce-gateway-nedarim'); ?>
                </p>
            </div>
            <?php
        }
    }

    /**
     * Initialise Gateway Settings Form Fields.
     */
    public function init_form_fields()
    {
        $settings = include 'settings-nedarim.php';
        
        // הוספת שדה פרויקטים להגדרות
        $settings['projects'] = array(
            'title'       => __('רשימת פרויקטים', 'nedarim-plus'),
            'type'        => 'textarea',
            'description' => __('הזן רשימת פרויקטים לבחירה, שורה לכל פרויקט. ניתן להשתמש בפורמט "ערך:שם" (לדוגמה: "project1:פרויקט 1").', 'nedarim-plus'),
            'default'     => '',
            'desc_tip'    => true,
        );
        
        $this->form_fields = $settings;
    }

    /**
     * Process the payment and return the result.
     *
     * @param  int $order_id Order ID.
     * @return array
     */
    public function process_payment($order_id)
    {
        $order = new WC_Order($order_id);

        return array(
            'result' => 'success',
            'redirect' => $order->get_checkout_payment_url(true)
        );
    }
}