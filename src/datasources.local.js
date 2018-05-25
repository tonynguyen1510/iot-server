/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-04-24 09:23:51
*------------------------------------------------------- */

module.exports = { // eslint-disable-line
	'mongod': {
		'host': process.env.MONGODB_HOST || '127.0.0.1',
		'port': process.env.MONGODB_PORT || 27017,
		'url': '',
		'database': process.env.MONGODB_DATABASE || 'codebase',
		'password': process.env.MONGODB_PASSWORD || '',
		'name': 'mongod',
		'user': process.env.MONGODB_USER || 'codebase',
		'connector': 'mongodb',
		'allowExtendedOperators': true
	},
	'firestore': {
		'name': 'firestore',
		'projectId': 'iot-demo-4dd93',
		'clientEmail': 'firebase-adminsdk-vn8e2@iot-demo-4dd93.iam.gserviceaccount.com',
		'privateKey': '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8FKxl7eM8a8yW\nQLubAX5+hVZmXpEKcA0WG7f1T+LULBlMaYKw43ocWEfcz81K+ey/lymYiIR0oxdY\nOCdjze1nW36ozuDKUofXKmkwZRMJ33RT5pZwQvwIRn/vhW6PgLI45yAgxJyentvp\nMNYOFhtyf3GiFI8GOFCYgAQic80AM0fFUwTKifQuDF7j90Kdi0jQCe63SEFECDwK\nRfcH6nE3OkiUfs0Tk3xFk2dG2tycKLFnNh1qtb+kDuIZ/a+vhSKpg2ILf/GSAjqT\nxxOKshwcRTJPpzhkYQtfd7yJ5TyxksNh/BhfA4mk0A4PVDyAEn5aqUyQXaSzA0Ry\nnJ9zu/jjAgMBAAECggEAFWmQc62gxF+3c9cHJMSyRyrcpRyYtvn+cL5oyUELihaX\n2LxduHq6tmBnP2CEYZ1Q0pfIkLOLdOXzwe4+rxz3grVcFvwv2QjgAI3fr4v082z2\nXEObwUh2/hAx/4MO4mqHSnV8Zw6gkBR2OoxTSljs+LJBWG+uasmy2fHKcWECp/DR\n7UO8AAvFpkHpBeFQVUuTWqQ7I1PuV1ZIYQitb0+msJcRcgME/GVg1M6hFetDsoAz\nGW5S6G43cgf0YdM2zZRN2Pp4TM0Gg6AT224jKx8Lez9sXtDO8c5siXOPP4N4Jpio\nVpHh+ZzZoNvLurB07sll52/VIra94aKWAp6tA3aVFQKBgQDoClrSPFAWrWxWIYDq\n92xMitGO15kIR8HgKFmzbAxVZV2algMJpByc4srhKO0XldbRIIUJnDc8L/z5OYJQ\nuhP1lag/SP+CvByvhUZC1it+ZYt4I2TTjva6XPeI8/NNGQr8Yx6wNHsuDx3EZhkR\nzWVKlza4b6E5a1S4ZQNbbI3k/QKBgQDPgE8yAidNULJEQCkUAbwIe75AikPP3VJz\nrAqRRyOvg7uXWg+JAy2E8/Fou830IVrOEF/UKZXpgMBVIrdKad9s7psy+sWgnZhK\n6AGmThmocuPlqNqDn7NC4jX5aiasB45N6+OXv/rrajuUhEcLrxRoqNZFviotOKwA\nygiykUurXwKBgQCoCXej8BF/mq9t4G1fuzYuaAlCDFfCa1S3ZAExsflsji+vFxu0\nC6i85HBPhjfMcLJUV9yADSTi7U2hnkgE9fwmSO7Chbajkl6jrTwogriUnCzYH6mQ\nm2OJqnGIOEHlf1E5XP6IVDkwLbo81EMrZTcJQWBbSFvVHSkJL/2yY3aOcQKBgDRB\nI7B8Sll2EO6PGckoBqo8P1URfLJEEhd/I8oiGCKDEiKzU2Y1nqj0pb6yTNNF8xAh\nn4BWWKJNAiJuc6oRr2pHTF4yOMKR7WAvvPqcgGmjRTD4rM6o0QPu45jD2qlH3dZR\nqSb1+cJ/JjHofdu7Y3BX1F4L3aM1ulsYhcgyPtQRAoGAN87JeMHJhobHGDxyJuoi\nMjFYzS2YDjJt8FPbG38cw9vsyHI/jOUJvXf4GSfxikLF77eq3XSoIn9qxt/9X5i6\ncfwcyoq8M26xdoxh79sJOxPEhE72xGGbNPG0SCDUFTl7+cvS//2RbavmWlE/gEA/\nUwqTjb2cO/odZHqJX1JOPI4=\n-----END PRIVATE KEY-----\n'
	},
	'emailDs': {
		'name': 'emailDs',
		'connector': 'mail',
		'transports': [
			{
				'type': 'smtp',
				'host': process.env.EMAIL_HOST || 'smtp.gmail.com',
				'secure': true,
				'port': 465,
				'tls': {
					'rejectUnauthorized': false
				},
				'auth': {
					'user': process.env.EMAIL || 'vnchove@gmail.com',
					'pass': process.env.EMAIL_PASSWORD || 've@2017vn'
				}
			}
		]
	},
	'storage': {
		'name': 'storage',
		'connector': 'loopback-component-storage',
		'provider': 'amazon',
		'acl': 'public-read',
		'key': process.env.S3_KEY || 'ZXOyW0R7pR3fDLsEBH5I735baTQUyydoin4MGg5C',
		'keyId': process.env.S3_KEY_ID || 'AKIAJ5IY6XMPCJQWYRRA',
		'maxFileSize': 20971520,
		'allowedContentTypes': [
			'image/jpg',
			'image/jpeg',
			'image/png',
			'image/tiff'
		]
	}
};
