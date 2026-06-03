<?php
/**
 * Settings for BitNedarim Gateway.
 *
 */

defined('ABSPATH') || exit;

return array(
	'enabled' => array(
		'title' => _Translate('BitNedarim payment', 'תוסף ביט בדף תשלום'),
		'type' => 'checkbox',
		'label' => _Translate('Enable', 'הפעל תוסף'),
		'default' => 'no',
	),
	'mosadid' => array(
		'title' => _Translate('MosadId', 'מספר מוסד - MosadId'),
		'type' => 'select',
		'description' => _Translate('Get your API Username from Nedarim.', 'צור קשר עם נדרים פלוס לקבלת שם משתמש וסיסמת אימות'),
		'default' => '----',
		'desc_tip' => true,
		'options' => array(
			'----' => '---- יש להגדיר נתון זה בהגדרות כרטיס אשראי',
		)
	),
	'apivalid' => array(
		'title' => _Translate('ApiValid', 'סיסמת אימות - ApiValid'),
		'type' => 'select',
		'default' => '----',
		'options' => array(
			'----' => '---- יש להגדיר נתון זה בהגדרות כרטיס אשראי',
		)
	),
	'title' => array(
		'title' => _Translate('Title', 'שם שיטת התשלום'),
		'type' => 'text',
		'description' => _Translate('This controls the title which the user sees during checkout.', 'שם שיטת התשלום שיופיע ללקוח לפני מעבר לדף תשלום '),
		'default' => _Translate('BitNedarim', 'ביט'),
		'desc_tip' => true,
	),
	'description' => array(
		'title' => _Translate('Description', 'תיאור'),
		'type' => 'text',
		'desc_tip' => true,
		'description' => _Translate('This controls the description which the user sees during checkout.', 'שדה זה מאפשר שינוי הטקסט אשר מופיע ללקוחות לפני מעבר לדף תשלום'),
		'default' => _Translate("Pay securely by Credit or Debit Card through BitNedarim.", 'תשלום באמצעות אפליקציית ביט'),
	),
	'button_text' => array(
		'title' => _Translate('Button Text', 'טקסט לחצן תשלום'),
		'type' => 'text',
		'default' => _Translate('Proceed with Credit Card', 'המשך לתשלום עם ביט'),
	),
	'show_bit_icon' => array(
		'title' => _Translate('Bit logo', 'לוגו ביט'),
		'type' => 'checkbox',
		'label' => _Translate('Show', 'הצג לוגו'),
		'default' => 'yes',	
	)
);