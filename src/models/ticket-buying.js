export default function (TicketBuying) {
	TicketBuying.observe('before save', function (ctx, next) {
		const Tracking = TicketBuying.app.models.Tracking;
		const Email = TicketBuying.app.models.Email;
		const User = TicketBuying.app.models.user;
		const newData = ctx.instance || ctx.data;
		const oldData = ctx.currentInstance || {};
		const isNewInstance = ctx.isNewInstance;

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

			if (newData.dataType === 'fb' || oldData.dataType === 'fb') {
				return next();
			}

			Promise.all([
				new Promise((resolve) => {
					User.findById(newData.contactId || oldData.contactId, (errUser, contactor) => {
						if (errUser) {
							throw errUser;
						}
						resolve(contactor);
					});
				}),
				new Promise((resolve) => {
					User.findById(newData.creatorId || oldData.creatorId, (errUser, creator) => {
						if (errUser) {
							throw errUser;
						}
						resolve(creator);
					});
				}),

			]).then(([contactor, creator]) => {
				const _sendEmailToContactor = new Promise((resolve) => {
					Email.send({
						// to: 'maihuunhan30071992@gmail.com',
						to: contactor.email,
						from: `"${process.env.EMAIL_NAME || 'Chove Support Team'}" <${process.env.EMAIL || 'noreply@chove.vn'}>`,
						subject: '[Chove] Thông tin người mua vé',
						template: 'src/email/ticket-buying-send-contactor-closed.ejs',
						creator,
					}, (errEmail) => {
						if (errEmail) {
							console.log('send email errEmailor', errEmail);
							throw errEmail;
						}
						resolve();
					});
				});

				const _sendEmailToCreator = new Promise((resolve) => {
					Email.send({
						// to: 'maihuunhan30071992@gmail.com',
						to: creator.email,
						from: `"${process.env.EMAIL_NAME || 'Chove Support Team'}" <${process.env.EMAIL || 'noreply@chove.vn'}>`,
						subject: '[Chove] Đã có người đăng ký bán vé cho bạn',
						template: 'src/email/ticket-buying-send-creator-closed.ejs',
						contactor,
					}, (errEmail) => {
						if (errEmail) {
							console.log('send email errEmailor', errEmail);
							throw errEmail;
						}
						resolve();
					});
				});

				Promise.all([_sendEmailToContactor, _sendEmailToCreator]).then(() => next());
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
		if (!ctx.args.filter) {
			return next();
		}
		const { where = {} } = ctx.args.filter;
		const newWhere = {
			and: Object.keys(where).map((filterName) => {
				const filterValue = where[filterName];

				if (filterName.includes('trip')) {
					return {};
				}

				return { [filterName]: filterValue };
			}),
		};

		if (where['trip.startDate']) {
			// where['trip.startDate'].gte = new Date(where['trip.startDate'].gte);
			// where['trip.startDate'].lte = new Date(where['trip.startDate'].lte);

			newWhere.and.push({
				'trip.startDate': {
					gte: new Date(where['trip.startDate'].gte),
				},
			});
			newWhere.and.push({
				'trip.startDate': {
					lte: new Date(where['trip.startDate'].lte),
				},
			});
		}

		if (where.trip && where.trip.startDate) {
			newWhere.and.push({
				'trip.startDate': {
					gte: new Date(where.trip.startDate.gte),
				},
			});
			newWhere.and.push({
				'trip.startDate': {
					lte: new Date(where.trip.startDate.lte),
				},
			});
			// where['trip.startDate'] = {};
			// where['trip.startDate'].gte = new Date(where.trip.startDate.gte);
			// where['trip.startDate'].lte = new Date(where.trip.startDate.gte);
			// where.trip = undefined;
		}

		if (where['tripBack.startDate']) {
			newWhere.and.push({
				'tripBack.startDate': {
					gte: new Date(where['tripBack.startDate'].gte),
				},
			});
			newWhere.and.push({
				'tripBack.startDate': {
					lte: new Date(where['tripBack.startDate'].lte),
				},
			});
			// where['tripBack.startDate'].gte = new Date(where['tripBack.startDate'].gte);
			// where['tripBack.startDate'].lte = new Date(where['tripBack.startDate'].lte);
		}

		if (where.tripBack && where.tripBack.startDate) {
			newWhere.and.push({
				'tripBack.startDate': {
					gte: new Date(where.tripBack.startDate.gte),
				},
			});
			newWhere.and.push({
				'tripBack.startDate': {
					lte: new Date(where.tripBack.startDate.lte),
				},
			});
			// where['trip.startDate'] = {};
			// where['trip.startDate'].gte = new Date(where.trip.startDate.gte);
			// where['trip.startDate'].lte = new Date(where.trip.startDate.gte);
			// where.trip = undefined;
		}

		if (!newWhere.and.length) {
			newWhere.and = undefined;
		}
		ctx.args.filter.where = newWhere;
		console.log('ctx', ctx.args.filter.where.and);
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
				ticketBuying.fbFeed = fbFeed.toObject();
				ticketBuying.approved = true;
				ticketBuying.dueDate = ticketBuying.trip.startDate;

				fbFeed.status = 'approved';

				fbFeed.save({}, () => next());
			});
		} else {
			next();
		}
	});
}
