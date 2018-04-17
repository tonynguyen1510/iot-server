import cronjob from '../utils/cronjob';

export default function (TicketSelling) {

	TicketSelling.observe('before save', function (ctx, next) {
		const Email = TicketSelling.app.models.Email;
		const Tracking = TicketSelling.app.models.Tracking;
		const User = TicketSelling.app.models.user;
		const newData = ctx.instance || ctx.data;
		const oldData = ctx.currentInstance || {};
		const isNewInstance = ctx.isNewInstance;
		const _sendEmail = (user, email) => {
			return new Promise((resolve) => {
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
		};

		if (isNewInstance) {
			return next();
		}

		if (oldData.status !== 'closed' && newData.status === 'closed') {
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
					User.findById(newData.contactId, (errUser, contactor) => {
						if (errUser) {
							throw errUser;
						}
						resolve(contactor);
					});
				}),
				new Promise((resolve) => {
					User.findById(newData.creatorId, (errUser, creator) => {
						if (errUser) {
							throw errUser;
						}
						resolve(creator);
					});
				}),

			]).then(([contactor, creator]) => {
				const closedBuyerEmail = {
					subject: '[Chove]Bạn đã bán vé thành công',
					html: `
						<h1>Chúc mừng</h1>
						<p>Bạn đã đặt vé thành công</p>
						<p>Thông tin vé</p>
						<ul>
							<li>Loại vé: ${newData.flightType === 'oneWay' ? 'Một chiều' : 'Khứ hồi'}</li>
							<li>Số vé: ${newData.seatCount}</li>
							<li>Điểm đi: ${newData.departure}</li>
							<li>Điểm đến: ${newData.destination}</li>
							<li>Ngày đi: ${newData.trip.startDate} ${newData.trip.startTime}</li>
							<li>Ngày về: ${newData.tripBack ? newData.tripBack.startDate : ''} ${newData.tripBack ? newData.tripBack.startTime : ''}<li>
							<li>Loại ghế: ${newData.seatType} </li>
							<li>Số kg mang theo: ${newData.packageWeight} </li>
							<li>Hãng bay: ${newData.airline}</li>
						</ul>
					`,
				};

				const closedSellerEmail = {
					subject: '[Chove]Bạn đã bán vé thành công',
					html: `
						<h1>Chúc mừng</h1>
						<p>Bạn đã đặt vé thành công</p>
						<p>Thông tin người mua</p>
						<ul>
							<li>Tên: ${contactor.fullName}</li>
							<li>Email: ${contactor.email}</li>
							<li>SDT: ${contactor.phone}</li>
						</ul>
					`
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

			User.findById(newData.contactId, (errUser, contactor) => {
				if (errUser) {
					console.log('errUser', errUser);
				}

				const pendingBuyerEmail = {
					subject: '[Chove]Thông tin thanh toán',
					html: `
						<h1>Xin chào</h1>
						<p>Bạn vừa đặt vé thành công trên hệ thống chove.vn.</p>
						<p>Để nhận được vé, vui lòng chuyển tiền đến tài khoản ABCDEF với nội dung: "${contactor.fullName} - ${newData.id}"</p>
					`,
				};

				_sendEmail(contactor, pendingBuyerEmail).then(() => {
					next();
				});
			});

		} else if (oldData.isBid && oldData.status === 'pending' && (String(newData.contactId) !== String(oldData.contactId) || newData.price !== oldData.price)){
			User.findById(newData.contactId, (errUser, contactor) => {
				if (errUser) {
					console.log('errUser', errUser);
				}

				const pendingBuyerEmail = {
					subject: '[Chove]Thông tin thanh toán',
					html: `
						<h1>Xin chào</h1>
						<p>Bạn đã đấu giá thành công thành công trên hệ thống chove.vn.</p>
						<p>Để nhận được vé, vui lòng chuyển tiền đến tài khoản ABCDEF với nội dung: "${contactor.fullName} - ${newData.id}"</p>
					`,
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
		const { where } = ctx.args.filter;
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
			cronjob.schedule(ticketSelling.bidDueDate, 'bid.update-status-pending', { ticketSellingId: ticketSelling.id, type: 'selling-bid' });
		}
		next();
	});

	TicketSelling.beforeRemote('create', (ctx, ticketSelling, next) => {
		const FBFeed = TicketSelling.app.models.FBFeed;

		if (ticketSelling.fbFeedId) {
			FBFeed.findById(ticketSelling.fbFeedId, (fbFeed) => {
				ticketSelling.fbFeed = fbFeed.toObject();

				fbFeed.status = 'approved';

				fbFeed.save({}, () => next());
			});
		} else {
			next();
		}
	});

	TicketSelling.resendTicket = (id, next) => {
		const Email = TicketSelling.app.models.Email;
		const _sendEmail = (user, email) => {
			return new Promise((resolve) => {
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
		};

		TicketSelling.findById(id, { include: 'contact' }, (errTicket, ticketSelling) => {
			if (errTicket) {
				throw errTicket;
			}

			if (ticketSelling.status !== 'closed') {
				next();
			} else {
				const closedBuyerEmail = {
					subject: '[Chove]Bạn đã bán vé thành công',
					html: `
						<h1>Chúc mừng</h1>
						<p>Bạn đã đặt vé thành công</p>
						<p>Thông tin vé</p>
						<ul>
							<li>Loại vé: ${ticketSelling.flightType === 'oneWay' ? 'Một chiều' : 'Khứ hồi'}</li>
							<li>Số vé: ${ticketSelling.seatCount}</li>
							<li>Điểm đi: ${ticketSelling.trip.departure}</li>
							<li>Điểm đến: ${ticketSelling.trip.destination}</li>
							<li>Ngày đi: ${ticketSelling.trip.startDate} ${ticketSelling.trip.startTime}</li>
							<li>Ngày về: ${ticketSelling.tripBack ? ticketSelling.tripBack.startDate : ''} ${ticketSelling.tripBack ? ticketSelling.tripBack.startTime : ''}<li>
							<li>Loại ghế: ${ticketSelling.seatType} </li>
							<li>Số kg mang theo: ${ticketSelling.packageWeight} </li>
							<li>Hãng bay: ${ticketSelling.airline}</li>
						</ul>
					`,
				};

				_sendEmail(ticketSelling.contact, closedBuyerEmail).then(() => {
					next(null);
				});
			}

		});
	};
}
