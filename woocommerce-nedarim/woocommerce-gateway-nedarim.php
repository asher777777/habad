<?php
/*
  Plugin Name: נדרים פלוס
  Plugin URI: 
  Description: תוסף לסליקת כרטיס אשראי וקבלת תשלום באמצעות ביט
  Version: 1.0.11
  Author: Matara Production
  Author URI: https://www.matara.pro
 */
if (!defined('ABSPATH')) {
    exit;
}

// טעינת קובץ הפרויקטים
function nedarim_load_projects_addon() {
    require_once(plugin_dir_path(__FILE__) . 'includes/class-nedarim-projects.php');
}
add_action('plugins_loaded', 'nedarim_load_projects_addon', 1);

// הוספת פילטרים לשינוי נתוני התשלום
function nedarim_register_transaction_filters() {
    add_filter('nedarim_transaction_data', 'add_project_to_nedarim_transaction', 10, 2);
}
add_action('plugins_loaded', 'nedarim_register_transaction_filters', 2);

function _Translate($English, $Hebrew)
{
    if (get_locale() == 'he_IL') {
        return $Hebrew;
    } else {
        return $English;
    }
}

function debug_to_console($data)
{
    echo "<script>console.log('PHP DEBUG:');</script>";
    echo "<script>console.log('" . $data . "');</script>";
}

//Initialize the gateway.
function woocommerce_nedarim_init()
{
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }
    require_once(plugin_basename('includes/class-wc-gateway-nedarim.php'));
    require_once(plugin_basename('includes/class-wc-gateway-bitnedarim.php'));
    add_filter('woocommerce_payment_gateways', 'woocommerce_nedarim_add_gateway');
    add_filter('woocommerce_payment_gateways', 'woocommerce_bitnedarim_add_gateway');
    // add_filter('woocommerce_blocks_payment_method_type_registration', 'woocommerce_add_payment_gateways_woocommerce_blocks');
    // add_filter('woocommerce_blocks_payment_method_type_registration', 'woocommerce_add_payment_gateways_woocommerce_blocks');

    define('WC_NEDARIM_PLUGIN_URL', untrailingslashit(plugins_url(basename(plugin_dir_path(__FILE__)), basename(__FILE__))));
    define('WC_NEDARIM_VERSION', '1.0.4');
}
add_action('plugins_loaded', 'woocommerce_nedarim_init', 0);

/* Install and default settings */
function woocommerce_nedarim_install()
{
    update_option('woocommerce_hold_stock_minutes', '');
}
add_action('activate_' . plugin_basename(__FILE__), 'woocommerce_nedarim_install');


