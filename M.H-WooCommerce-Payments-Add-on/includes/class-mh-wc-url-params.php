<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Handles the dynamic URL parameter functionality for M.H WooCommerce Payments.
 * Version: 1.0.1 - Fixed type mismatch in checkbox validation.
 */
class MH_WC_URL_Params {

    public function __construct() {
        add_action( 'save_post_mh_payment_form', [ $this, 'save_meta_data' ] );
    }

    /**
     * Renders the meta box section for URL parameter settings.
     *
     * @param WP_Post $post The post object.
     */
    public function render_meta_box_section( $post ) {
        $url_params_post_meta = get_post_meta( $post->ID, '_mh_url_params_post_meta', true ) ?: [];
        ?>
        <div class="mh-form-section">
            <h3>הגדרות פרמטרים בכתובת URL</h3>
            <p>הגדר כאן פרמטרים שיילקחו מהפוסט/עמוד בו הטופס מוטמע ויועברו הלאה בכתובת האתר.</p>
            <div id="mh-url-params-wrapper">
                <?php if (!empty($url_params_post_meta)) { foreach ($url_params_post_meta as $index => $param) { ?>
                    <div class="mh-url-param-row">
                        <input type="text" name="mh_url_params_post_meta[<?php echo $index; ?>][key]" value="<?php echo esc_attr($param['key'] ?? ''); ?>" placeholder="מפתח שדה מיוחד (Meta Key)" />
                        <input type="text" name="mh_url_params_post_meta[<?php echo $index; ?>][param]" value="<?php echo esc_attr($param['param'] ?? ''); ?>" placeholder="שם פרמטר ב-URL" />
                        <a href="#" class="mh-remove-url-param-btn">הסר</a>
                    </div>
                <?php } } ?>
            </div>
            <button type="button" id="mh-add-url-param-btn" class="button">הוסף פרמטר מפוסט</button>
        </div>
        <?php
    }

    /**
     * Saves the URL parameter settings.
     *
     * @param int $post_id The ID of the post being saved.
     */
    public function save_meta_data( $post_id ) {
        if ( isset( $_POST['mh_url_params_post_meta'] ) && is_array( $_POST['mh_url_params_post_meta'] ) ) {
            $sanitized_params = [];
            foreach ( $_POST['mh_url_params_post_meta'] as $param ) {
                if ( ! empty( $param['key'] ) && ! empty( $param['param'] ) ) {
                    $sanitized_params[] = [
                        'key'   => sanitize_text_field( $param['key'] ),
                        'param' => sanitize_text_field( $param['param'] ),
                    ];
                }
            }
            update_post_meta( $post_id, '_mh_url_params_post_meta', $sanitized_params );
        } else {
            delete_post_meta( $post_id, '_mh_url_params_post_meta' );
        }
    }

    /**
     * Builds the array of URL parameters based on form settings and submitted data.
     *
     * @param int   $form_id           The ID of the payment form.
     * @param array $submitted_data    The data submitted by the user.
     * @param int   $embedding_post_id The ID of the post where the form is embedded.
     * @return array The array of URL parameters.
     */
    public function build_url_params( $form_id, $submitted_data, $embedding_post_id ) {
        $url_params = [];
        $fields_map = get_post_meta( $form_id, '_mh_form_fields', true );

        // 1. Get URL params from Post Meta
        $post_meta_params = get_post_meta($form_id, '_mh_url_params_post_meta', true);
        if (is_array($post_meta_params) && !empty($embedding_post_id)) {
            foreach ($post_meta_params as $param_setting) {
                if (!empty($param_setting['key']) && !empty($param_setting['param'])) {
                    $meta_value = get_post_meta($embedding_post_id, $param_setting['key'], true);
                    if (isset($meta_value) && $meta_value !== '') {
                        $url_params[$param_setting['param']] = $meta_value;
                    }
                }
            }
        }

        // 2. Get URL params from Form Fields
        if (is_array($fields_map)) {
            foreach ( $fields_map as $field ) {
                $label = $field['label'];
                if ( isset( $submitted_data[$label] ) ) {
                    $value = $submitted_data[$label];
                    // ** FIX HERE: Changed strict comparison '===' to loose '==' to handle type difference (string vs int). **
                    if ( !empty($field['url_param_enable']) && $field['url_param_enable'] == 1 && !empty($field['url_param_name']) && isset($value) && $value !== '' ) {
                        $url_params[$field['url_param_name']] = $value;
                    }
                }
            }
        }
        
        return $url_params;
    }
}