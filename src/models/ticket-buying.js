export default function (TicketBuying) {

	TicketBuying.observe('before save', function (ctx, next) {
		const Tracking = TicketBuying.app.models.Tracking;
		const Email = TicketBuying.app.models.Email;
		const User = TicketBuying.app.models.user;
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

		if (oldData.status !== 'closed' && newData.status === 'closed') {
			Tracking.create({
				userId: newData.contactId,
				action: newData.isBid ? 'bid-sell' : 'sell',
				status: 'closed',
				type: 'ticket-buying',
				ticket: { ...oldData.__data, ...newData },
			});

			_sendEmail(newData.sellerId, closedSellerEmail).then(() => {
				next();
			});
		} else if (oldData.status !== 'pending' && newData.status === 'pending') {
			// Tracking.create({
			// 	userId: newData.buyerId,
			// 	status: 'Payment pending',
			// 	type: 'Buy',
			// 	ticket: { ...oldData.__data, ...newData },
			// });

			next();
		} else {
			next();
		}
	});

	TicketBuying.beforeRemote('find', (ctx, ticketBuying, next) => {
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

	TicketBuying.beforeRemote('create', (ctx, ticket, next) => {
		const FBFeed = TicketBuying.app.models.FBFeed;
		const { data: ticketBuying = {} } = ctx.args;

		if (ticketBuying.fbFeedId) {
			FBFeed.findById(ticketBuying.fbFeedId, (err, fbFeed) => {
				if (err) {
					throw err;
				}
				console.log('fbFeed', fbFeed);
				ticketBuying.fbFeed = fbFeed.toObject();

				fbFeed.status = 'approved';

				fbFeed.save({}, () => next());
			});
		} else {
			next();
		}
	});
}
