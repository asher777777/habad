<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Handles syncing form data with existing WooCommerce products.
 */
class MH_WC_Product_Sync {

    /**
     * Renders the product selection dropdown in the admin meta box.
     */
    public function render_product_picker( $post_id ) {
        $synced_product_id = get_post_meta( $post_id, '_mh_wc_synced_product_id', true );
        
        // Fetch published products
        $products = wc_get_products([
            'status' => 'publish',
            'limit'  => -1,
        ]);
        ?>
        <p>
            <label><strong>סנכרון מול מוצר ווקומרס קיים (אופציונלי):</strong></label><br>
            <select name="mh_wc_synced_product_id" style="width: 100%; max-width: 400px;">
                <option value="">-- בחר מוצר לסנכרון נתונים --</option>
                <?php foreach ( $products as $product ) : ?>
                    <option value="<?php echo esc_attr( $product->get_id() ); ?>" <?php selected( $synced_product_id, $product->get_id() ); ?>>
                        <?php echo esc_html( $product->get_name() . ' (#' . $product->get_id() . ') - ' . $product->get_price() . ' ' . get_woocommerce_currency_symbol() ); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <br><small>אם נבחר מוצר, המערכת תשתמש בשם, במחיר ובתמונה שלו במקום בנתונים הידניים.</small>
        </p>
        <?php
    }

    /**
     * Gets product details based on either a synced product ID or manual form settings.
     * * @param int $form_id The ID of the payment form.
     * @return array Product details (id, name, price, image_id).
     */
    public function get_effective_product_data( $form_id ) {
        $synced_id = get_post_meta( $form_id, '_mh_wc_synced_product_id', true );
        
        if ( ! empty( $synced_id ) ) {
            $product = wc_get_product( $synced_id );
            if ( $product ) {
                return [
                    'id'       => $product->get_id(),
                    'name'     => $product->get_name(),
                    'price'    => $product->get_price(),
                    'image_id' => $product->get_image_id(),
                    'is_synced'=> true
                ];
            }
        }

        // Fallback to manual settings
        return [
            'id'       => 0,
            'name'     => get_post_meta( $form_id, '_mh_wc_product_name', true ),
            'price'    => 0, // Price will be determined by form fields
            'image_id' => get_post_meta( $form_id, '_mh_wc_product_image_id', true ),
            'is_synced'=> false
        ];
    }
}