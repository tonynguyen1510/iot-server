export default function(Flight) {

	Flight.observe('before save', function (ctx, next) {
		const Tracking = Flight.app.models.Tracking;
		const Email = Flight.app.models.Email;
		const User = Flight.app.models.user;
		const isNewInstance = ctx.isNewInstance;
		const flight = ctx.instance || ctx.data;
		const _sendMail = (userId, html) => {
			return new Promise((resolve) => {
				User.findById(userId, (user) => {
					// FIX ME: Update from email
					Email.send({
						to: user.email,
						from: 'noreply@chove.vn',
						subject: 'Email confirm transaction',
						html: html
					}, (err) => {
						if (err) {
							console.log('err', err);
							resolve(false);
						} else {
							resolve(true);
						}
					});
				});
			});
		};

		if (isNewInstance) {
			return next();
		}

		if (flight.status === 'closed') {
			Tracking.create({
				userId: flight.sellerId,
				flight: { ...flight },
			});
			Promise.all([
				_sendMail(flight.sellerId),
				_sendMail(flight.buyerId)
			]).then((result) => {
				if (result.every((item) => !!item)) {
					next();
				} else {
					next(new Error('send email error'));
				}
			});
		} else if (flight.status === 'pending-payment') {
			if (flight.type === 'sell') {
				Tracking.create({
					userId: flight.sellerId,
					flight: { ...flight },
				});
				_sendMail(flight.sellerId).then((result) => {
					if (result) {
						next();
					} else {
						next(new Error('send email error'));
					}
				});
			} else if (flight.type === 'buy') {
				Tracking.create({
					userId: flight.buyerId,
					flight: { ...flight },
				});
				_sendMail(flight.buyerId).then((result) => {
					if (result) {
						next();
					} else {
						next(new Error('send email error'));
					}
				});
			}
		} else {
			next();
		}
	});

}
