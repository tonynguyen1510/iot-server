import cronjob from '../utils/cronjob';

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

		if (oldData.status !== 'closed' && newData.status === 'closed') {
			Tracking.create({
				userId: newData.contactId,
				status: 'Closed',
				type: 'Sell',
				ticket: { ...oldData.__data, ...newData },
			});

			Promise.all([
				_sendEmail(newData.creatorId, closedSellerEmail),
				_sendEmail(newData.contactId, closedBuyerEmail),
			]).then(() => {
				next();
			});
		} else if (oldData.status !== 'pending' && newData.status === 'pending') {
			Tracking.create({
				userId: newData.contactId,
				status: 'Payment pending',
				type: 'Sell',
				ticket: { ...oldData.__data, ...newData },
			});

			_sendEmail(newData.contactId, pendingBuyerEmail).then(() => {
				next();
			});
		} else if (oldData.isBid && oldData.status === 'pending' && (String(newData.contactId) !== String(oldData.contactId) || newData.price !== oldData.price)){
			_sendEmail(newData.contactId, pendingBuyerEmail).then(() => {
				next();
			});
		} else {
			next();
		}
	});

	TicketSelling.beforeRemote('find', (ctx, ticketSelling, next) => {
		const { where } = ctx.args.filter;

		if (where['trip.startDate']) {
			where['trip.startDate'].gte = new Date(where['trip.startDate'].gte);
			where['trip.startDate'].lte = new Date(where['trip.startDate'].lte);
		}

		if (where['tripBack.startDate']) {
			where['tripBack.startDate'].gte = new Date(where['tripBack.startDate'].gte);
			where['tripBack.startDate'].lte = new Date(where['tripBack.startDate'].lte);
		}

		next();
	});

	TicketSelling.afterRemote('create', (ctx, ticketSelling, next) => {
		if (ticketSelling.isBid) {
			cronjob.schedule(ticketSelling.bidDueDate, 'bid.update-status-pending', { ticketSellingId: ticketSelling.id, type: 'selling-bid' });
		}
		next();
	});
}
