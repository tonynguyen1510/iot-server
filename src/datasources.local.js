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
