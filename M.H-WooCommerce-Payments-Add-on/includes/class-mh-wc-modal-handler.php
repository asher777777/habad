<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Handles the Modal (Popup) functionality for Payment Forms.
 * Version: 1.0.1
 * --- CHANGELOG ---
 * - FIX: Added opacity:1 to form card inside modal to ensure it's visible (overriding the default fade-in animation initial state).
 */
class MH_WC_Modal_Handler {

    public function __construct() {
        // Register the new shortcode
        add_shortcode( 'mh_wc_product_modal', [ $this, 'render_modal_shortcode' ] );
        
        // Add scripts and styles to footer
        add_action( 'wp_footer', [ $this, 'print_modal_assets' ] );

        // Add a column in the admin list to easily copy the modal shortcode
        add_filter( 'manage_mh_payment_form_posts_columns', [ $this, 'add_modal_shortcode_column' ] );
        add_action( 'manage_mh_payment_form_posts_custom_column', [ $this, 'display_modal_shortcode_column' ], 10, 2 );
    }

    /**
     * Adds the 'Modal Shortcode' column to the admin dashboard.
     */
    public function add_modal_shortcode_column( $columns ) {
        $columns['modal_shortcode'] = 'שורטקוד מודל (פופ-אפ)';
        return $columns;
    }

    /**
     * Displays the copyable shortcode in the admin column.
     */
    public function display_modal_shortcode_column( $column, $post_id ) {
        if ( 'modal_shortcode' === $column ) {
            $shortcode = sprintf( '[mh_wc_product_modal id="%d"]', $post_id );
            echo '<input type="text" value="' . esc_attr( $shortcode ) . '" readonly onfocus="this.select();" style="width:100%; direction:ltr; text-align:left;">';
        }
    }

    /**
     * Renders the product image trigger and the hidden modal content.
     */
    public function render_modal_shortcode( $atts ) {
        $atts = shortcode_atts( [
            'id' => 0,
            'text' => 'הזמן עכשיו', // Fallback text if no image exists
        ], $atts );

        $form_id = intval( $atts['id'] );
        if ( ! $form_id || get_post_type( $form_id ) !== 'mh_payment_form' ) {
            return '';
        }

        // Get product image
        $image_id = get_post_meta( $form_id, '_mh_wc_product_image_id', true );
        $trigger_html = '';

        if ( $image_id ) {
            $trigger_html = wp_get_attachment_image( $image_id, 'medium', false, [
                'class' => 'mh-modal-trigger-img', 
                'style' => 'cursor:pointer; transition: transform 0.2s;'
            ] );
        } else {
            $trigger_html = '<button class="button mh-modal-trigger-btn">' . esc_html( $atts['text'] ) . '</button>';
        }

        ob_start();
        ?>
        <div class="mh-wc-modal-wrapper-container" id="mh-wrapper-<?php echo $form_id; ?>">
            <!-- The Trigger (Image or Button) -->
            <div class="mh-modal-trigger" data-modal-id="mh-modal-<?php echo $form_id; ?>">
                <?php echo $trigger_html; ?>
            </div>
            
            <!-- The Modal Structure -->
            <div id="mh-modal-<?php echo $form_id; ?>" class="mh-wc-modal-overlay" style="display:none;">
                <div class="mh-wc-modal-content">
                    <button type="button" class="mh-wc-modal-close">&times;</button>
                    <div class="mh-wc-modal-body">
                        <?php 
                        // Render the original form shortcode inside the modal
                        echo do_shortcode( '[mh_wc_payment_form id="' . $form_id . '"]' ); 
                        ?>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Prints the necessary CSS and JS for the modal to work.
     */
    public function print_modal_assets() {
        ?>
        <style>
            /* Modal Overlay */
            .mh-wc-modal-overlay {
                display: none; 
                position: fixed; 
                z-index: 999999; 
                left: 0; 
                top: 0; 
                width: 100%; 
                height: 100%; 
                overflow-y: auto; 
                background-color: rgba(0,0,0,0.7); 
                backdrop-filter: blur(4px);
                animation: mhFadeIn 0.3s;
            }

            /* Modal Content Box */
            .mh-wc-modal-content {
                background-color: #fff;
                margin: 40px auto; 
                padding: 0; 
                width: 90%; 
                max-width: 550px; 
                border-radius: 12px; 
                position: relative; 
                box-shadow: 0 15px 40px rgba(0,0,0,0.3);
                animation: mhSlideUp 0.3s;
            }

            /* Close Button */
            .mh-wc-modal-close {
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                font-size: 32px;
                line-height: 1;
                color: #888;
                cursor: pointer;
                z-index: 100;
                transition: color 0.2s;
            }
            .mh-wc-modal-close:hover {
                color: #000;
            }

            /* Fix styles inside modal - FORCE VISIBILITY */
            .mh-wc-modal-content .mh-form-card {
                box-shadow: none !important; 
                margin: 0 !important; 
                max-width: 100% !important;
                animation: none !important; /* Disable card animation inside modal */
                opacity: 1 !important; /* Force visible */
                transform: none !important; /* Reset position */
            }
            
       
            
            /* Make sure the wrappers take full width */
.mh-wc-modal-wrapper-container,
.mh-modal-trigger {
    width: 100%;
    display: block;
}

/* Force the image to stretch to the wrapper's width */
.mh-modal-trigger-img {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    display: block;
}

            @keyframes mhFadeIn { from {opacity: 0;} to {opacity: 1;} }
            @keyframes mhSlideUp { from {opacity: 0; transform: translateY(30px);} to {opacity: 1; transform: translateY(0);} }
        </style>

        <script>
            jQuery(document).ready(function($) {
                // Open Modal
                $(document).on('click', '.mh-modal-trigger', function() {
                    var modalId = $(this).data('modal-id');
                    $('#' + modalId).fadeIn(250);
                    $('body').css('overflow', 'hidden'); // Prevent background scrolling
                });

                // Close Modal (Clicking 'X' or Outside)
                $(document).on('click', '.mh-wc-modal-close, .mh-wc-modal-overlay', function(e) {
                    if (e.target !== this && !$(e.target).hasClass('mh-wc-modal-close')) return;
                    
                    $(this).closest('.mh-wc-modal-overlay').fadeOut(250, function() {
                        $('body').css('overflow', ''); // Restore scrolling
                    });
                });
                
                // Close on ESC key
                $(document).keyup(function(e) {
                    if (e.key === "Escape") {
                        $('.mh-wc-modal-overlay').fadeOut(250);
                        $('body').css('overflow', '');
                    }
                });
            });
        </script>
        <?php
    }
}