/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 22018-02-12 00:53:35
*------------------------------------------------------- */

export default (app) => {
	const remotes = app.remotes();

	remotes.before('**', function (ctx, next) {
		const User = app.models.user;

		if (ctx.args.options && ctx.args.options.accessToken) {
			User.findById(ctx.args.options.accessToken.userId, { fields: { status: true } }, function (err, u) {
				if (err) {
					return next(err);
				}
				if (u && u.status === 'inactive') {
					// User.logout(ctx.args.options && ctx.args.options.accessToken.id);

					return next({
						code: 'ACCOUNT_DISABLED',
						message: 'Account has been disabled',
						name: 'Error',
						status: 401,
						statusCode: 401
					});
				}
				return next();
			});
			// next('logout');
		} else {
			next();
		}
	});
};
