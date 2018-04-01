export default function (BuyTicket) {

	BuyTicket.observe('before save', function (ctx, next) {
		const Tracking = BuyTicket.app.models.Tracking;
		const Email = BuyTicket.app.models.Email;
		const User = BuyTicket.app.models.user;
		const newData = ctx.instance || ctx.data;
		const oldData = ctx.currentInstance || {};
		const isNewInstance = ctx.isNewInstance;
		const closedSellerEmail = {
			subject: '[Chove]Thông tin người mua vé',
			html: 'Liên hệ với người mua vé thông qua email: abc@gmail hoặc SDT: 0123456789',
		};

		const _sendEmail = (userId, email) => {
			if (!userId) {
				return Promise.resolve(true);
			}

			return new Promise((resolve) => {
				User.findById(userId, (errUser, user) => {
					if (errUser) {
						console.log('can not find user');
						throw errUser;
					}

					Email.send({
						to: 'maihuunhan30071992@gmail.com',
						// to: user.email,
						from: 'noreply@chove.vn',
						subject: email.subject,
						html: email.html,
					}, (err) => {
						if (err) {
							console.log('send email error', err);
							throw err;
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
				status: 'Closed',
				type: 'Buy',
				ticket: { ...oldData.__data, ...newData },
			});

			_sendEmail(newData.sellerId, closedSellerEmail).then(() => {
				next();
			});
		} else if (oldData.status !== 'Payment pending' && newData.status === 'Payment pending') {
			Tracking.create({
				userId: newData.buyerId,
				status: 'Payment pending',
				type: 'Buy',
				ticket: { ...oldData.__data, ...newData },
			});

			next();
		} else {
			next();
		}
	});
}
