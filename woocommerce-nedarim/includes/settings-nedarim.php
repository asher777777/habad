<?php
/**
 * Settings for Nedarim Gateway.
 *
 */

defined('ABSPATH') || exit;

return array(
	'enabled' => array(
		'title' => _Translate('Nedarim payment', 'תוסף נדרים פלוס בדף תשלום'),
		'type' => 'checkbox',
		'label' => _Translate('Enable', 'הפעל תוסף'),
		'default' => 'no',
	),
	'mosadid' => array(
		'title' => _Translate('MosadId', 'מספר מוסד - MosadId'),
		'type' => 'text',
		'description' => _Translate('Get your API Username from Nedarim.', 'צור קשר עם נדרים פלוס לקבלת שם משתמש וסיסמת אימות'),
		'default' => '',
		'desc_tip' => true,
	),
	'apivalid' => array(
		'title' => _Translate('ApiValid', 'סיסמת אימות - ApiValid'),
		'type' => 'text',
		'default' => '',
		'desc_tip' => true,
	),
	'title' => array(
		'title' => _Translate('Title', 'שם שיטת התשלום'),
		'type' => 'text',
		'description' => _Translate('This controls the title which the user sees during checkout.', 'שם שיטת התשלום שיופיע ללקוח לפני מעבר לדף תשלום '),
		'default' => _Translate('Nedarim', 'כרטיס אשראי'),
		'desc_tip' => true,
	),
	'description' => array(
		'title' => _Translate('Description', 'תיאור'),
		'type' => 'text',
		'desc_tip' => true,
		'description' => _Translate('This controls the description which the user sees during checkout.', 'שדה זה מאפשר שינוי הטקסט אשר מופיע ללקוחות לפני מעבר לדף תשלום'),
		'default' => _Translate("Pay securely by Credit or Debit Card through Nedarim.", 'תשלום מאובטח ע"י כרטיס אשראי - באמצעות נדרים פלוס'),
	),
	'numberpayments' => array(
		'title' => _Translate('Number of maximum payments', 'מספר תשלומים מקסימלי'),
		'type' => 'number',
		'default' => 1,
	),
	'language' => array(
		'title' => _Translate('Language', 'שפת האייפרם'),
		'type' => 'select',
		'default' => 'heb',
		'options' => array(
			'heb' => _Translate('Hebrew', 'עברית'),
			'en' => _Translate('English', 'אנגלית')
		)
	),
	'button_text' => array(
		'title' => _Translate('Button Text', 'טקסט לחצן תשלום'),
		'type' => 'text',
		'default' => _Translate('Proceed with Credit Card', 'המשך לתשלום באשראי'),
	),
	'show_cc_icon' => array(
		'title' => _Translate('Credit Card sign', 'סמלי כרטיס אשראי'),
		'type' => 'checkbox',
		'label' => _Translate('Show', 'הצג סמלים'),
		'default' => 'yes',	
	),
	'show_icon' => array(
		'title' => _Translate('Nedarim logo', 'לוגו נדרים פלוס'),
		'type' => 'checkbox',
		'label' => _Translate('Show', 'הצג לוגו'),
		'default' => 'yes',	
	),
	'group' => array(
		'title' => _Translate('Category', 'קטגוריה'),
		'type' => 'text',
		'desc_tip' => true,
		'description' => _Translate('This value will appear in backoffice,receipt,excel etc...', 'הנתון הזה יופיע בעמודה "קטגוריה" בממשק ובדוחות של נדרים פלוס.'),
		'default' => _Translate('Woocommerce', 'ווקומרס'),
	)	
);