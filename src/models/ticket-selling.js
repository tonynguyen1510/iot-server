export default function (TicketSelling) {
	TicketSelling.observe('before save', function (ctx, next) {
		const Tracking = TicketSelling.app.models.Tracking;
		const Email = TicketSelling.app.models.Email;
		const User = TicketSelling.app.models.user;
		const newData = ctx.instance || ctx.data;
		const oldData = ctx.currentInstance || {};
		const isNewInstance = ctx.isNewInstance;
		const closedSellerEmail = {
			subject: '[Chove]Bạn đã bán vé thành công',
			html: 'Bạn đã bán vé thành công',
		};
		const closedBuyerEmail = {
			subject: '[Chove]Bạn đã mua vé thành công',
			html: 'Bạn đã mua vé thành công',
		};
		const pendingBuyerEmail = {
			subject: '[Chove]Thông tin thanh toán',
			html: 'Vui lòng chuyển tiền vào tài khoản ABC để mua vé',
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
				type: 'Sell',
				ticket: { ...oldData.__data, ...newData },
			});

			Promise.all([
				_sendEmail(newData.sellerId, closedSellerEmail),
				_sendEmail(newData.buyerId, closedBuyerEmail),
			]).then(() => {
				next();
			});
		} else if (oldData.status !== 'Payment pending' && newData.status === 'Payment pending') {
			Tracking.create({
				userId: newData.buyerId,
				status: 'Payment pending',
				type: 'Sell',
				ticket: { ...oldData.__data, ...newData },
			});
			console.log('newData', newData);

			_sendEmail(newData.buyerId, pendingBuyerEmail).then(() => {
				next();
			});
		} else {
			next();
		}
	});
}
