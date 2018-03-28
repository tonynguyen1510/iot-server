export default function(Flight) {

	Flight.observe('before save', function (ctx, next) {
		const Tracking = Flight.app.models.Tracking;
		const Email = Flight.app.models.Email;
		const User = Flight.app.models.user;
		const newData = ctx.instance || ctx.data;
		const oldData = ctx.currentInstance || {};
		const isNewInstance = ctx.isNewInstance;

		const _sendEmail = (userId, html) => {
			if (!userId) {
				return Promise.resolve(true);
			}

			return new Promise((resolve) => {
				User.findById(userId, (user) => {
					Email.send({
						// to: 'maihuunhan30071992@gmail.com',
						to: user.email,
						from: 'noreply@chove.vn',
						subject: 'Transaction info',
						html: 'Transaction Info'
					}, (err) => {
						if (err) {
							console.log('send email error', err);
							return next(err);
						}
						console.log('send email success');
						resolve(true);
					});
				});
			});
		};

		if (isNewInstance) {
			return next();
		}

		if (oldData.status !== 'Closed' && newData.status === 'Closed') {
			Tracking.create({
				userId: newData.buyerId,
				action: 'payment success',
				flight: { ...oldData.__data, ...newData },
			});

			Promise.all([
				_sendEmail(newData.sellerId),
				_sendEmail(newData.buyerId),
			]).then(() => {
				next();
			});
		} else if (oldData.status !== 'Payment pending' && newData.status === 'Payment pending') {
			if (newData.type === 'Sell') {
				console.log('type sell payment pending');

				Tracking.create({
					userId: newData.buyerId,
					action: 'buy',
					flight: { ...oldData.__data, ...newData },
				});

				_sendEmail(newData.sellerId).then(() => {
					next();
				});
			} else if (newData.type === 'Buy') {
				console.log('type buy payment pending');

				Tracking.create({
					userId: newData.sellerId,
					action: 'sell',
					flight: { ...oldData.__data, ...newData },
				});

				_sendEmail(newData.buyerId).then(() => {
					next();
				});
			} else {
				next();
			}
		} else {
			next();
		}
	});
}
