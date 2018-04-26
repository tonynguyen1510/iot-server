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
						from: 'noreply@chove.vn',
						subject: '[Chove]Thông tin người mua vé',
						html: `
							<head>
								<link href='http://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>
							</head>
							<body>
								<div style="
									box-sizing:border-box;
									padding: 50px 80px;
									max-width: 768px;
									margin: auto;
									background-image: url('https://s3-ap-southeast-1.amazonaws.com/chove.vn/static/email-background.png');
									background-size: cover;
									font-family: Roboto;
								">

									<div style="
										box-sizing:border-box;
										padding:20px;
										background-color:#fff;
										box-shadow:0px 0px 17px rgba(148, 148, 148, 0.2485);
										text-align:center;
										color: #606060;
									">
										<img src="https://s3-ap-southeast-1.amazonaws.com/chove.vn/static/2x.png" width="200" />
										<h2 style="font-size: 28px">Chào mừng bạn đến với dịch vụ của Chợ vé</h2>
										<div style="font-size: 20px">Bạn đã đăng ký bán vé</div>
										<div style="font-size:16px; margin-top:30px; margin-bottom: 40px; line-height: 1.8">
											<div>Vui lòng liên hệ với người mua vé thông qua thông tin dưới đây</div>
											<div>
												<div>Tên: ${creator.fullName}</div>
												<div>Email: ${creator.email}</div>
												<div>SDT: ${creator.phone}</div>
											</div>
										</div>

										<div style="width: 150px; height: 1px; background: #D6D5D5; margin:auto"></div>
										<div style="font-size:20px; margin-top:15px;margin-bottom:40px;font-weight:700">Chợ vé Services team</div>
										<div>
											<p style="font-size:12px;color:#B2B2B2;">25 Lạc Trung, Vĩnh Tuy, Hai Bà Trưng, Hà Nội.</p>
											<p style="font-size:12px;color:#B2B2B2;">Hotline: 0913231019</p>
										</div>
									</div>
								</div>
							</body>
						`,
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
						from: 'noreply@chove.vn',
						subject: '[Chove]Đã có người đăng ký bán vé cho bạn',
						html: `
							<head>
								<link href='http://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>
							</head>
							<body>
								<div style="
									box-sizing:border-box;
									padding: 50px 80px;
									max-width: 768px;
									margin: auto;
									background-image: url('https://s3-ap-southeast-1.amazonaws.com/chove.vn/static/email-background.png');
									background-size: cover;
									font-family: Roboto;
								">

									<div style="
										box-sizing:border-box;
										padding:20px;
										background-color:#fff;
										box-shadow:0px 0px 17px rgba(148, 148, 148, 0.2485);
										text-align:center;
										color: #606060;
									">
										<img src="https://s3-ap-southeast-1.amazonaws.com/chove.vn/static/2x.png" width="200" />
										<h2 style="font-size: 28px">Chào mừng bạn đến với dịch vụ của Chợ vé</h2>
										<div style="font-size: 20px">Chúc mừng đã có người đăng ký để bán vé cho bạn</div>
										<div style="font-size:16px; margin-top:30px; margin-bottom: 40px; line-height: 1.8">
											<div>Vui lòng liên hệ với người bán vé thông qua thông tin dưới đây</div>
											<div>
												<div>Tên: ${contactor.fullName}</div>
												<div>Email: ${contactor.email}</div>
												<div>SDT: ${contactor.phone}</div>
											</div>
										</div>

										<div style="width: 150px; height: 1px; background: #D6D5D5; margin:auto"></div>
										<div style="font-size:20px; margin-top:15px;margin-bottom:40px;font-weight:700">Chợ vé Services team</div>
										<div>
											<p style="font-size:12px;color:#B2B2B2;">25 Lạc Trung, Vĩnh Tuy, Hai Bà Trưng, Hà Nội.</p>
											<p style="font-size:12px;color:#B2B2B2;">Hotline: 0913231019</p>
										</div>
									</div>
								</div>
							</body>
						`,
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

				fbFeed.status = 'approved';

				fbFeed.save({}, () => next());
			});
		} else {
			next();
		}
	});
}
