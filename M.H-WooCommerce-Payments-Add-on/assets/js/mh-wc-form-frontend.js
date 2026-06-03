jQuery(document).ready(function($) {

    /**
     * לוגיקה תנאית להצגת/הסתרת שדות
     */
    function initConditionalLogic(form) {
        const condFields = form.find('[data-conditional="true"]');
        function check() {
            condFields.each(function() {
                const target = $(this);
                const triggerIdx = target.data('cond-target-index');
                const operator = target.data('cond-operator');
                const val = target.data('cond-value');
                const trigger = form.find(`[data-field-index="${triggerIdx}"] :input`);
                
                if (trigger.length) {
                    const currentVal = trigger.val();
                    let show = (operator === 'is') ? (currentVal === val) : (currentVal !== val);
                    show ? target.slideDown() : target.slideUp();
                }
            });
        }
        form.find(':input').on('change input', check);
        check();
    }

    // הפעלה עבור כל הטפסים בעמוד
    $('.mh-wc-payment-form').each(function() {
        initConditionalLogic($(this));
    });

    /**
     * טיפול בשליחת הטופס
     */
    $(document).on('submit', '.mh-wc-payment-form', function(e) {
        e.preventDefault();
        const form = $(this);
        const submitBtn = form.find('.mh-form-submit-btn');
        const responseDiv = form.find('.mh-form-response');
        
        // וידוא שקיים אובייקט נתונים מהשרת
        if (typeof mhWcFormData === 'undefined') {
            console.error('MH Form Error: mhWcFormData is not defined. Check wp_localize_script.');
            responseDiv.text('שגיאת מערכת: חסרים נתוני אבטחה. נא רענן את העמוד.').css('color', 'red').show();
            return;
        }

        // איסוף נתונים משדות גלויים בלבד
        const formData = form.find(':input:visible, input[type="hidden"]').serializeArray();

        // וולידציה בסיסית בצד לקוח
        let valid = true;
        form.find('[required]:visible').each(function() {
            if (!$(this).val()) {
                $(this).css('border-color', 'red');
                valid = false;
            } else {
                $(this).css('border-color', '#ccc');
            }
        });

        if (!valid) {
            responseDiv.text('אנא מלא שדות חובה').css('color', 'red').show();
            return;
        }

        $.ajax({
            url: mhWcFormData.ajax_url,
            type: 'POST',
            data: {
                action: 'mh_handle_wc_form',
                nonce: mhWcFormData.nonce, // זה הקוד שאחראי על ה-403 אם הוא לא תקין
                form_id: form.data('form-id'),
                form_data: formData
            },
            beforeSend: function() {
                submitBtn.prop('disabled', true).text('מעבד...');
                responseDiv.hide();
            },
            success: function(res) {
                if (res.success) {
                    if (res.data.payment_url) {
                        window.location.href = res.data.payment_url;
                    } else {
                        responseDiv.html(res.data.success_message || 'נשלח בהצלחה').css('color', 'green').show();
                        if (res.data.redirect_url) {
                            setTimeout(() => window.location.href = res.data.redirect_url, 2000);
                        }
                    }
                } else {
                    responseDiv.text(res.data.message || 'שגיאה בשליחה').css('color', 'red').show();
                    submitBtn.prop('disabled', false).text('נסה שוב');
                }
            },
            error: function(xhr, status, error) {
                console.error('MH Form AJAX Error:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText
                });
                
                let errorMsg = 'שגיאת תקשורת';
                if (xhr.status === 403) {
                    errorMsg = 'פג תוקף האבטחה (Session Expired). נא לרענן את העמוד ולנסות שוב.';
                } else if (xhr.status === 500) {
                    errorMsg = 'שגיאת שרת פנימית. נא לפנות למנהל האתר.';
                }
                
                responseDiv.text(errorMsg).css('color', 'red').show();
                submitBtn.prop('disabled', false).text('נסה שוב');
            }
        });
    });
});