function CreateTransaction($order_id)
{
    $settings = get_option('woocommerce_nedarim_settings', []);

    $order = new WC_Order($order_id);
    global $woocommerce;

    $CallBackUrl = add_query_arg(array('order_id' => $order->get_id(), 'order_key' => $order->get_order_key()), $woocommerce->api_request_url('WC_Gateway_Nedarim')) . '&CallBackToken=fsuewiriufdsfhkhsdf';
    $RedirectUrl = $order->get_checkout_order_received_url();
    $RedirectJS = 'window.parent.location.href="' . $RedirectUrl . '"';
    if (in_array($_SERVER['REMOTE_ADDR'], array('127.0.0.1', '::1'))) {
        $RedirectUrl = $CallBackUrl;
        $CallBackUrl = "";
        $RedirectJS = "var f = document.createElement('form');
        f.action='" . $RedirectUrl . "';
        f.method='POST';   
        var i=document.createElement('input');
        i.type='hidden';
        i.name='JsonData';
        i.value=JSON.stringify(event.data.Value);
        f.appendChild(i);     
        document.body.appendChild(f);
        f.submit();";
    }
    $curl_body = array(
        'Mosad' => $settings['mosadid'],
        'ApiValid' => $settings['apivalid'],
        'Zeout' => '',
        'FirstName' => $order->get_billing_first_name(),
        'LastName' => $order->get_billing_last_name(),
        'Street' => $order->get_billing_address_1() . " " . $order->get_billing_address_2(),
        'City' => $order->get_billing_city(),
        'Phone' => $order->get_billing_phone(),
        'Mail' => $order->get_billing_email(),
        'PaymentType' => 'Ragil',
        'Amount' => $order->get_total(),
        'Tashlumim' => '1',
        'Currency' => $order->get_currency(),
        'Groupe' => $settings['group'],
        'Comment' => 'WooCommerce OrderId: ' . $order_id,
        'Param1' => 'WooCommerce',
        'CallBack' => $CallBackUrl,
    );
    
    // הוספת הפילטר לשינוי נתוני התשלום (כולל הוספת פרויקט)
    $curl_body = apply_filters('nedarim_transaction_data', $curl_body, $order);
    
    $curl = curl_init();
    curl_setopt_array(
        $curl,
        array(
            CURLOPT_URL => 'https://www.matara.pro/nedarimplus/v6/Files/WebServices/DebitIframe.aspx?Action=CreateTransaction',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $curl_body,
        )
    );
    //debug_to_console(plugin_basename(__FILE__));
    //debug_to_console(json_encode($curl_body));
    $response = curl_exec($curl);
    curl_close($curl);

    $json_a = json_decode($response, true);

    if ($json_a['Status'] == 'Error') {
        $note = '<b style="color:indianred">שגיאה: ' . $json_a['Message'] . '</b>';
        $order->add_order_note($note);
        wc_add_notice($note, 'error');
        echo "<script>window.parent.location.href='" . wc_get_checkout_url() . "';</script>";
    } else {
        if ($CallBackUrl == "")
            $order->add_order_note('הנכם נמצאים בשרת LOCAL, עסקה זו לא תסגר באמצעות קאלבק מאובטח.');

        echo '<div style="text-align:center;background: rgb(238, 238, 238);border-radius: 8px;padding: 0 0 5px;max-width: 380px; margin: auto;user-select: none;"><iframe id="NedarimFrame" style="width:100%;-webkit-box-sizing:border-box;height:0px;border:0;max-width: 300px;" scrolling="no" src="about:blank"></iframe>
            <div style="text-align:center;padding:10px 0px;font-family:Assistant,Arial;color:#808080" id="WaitNedarimFrame"><img src="' . WC_NEDARIM_PLUGIN_URL . '/assets/images/waitnew.gif" style="width:50px;" /><br />' . _Translate("Connecting to PCI page...", "פתיחת דף תשלום מאובטח...") . '</div>
    
            <div id="OkDiv" style="font-weight:bold;color:#47ba18;padding:5px;display:none;text-align:center"><img src="' . WC_NEDARIM_PLUGIN_URL . '/assets/images/waitnew.gif" style="width:50px;" /><br />' . _Translate("Payment success. Please wait...", "התשלום בוצע בהצלחה, נא להמתין לסגירת העסקה...") . '</div>
    
            <div id="PayBtDiv" style="margin:5px 0px 15px 0px;text-align:center">
            <div id="ErrorDiv" style="font-weight: bold; padding: 5px; user-select: auto; color: firebrick; max-width: 85%; margin: auto; border-radius: 5px;"></div>
                <input type="button" id="PayBt" style="cursor:pointer;color:white;background-color:#17a2b8;text-align:center;padding: 10px 25px;border: 0;" value="ביצוע תשלום" class="TextBox" onclick="PayBtClick()" />
            </div>
            <div style="text-align:center;padding:10px 0px;font-family:Assistant,Arial;color:#808080;display:none" id="WaitPay"><img src="' . WC_NEDARIM_PLUGIN_URL . '/assets/images/waitnew.gif" style="width:50px;" /><br />מבצע חיוב, נא להמתין...</div>
    
            <div id="Result" style="text-align:center" dir="ltr"></div>
            </div>
            <script> window.onerror = function (msg, url, line, col, error) {
                    alert("שגיאת תוכנה. פנה לתמיכה טכנית. שגיאה: " + msg)
                }
        
                //זהירות! את השורת קוד הזו יש להפעיל רק פעם אחת בעת פתיחת הדף
                window.onload = function () {
                    if (window.addEventListener) { window.addEventListener("message", ReadPostMessage, false); } else { window.attachEvent("onmessage", ReadPostMessage); }
                    document.getElementById("NedarimFrame").onload = function () { PostNedarim({"Name":"GetHeight"}) }
                    document.getElementById("NedarimFrame").src = "https://matara.pro/nedarimplus/iframe?language=' . $settings['language'] . '&MaxPayments=' . $settings['numberpayments'] . '&NeedZeout=' . $json_a['NeedZeout'] . '";
                }
                ///////////////////////////////
    
                function PostNedarim(Data) { var iframeWin = document.getElementById(\'NedarimFrame\').contentWindow; iframeWin.postMessage(Data, "*"); };
            function ReadPostMessage(event) {
                switch (event.data.Name) {
                    case \'Height\':
                        document.getElementById(\'NedarimFrame\').style.height = (parseInt(event.data.Value) + 15) + "px";
                        document.getElementById(\'WaitNedarimFrame\').style.display = \'none\';
                        break;
    
                    case \'TransactionResponse\':
                        if (event.data.Value.Status == \'Error\') {
                            document.getElementById(\'ErrorDiv\').innerHTML = event.data.Value.Message
                            document.getElementById(\'WaitPay\').style.display = \'none\';
                            document.getElementById(\'PayBtDiv\').style.display = \'block\';
                        } else {                    
                            document.getElementById(\'NedarimFrame\').style.display = \'none\';
                            document.getElementById(\'WaitPay\').style.display = \'none\';
                            document.getElementById(\'OkDiv\').style.display = \'block\';
                            ' . $RedirectJS . '
                        }
                }
            }
            function PayBtClick() {
                document.getElementById(\'Result\').innerHTML = \'\'
                document.getElementById(\'PayBtDiv\').style.display = \'none\';
                document.getElementById(\'OkDiv\').style.display = \'none\';
                document.getElementById(\'WaitPay\').style.display = \'block\';
                document.getElementById(\'ErrorDiv\').innerHTML = \'\';
                PostNedarim({ \'Name\': \'FinishTransaction\', \'Value\': ' . $json_a['ID'] . '})
            }
              </script>';
    }

}

add_action('woocommerce_receipt_nedarim', 'CreateTransaction');


function CreateBitTransaction($order_id)
{
    $mosadsettings = get_option('woocommerce_nedarim_settings', []);

    $order = new WC_Order($order_id);

    global $woocommerce;

    $CallBackUrl = add_query_arg(array('order_id' => $order->get_id(), 'order_key' => $order->get_order_key()), $woocommerce->api_request_url('WC_Gateway_BitNedarim')) . '&CallBackToken=fsuewiriufdsfhkhsdf';
    $RedirectUrl = $order->get_checkout_order_received_url();
    if (in_array($_SERVER['REMOTE_ADDR'], array('127.0.0.1', '::1'))) {
        $RedirectUrl = $CallBackUrl;
        $CallBackUrl = "";
    }
    $curl_body = array(
        'Mosad' => $mosadsettings['mosadid'],
        'ApiValid' => $mosadsettings['apivalid'],
        'Zeout' => '',
        'ClientName' => $order->get_billing_first_name() . " " . $order->get_billing_last_name(),
        'Street' => $order->get_billing_address_1() . " " . $order->get_billing_address_2(),
        'City' => $order->get_billing_city(),
        'Phone' => $order->get_billing_phone(),
        'Mail' => $order->get_billing_email(),
        'Amount' => $order->get_total(),
        'Tashlumim' => '1',
        'Currency' => $order->get_currency(),
        'Groupe' => $mosadsettings['group'],
        'Comment' => 'WooCommerce OrderId: ' . $order_id,
        'Param2' => 'WooCommerce',
        'CallBack' => $CallBackUrl,
    );
    
    // הוספת הפילטר לשינוי נתוני התשלום (כולל הוספת פרויקט)
    $curl_body = apply_filters('nedarim_transaction_data', $curl_body, $order);
    
    $curl = curl_init();
    curl_setopt_array(
        $curl,
        array(
            CURLOPT_URL => 'https://www.matara.pro/nedarimplus/v6/Files/WebServices/DebitBit.aspx?Action=CreateTransaction',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $curl_body,
        )
    );
    //debug_to_console(json_encode($curl_body));
    $response = curl_exec($curl);
    curl_close($curl);
    //debug_to_console(json_encode($response));


    $json_a = json_decode($response, true);

    if ($json_a['Status'] == 'Error') {
        $note = '<b style="color:indianred">שגיאה: ' . $json_a['Message'] . '</b>';
        $order->add_order_note($note);
        wc_add_notice($note, 'error');
        echo "<script>window.parent.location.href='" . wc_get_checkout_url() . "';</script>";
    } else {
        if ($CallBackUrl == "")
            $order->add_order_note('הנכם נמצאים בשרת LOCAL, עסקה זו לא תסגר באמצעות קאלבק מאובטח.');
        echo '
        <div dir="rtl" style="user-select: none;background-color: #f1f1f1; padding: 20px; border-radius: 5px; font-weight: 500; font-size: 19px; max-width: 300px; margin: auto; text-align: center; color: #797777; line-height: normal;"><img src="' . WC_NEDARIM_PLUGIN_URL . '/assets/images/NewBit.png" style="border-radius:5px;width: 100px;" />
        <div style="border: 1px solid #e2e2e287; margin: 12px 0;"></div>
        <div id="BitData">
        <div style="font-size: 14px;" id="BitText1">העסקה הוקמה בהצלחה. <br/> קישור למעבר לאפליקציית ביט נשלח אליכם כעת בהודעת SMS <br/><br/>לא קבלתם SMS? סירקו את הקוד</div>
        <div id="BitQRCode" style="border-radius: 12px; padding: 7px; width: 150px; margin: auto; height: 150px;"></div>
        <div style="border: 1px solid #e2e2e287; margin: 12px 0;"></div>

        <div>
        <img id="WaitGif" src="' . WC_NEDARIM_PLUGIN_URL . '/assets/images/Wait.gif" style="width:50px;height: 44px;" />
        <div id="Error_CheckTransaction" style="color: indianred; font-weight: bolder;font-size: 16px;"></div>
        <div id="Bt_CheckTransaction" style="cursor: pointer;margin: 12px 0px; background: #f59e42; color: white; padding: 3px 0px; border-radius: 5px;  display: none; font-size: 14px;" onclick="CheckTransaction()">לחצו כאן לאחר סיום ביצוע התשלום באפליקציית ביט</div>
        </div>

        <div id="BitText2" style="font-size: 14px; color: #2993c1; font-weight: 700;">
        <span id="BitText2_ColorBlue">נא להשאיר דף זה פתוח.<br/> תועברו אוטומטית לשלב הבא לאחר סיום העסקה באפליקציית ביט </span>
        <div style="border: 1px solid #e2e2e287; margin: 14px 0;"></div>
         <span style="font-weight: 600; color: #d78686; font-size: 12px;">לא קבלתם SMS? הקישור נכשל? <br/>ניתן ללחוץ <u onclick="ReloadPage();" style=" cursor: pointer;">כאן</u> ליצירת עסקה חדשה</span></div>
        </div>
        </div>

<script>

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
	document.getElementById("BitQRCode").style.display = "none";
	document.getElementById("BitText1").innerHTML = "העסקה הוקמה בהצלחה, הנך מועבר לאפליקציה"
    setTimeout(function(){document.location.href = "' . $json_a['Message'] . '";},250);
} else {
    try {
		var QR_Url = "' . $json_a['Message'] . '";
		var s = document.createElement("script");
		s.setAttribute("src", "' . WC_NEDARIM_PLUGIN_URL . '/assets/images/qrcode.js?14");
		document.body.appendChild(s);
	} catch (err) {
		console.log(err)
		document.getElementById("BitQRCode").style.display = "none";
	}
}

        var CheckCount = 0;
        var CheckTransactionInterval = setInterval(function(){CheckTransaction()},1000 * 6)
        function CheckTransaction() {
            CheckCount++;
            document.getElementById("WaitGif").style.display = "inline-block"
            document.getElementById("Bt_CheckTransaction").style.display = "none"
            document.getElementById("Error_CheckTransaction").innerHTML = ""

            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    if (JSON.parse(xhttp.responseText).Status=="OK") {
                        window.parent.location.href="' . $RedirectUrl . '";
                        document.getElementById("BitData").innerHTML = "<span style=\'color:#4CAF50;\'>העסקה נרשמה בהצלחה!<br />נא להמתין, מעביר כעת לשלב הבא.</span>"
                        if (CheckCount < 20){
                            document.getElementById("WaitGif").style.display = "none"
                        }
                        return false;
                    }

                    if (CheckCount>=20){
                        setTimeout(function(){
                            document.getElementById("WaitGif").style.display = "none"
                            document.getElementById("Bt_CheckTransaction").style.display = "block"
                            document.getElementById("Error_CheckTransaction").innerHTML = JSON.parse(xhttp.responseText).Message
                        },2 * 1000)

                        clearInterval(CheckTransactionInterval)
                        CheckTransactionInterval = setInterval(function(){CheckTransaction(); },1000 * 60)
                    }

                    if (JSON.parse(xhttp.responseText).Status == "Error" && JSON.parse(xhttp.responseText).Message == "העסקה לא אושרה"){
                        clearInterval(CheckTransactionInterval)
                        document.getElementById("BitData").innerHTML = \'<span style="font-weight: 600; color: #d78686; font-size: 15px;">פג תוקף העסקה <br/>ניתן ללחוץ <u onclick="ReloadPage();" style=" cursor: pointer;">כאן</u> ליצירת עסקה חדשה</span>\'
                    }
                }
            }
            xhttp.open("GET", "https://www.matara.pro/nedarimplus/v6/Files/WebServices/DebitBit.aspx?Action=CheckTransaction&MosadId=' . $mosadsettings['mosadid'] . '&TransactionId=' . $json_a['PreTransactionId'] . '");
            xhttp.send();
            if (CheckCount>=20) {
                clearInterval(CheckTransactionInterval)
                document.getElementById("BitText2_ColorBlue").style.display = "none"
            };
        };
           
        function ReloadPage() {
            location.reload();
            document.getElementById("BitData").innerHTML = \'<img src="' . WC_NEDARIM_PLUGIN_URL . '/assets/images/Wait.gif" style="width:50px;" /><div style="font-size: 14px;">נא להמתין, מייצר עסקה חדשה.</div>\'
        }
    
</script>

        ';
    }
}



add_action('woocommerce_receipt_bitnedarim', 'CreateBitTransaction');


function check_response()
{
    $order_id = wc_clean(wp_unslash($_GET['order_id']));
    $order_key = wc_clean(wp_unslash($_GET['order_key']));
    $order = wc_get_order($order_id);
    $order_key = wc_clean(wp_unslash($_GET['order_key']));
    $CallBackToken = wc_clean(wp_unslash($_GET['CallBackToken']));

    if ($CallBackToken !== 'fsuewiriufdsfhkhsdf') {
        $order->add_order_note('CallBackToken validation error |' . $CallBackToken . '|');
    } else {
        $JsonData = "";
        if (isset($_POST['JsonData'])) {
            $JsonData = wc_clean(wp_unslash($_POST['JsonData']));
        }
        if (file_get_contents('php://input') !== '' && $JsonData == '') {
            $JsonData = file_get_contents('php://input');
        }

        $TransactionId = '';
        if ($JsonData !== '') {
            $json_a = json_decode($JsonData, true);

            if ($json_a["Status"] == "Error") {
                $order->add_order_note("שגיאת סליקה: " . $json_a["Message"]);
                exit();
            }

            $TransactionId = $json_a['TransactionId'];

            add_post_meta($order->get_id(), "TransactionId", $json_a['TransactionId'], false);
            add_post_meta($order->get_id(), "LastNum", $json_a['LastNum'], false);
            add_post_meta($order->get_id(), "Tokef", $json_a['Tokef'], false);
            add_post_meta($order->get_id(), "Confirmation", $json_a['Confirmation'], false);
            add_post_meta($order->get_id(), "TransactionTime", $json_a['TransactionTime'], false);
            add_post_meta($order->get_id(), "Tashloumim", $json_a['Tashloumim'], false);
            add_post_meta($order->get_id(), "Zeout", $json_a['Zeout'], false);
            add_post_meta($order->get_id(), "Shovar", $json_a['Shovar'], false);
            add_post_meta($order->get_id(), "Brand", $json_a['Brand'], false);
            add_post_meta($order->get_id(), "Manpik", $json_a['Manpik'], false);
            add_post_meta($order->get_id(), "Solek", $json_a['Solek'], false);
            add_post_meta($order->get_id(), "UID", $json_a['UID'], false);
            add_post_meta($order->get_id(), "ReceiptCreated", $json_a['ReceiptCreated'], false);
            add_post_meta($order->get_id(), "ReceiptData", $json_a['ReceiptData'], false);
        }
        $order->add_order_note("התשלום נרשם בהצלחה בשרתי נדרים פלוס.");
        $order->payment_complete($TransactionId);
        WC()->cart->empty_cart();
    }
    echo "<script>window.parent.location.href='" . $order->get_checkout_order_received_url() . "';</script>";
    exit();
}
add_action('woocommerce_api_wc_gateway_nedarim', 'check_response');
add_action('woocommerce_api_wc_gateway_bitnedarim', 'check_response');

function woocommerce_nedarim_plugin_links($links)
{
    $settings_url = add_query_arg(
        array(
            'page' => 'wc-settings',
            'tab' => 'checkout',
            'section' => 'wc_gateway_nedarim',
        ),
        admin_url('admin.php')
    );

    $plugin_links = array(
        '<a href="' . esc_url($settings_url) . '">הגדרות - אשראי</a>'
    );

    return array_merge($links, $plugin_links);
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'woocommerce_nedarim_plugin_links');

function woocommerce_bitnedarim_plugin_links($links)
{
    $settings_url = add_query_arg(
        array(
            'page' => 'wc-settings',
            'tab' => 'checkout',
            'section' => 'wc_gateway_bitnedarim',
        ),
        admin_url('admin.php')
    );

    $plugin_links = array(
        '<a href="' . esc_url($settings_url) . '">הגדרות - ביט</a>'
    );

    return array_merge($links, $plugin_links);
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'woocommerce_bitnedarim_plugin_links');

//Add the gateway to WooCommerce
function woocommerce_nedarim_add_gateway($methods)
{
    $methods[] = 'WC_Gateway_Nedarim';
    return $methods;
}

//Add the gateway to WooCommerce
function woocommerce_bitnedarim_add_gateway($methods)
{
    $methods[] = 'WC_Gateway_BitNedarim';
    return $methods;
}

// /* Add to WooCommerce Blocks */
// function woocommerce_add_payment_gateways_woocommerce_blocks(\Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry $payment_method_registry)
// {
//     $settings = get_option('woocommerce_nedarim_settings', []);
//     if (isset($settings['support_woocommerce_blocks']) && $settings['support_woocommerce_blocks'] == 'yes') {
//         require_once(plugin_basename('nedarim.php'));
//         $payment_method_instance = new \Automattic\WooCommerce\Blocks\Payments\Integrations\nedarim();
//         $payment_method_registry->register($payment_method_instance);
//     }
// }