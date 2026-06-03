<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Handles duplicating 'mh_payment_form' custom post types.
 * Version: 1.0.0
 */
class MH_WC_Form_Duplicator {

    public function __construct() {
        add_filter( 'post_row_actions', [ $this, 'add_duplicate_link' ], 10, 2 );
        add_action( 'admin_action_mh_duplicate_form', [ $this, 'duplicate_form_action' ] );
    }

    /**
     * Adds a 'Duplicate' link to the row actions on the payment forms list screen.
     *
     * @param array   $actions The existing row actions.
     * @param WP_Post $post    The post object.
     * @return array The modified row actions.
     */
    public function add_duplicate_link( $actions, $post ) {
        if ( $post->post_type === 'mh_payment_form' ) {
            $url = wp_nonce_url(
                admin_url( 'admin.php?action=mh_duplicate_form&post=' . $post->ID ),
                'mh_duplicate_form_nonce',
                'mh_nonce'
            );
            $actions['duplicate'] = '<a href="' . esc_url( $url ) . '" title="שכפל טופס זה" rel="permalink">שכפל</a>';
        }
        return $actions;
    }

    /**
     * Handles the logic for duplicating the form.
     */
    public function duplicate_form_action() {
        if ( ! ( isset( $_GET['post'] ) || isset( $_POST['post'] ) || ( isset( $_REQUEST['action'] ) && 'mh_duplicate_form' == $_REQUEST['action'] ) ) ) {
            wp_die( 'No form to duplicate has been supplied!' );
        }

        // Verify nonce
        if ( ! isset( $_GET['mh_nonce'] ) || ! wp_verify_nonce( $_GET['mh_nonce'], 'mh_duplicate_form_nonce' ) ) {
            return;
        }

        // Get original post ID
        $post_id = ( isset( $_GET['post'] ) ? absint( $_GET['post'] ) : absint( $_POST['post'] ) );
        
        // Get the post object
        $post = get_post( $post_id );

        // Check for current user permissions
        if ( isset( $post ) && $post != null && current_user_can( 'edit_post', $post_id ) ) {
            $this->create_duplicate( $post );
        } else {
            wp_die( 'You don\'t have permission to duplicate this form.' );
        }

        // Redirect back to the forms list
        wp_redirect( admin_url( 'edit.php?post_type=' . $post->post_type ) );
        exit;
    }

    /**
     * Creates the duplicate form and copies meta data.
     *
     * @param WP_Post $post The original post object.
     */
    private function create_duplicate( $post ) {
        $current_user = wp_get_current_user();
        $new_post_author = $current_user->ID;

        // New post arguments
        $args = [
            'comment_status' => $post->comment_status,
            'ping_status'    => $post->ping_status,
            'post_author'    => $new_post_author,
            'post_content'   => $post->post_content,
            'post_excerpt'   => $post->post_excerpt,
            'post_name'      => $post->post_name,
            'post_parent'    => $post->post_parent,
            'post_password'  => $post->post_password,
            'post_status'    => 'draft', // Set new post to draft
            'post_title'     => $post->post_title . ' (עותק)',
            'post_type'      => $post->post_type,
            'to_ping'        => $post->to_ping,
            'menu_order'     => $post->menu_order
        ];

        // Insert the new post
        $new_post_id = wp_insert_post( $args );

        // Copy all post meta
        $post_meta_keys = get_post_custom_keys( $post->ID );
        if ( ! empty( $post_meta_keys ) ) {
            foreach ( $post_meta_keys as $meta_key ) {
                $meta_values = get_post_custom_values( $meta_key, $post->ID );
                foreach ( $meta_values as $meta_value ) {
                    add_post_meta( $new_post_id, $meta_key, maybe_unserialize( $meta_value ) );
                }
            }
        }
    }
}