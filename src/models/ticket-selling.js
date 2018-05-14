import loopback from 'loopback';
import cronjob from '../utils/cronjob';

const formatDate = (dirtyDate) => {
	const date = new Date(dirtyDate);

	return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export default function (TicketSelling) {

	TicketSelling.observe('before save', function (ctx, next) {
		const Email = TicketSelling.app.models.Email;
		const Tracking = TicketSelling.app.models.Tracking;
		const User = TicketSelling.app.models.user;
		const newData = ctx.instance || ctx.data;
		const oldData = ctx.currentInstance || {};
		const isNewInstance = ctx.isNewInstance;
		const _sendEmail = (user, email) => {
			const renderer = loopback.template(email.template);
			const html = renderer(email.params);

			return new Promise((resolve) => {
				Email.send({
					// to: 'maihuunhan30071992@gmail.com',
					to: user.email,
					from: `"${process.env.EMAIL_NAME || 'Chove Support Team'}" <${process.env.EMAIL || 'noreply@chove.vn'}>`,
					subject: email.subject,
					html,
				}, (err) => {
					if (err) {
						console.log('send email error', err);
						throw err;
					}
					console.log('send email success');
					resolve(true);
				});
			});
		};

		if (isNewInstance) {
			return next();
		}

		if (oldData.status !== 'closed' && newData.status === 'closed') {
			// console.log('oldData', oldData);
			// console.log('newData', newData);
			Tracking.create({
				userId: newData.contactId,
				action: newData.isBid ? 'bid-buy' : 'buy',
				status: 'closed',
				type: 'ticket-selling',
				ticket: { ...oldData.__data, ...newData },
			});

			if (newData.dataType === 'fb') {
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
				const closedBuyerEmail = {
					subject: '[Chove] Bạn đã bán vé thành công',
					template: 'src/email/ticket-selling-send-contactor-closed.ejs',
					params: {
						ticketSelling: {
							...newData,
							startDate: `${formatDate(newData.trip.startDate)} ${newData.trip.startTime}`,
							endDate: newData.tripBack ? `${formatDate(newData.tripBack.startDate)} ${newData.tripBack.startTime}` : '',
						},
					},
				};

				const closedSellerEmail = {
					subject: '[Chove] Bạn đã bán vé thành công',
					template: 'src/email/ticket-selling-send-creator-closed.ejs',
					params: { contactor },
				};

				Promise.all([
					_sendEmail(creator, closedSellerEmail),
					_sendEmail(contactor, closedBuyerEmail),
				]).then(() => {
					next();
				});
			});
		} else if (oldData.status !== 'pending' && newData.status === 'pending') {
			// Tracking.create({
			// 	userId: newData.contactId,
			// 	action: 'buy',
			// 	status: 'pending',
			// 	type: 'ticket-selling',
			// 	ticket: { ...oldData.__data, ...newData },
			// });

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
				const pendingBuyerEmail = {
					subject: '[Chove] Thông tin thanh toán',
					template: 'src/email/ticket-selling-send-contactor-pending.ejs',
					params: { code: `${contactor.fullName || ''} - ${newData.id || oldData.id}` },
				};

				const pendingSellerEmail = {
					subject: '[Chove] Thông tin người mua vé',
					template: 'src/email/ticket-selling-send-creator-pending.ejs',
					params: { contactor },
				};

				Promise.all([
					_sendEmail(contactor, pendingBuyerEmail),
					_sendEmail(creator, pendingSellerEmail),
				]).then(() => {
					next();
				});
			});
		} else if (oldData.isBid && oldData.status === 'pending' && (String(newData.contactId) !== String(oldData.contactId) || newData.price !== oldData.price)){
			User.findById(newData.contactId || oldData.contactId, (errUser, contactor) => {
				if (errUser) {
					console.log('errUser', errUser);
					throw errUser;
				}

				const pendingBuyerEmail = {
					subject: '[Chove] Thông tin thanh toán',
					template: 'src/email/ticket-bid-selling-send-contactor-pending.ejs',
					params: { code: `${contactor.fullName || ''} - ${newData.id || oldData.id}` },
				};

				_sendEmail(contactor, pendingBuyerEmail).then(() => {
					next();
				});
			});
		} else {
			next();
		}
	});

	TicketSelling.beforeRemote('find', (ctx, ticketSelling, next) => {
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
		}

		if (!newWhere.and.length) {
			newWhere.and = undefined;
		}

		ctx.args.filter.where = newWhere;
		next();
	});

	TicketSelling.afterRemote('create', (ctx, ticketSelling, next) => {
		if (ticketSelling.isBid) {
			cronjob.schedule(ticketSelling.dueDate, 'bid.update-status-pending', { ticketSellingId: ticketSelling.id, type: 'selling-bid' });
		}
		next();
	});

	TicketSelling.beforeRemote('create', (ctx, ticket, next) => {
		const FBFeed = TicketSelling.app.models.FBFeed;
		const { data: ticketSelling = {} } = ctx.args;

		if (ticketSelling.fbFeedId) {
			FBFeed.findById(ticketSelling.fbFeedId, (err, fbFeed) => {
				if (err) {
					throw err;
				}
				ticketSelling.fbFeed = fbFeed.toObject();
				ticketSelling.approved = true;
				ticketSelling.dueDate = ticketSelling.trip.startDate;

				fbFeed.status = 'approved';

				fbFeed.save({}, () => next());
			});
		} else {
			next();
		}
	});

	TicketSelling.resendTicket = (id, next) => {
		console.log('what the hell');
		const Email = TicketSelling.app.models.Email;
		const _sendEmail = (user, email) => {
			const renderer = loopback.template(email.template);
			const html = renderer(email.params);

			return new Promise((resolve) => {
				Email.send({
					to: 'maihuunhan30071992@gmail.com',
					// to: user.email,
					from: `"${process.env.EMAIL_NAME || 'Chove Support Team'}" <${process.env.EMAIL || 'noreply@chove.vn'}>`,
					subject: email.subject,
					template: email.template,
					html,
				}, (err) => {
					if (err) {
						console.log('send email error', err);
						throw err;
					}
					console.log('send email success');
					resolve(true);
				});
			});
		};

		TicketSelling.findById(id, { include: 'contact' }, (errTicket, ticketSelling) => {
			if (errTicket) {
				throw errTicket;
			}

			ticketSelling = ticketSelling.toObject(); //eslint-disable-line

			if (ticketSelling.status !== 'closed') {
				next();
			} else {
				const closedBuyerEmail = {
					subject: '[Chove] Bạn đã bán mua thành công',
					template: 'src/email/ticket-selling-send-contactor-closed.ejs',
					params: {
						ticketSelling: {
							...ticketSelling,
							startDate: `${formatDate(ticketSelling.trip.startDate)} ${ticketSelling.trip.startTime}`,
							endDate: ticketSelling.tripBack ? `${formatDate(ticketSelling.tripBack.startDate)} ${ticketSelling.tripBack.startTime}` : ''
						}
					},
				};

				_sendEmail(ticketSelling.contact, closedBuyerEmail).then(() => {
					next(null);
				});
			}

		});
	};
}
