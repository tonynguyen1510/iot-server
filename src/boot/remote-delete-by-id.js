/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-03-08 11:35:34
*------------------------------------------------------- */

export default function (app) {
	const remotes = app.remotes();

	// Set X-Total-Count for all search requests
	remotes.before('*.deleteById', function (ctx, next) {
		this.findById(ctx.args.id, (err, instance) => {
			if (err) {
				return next(err);
			}
			ctx.args = { ...ctx.args, instance };
			next();
		});
	});

	remotes.after('*.deleteById', function (ctx, next) {
		ctx.result = {
			...ctx.result,
			id: ctx.args.id,
			instance: ctx.args.instance,
		};
		next();
	});
}

