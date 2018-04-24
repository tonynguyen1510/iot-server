/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2017-12-05 14:08:29
*------------------------------------------------------- */

import loopback from 'loopback';
import boot from 'loopback-boot';
import morgan from 'morgan';
import PrettyError from 'pretty-error';
import bodyParser from 'body-parser';

export const app = loopback();

// require('loopback-counts-mixin')(app);

const prettyError = new PrettyError();

prettyError.start();

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
	app.use(morgan('tiny'));
}

app.start = function () {
	// start the web server
	return app.listen(function () {
		app.emit('started');
		const baseUrl = app.get('url').replace(/\/$/, '');

		console.log('REST API server listening at: %s', baseUrl);
		if (app.get('loopback-component-explorer')) {
			const explorerPath = app.get('loopback-component-explorer').mountPath;

			console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
		}
	});
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
	if (err) {
		throw err;
	}

	// start the server if `$ node server.js`
	if (require.main === module) {
		app.start();
	}
});
