<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Handles the logic for standard (non-payment) form submissions.
 * Version: 1.1.0
 * --- CHANGELOG V1.1.0 ---
 * - FIX: The `handle_submission` function signature now correctly accepts the `$embedding_post_id` parameter.
 * - FIX: The call to `send_whatsapp_message` now correctly passes all required arguments, resolving the fatal error.
 */
class MH_WC_Standard_Form_Handler {

    /**
     * Processes the standard form submission.
     *
     * @param int                 $form_id           The ID of the form.
     * @param array               $form_data         The submitted form data.
     * @param int                 $embedding_post_id The ID of the post where the form is embedded.
     * @param MH_WC_Payments_Core $core_instance     An instance of the core plugin class to access shared methods.
     */
    public function handle_submission( $form_id, $form_data, $embedding_post_id, $core_instance ) {
        // Save to CRM if the option is enabled
        if ( get_post_meta( $form_id, '_mh_save_to_crm', true ) === '1' ) {
            $core_instance->save_to_crm( $form_id, $form_data, 'טופס רגיל נשלח' );
        }

        // Send a WhatsApp message upon successful submission if configured
        $whatsapp_message = get_post_meta( $form_id, '_mh_standard_whatsapp_message', true );
        $whatsapp_image_id = get_post_meta( $form_id, '_mh_standard_whatsapp_image_id', true );

        if ( ! empty( $whatsapp_message ) || ! empty( $whatsapp_image_id ) ) {
            $phone_number = $core_instance->get_phone_from_form_data( $form_id, $form_data );
            if ( ! empty( $phone_number ) ) {
                $final_message = $core_instance->build_final_message( $whatsapp_message, $form_data );
                // --- CORRECTED CALL ---
                $core_instance->send_whatsapp_message( $phone_number, $final_message, $whatsapp_image_id, $form_id, $embedding_post_id, $form_data );
            }
        }

        // Prepare the success response for the frontend
        $success_message = get_post_meta( $form_id, '_mh_standard_success_message', true ) ?: 'הטופס נשלח בהצלחה.';
        $redirect_url = get_post_meta( $form_id, '_mh_standard_redirect_url', true );

        wp_send_json_success( [
            'success_message' => $success_message,
            'redirect_url'    => esc_url_raw( $redirect_url ),
        ] );
    }
}