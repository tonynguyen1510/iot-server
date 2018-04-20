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
					User.findById(newData.contactId, (errUser, contactor) => {
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
				Email.send({
					// to: 'maihuunhan30071992@gmail.com',
					to: creator.email,
					from: 'noreply@chove.vn',
					subject: '[Chove]Thông tin người mua vé',
					html: `
						<div style="box-sizing:border-box;padding: 40px;max-width:768px;margin-top:auto;margin-bottom:auto;margin-right:auto;margin-left:auto;background-color:#4A9CD5;" >
							<div class="main-email" style="box-sizing:border-box;padding:20px;background-color:#fff;box-shadow:0px 0px 17px rgba(148, 148, 148, 0.2485);text-align:center;" >
								<img src="${User.app.get('webUrl')}/static/assets/images/logo/1x.png" alt="" style="box-sizing:border-box;max-width:120px;height:auto;padding-top:25px;padding-bottom:25px;padding-right:0;padding-left:0;" >
								<p>Vui lòng liên hệ với người mua vé thông qua</p>
								<div>
									<div>Email: ${contactor.email}</div>
									<div>SDT: ${contactor.phone}</div>
								</div>
								<div style="box-sizing:border-box;padding-bottom:20px;padding-right:0;padding-left:0;text-align:center;color:#7b7b7b;" >
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >25 Lạc Trung, Vĩnh Tuy, Hai Bà Trưng, Hà Nội.</p>
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >Hotline: 0913231019</p>
								</div>
							</div>

						</div>
					`,
				}, (errEmail) => {
					if (errEmail) {
						console.log('send email errEmailor', errEmail);
						throw errEmail;
					}
					next();
				});
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

				fbFeed.status = 'approved';

				fbFeed.save({}, () => next());
			});
		} else {
			next();
		}
	});
}
