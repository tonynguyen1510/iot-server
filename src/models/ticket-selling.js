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
			return new Promise((resolve) => {
				Email.send({
					// to: 'maihuunhan30071992@gmail.com',
					to: user.email,
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
				const webUrl = TicketSelling.app.get('webUrl');
				const closedBuyerEmail = {
					subject: '[Chove]Bạn đã bán vé thành công',
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
								background-image: url('${webUrl}/static/assets/images/email-background.png');
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
									<img src="${webUrl}/static/assets/images/logo/2x.png" width="200" />
									<h2 style="font-size: 28px">Chào mừng bạn đến với dịch vụ của Chợ vé</h2>
									<div style="font-size: 20px">Chúc mừng bạn đã mua vé thành công</div>
									<div style="font-size:16px; margin-top:30px; margin-bottom: 40px; line-height: 1.8">
										<div>Thông tin vé</div>
										<div>
											<div><b>Loại vé:</b> ${newData.flightType === 'oneWay' ? 'Một chiều' : 'Khứ hồi'}</div>
											<div><b>Số vé:</b> ${newData.seatCount}</div>
											<div><b>Điểm đi:</b> ${newData.trip.departure}</div>
											<div><b>Điểm đến:</b> ${newData.trip.destination}</div>
											<div><b>Ngày đi:</b> ${formatDate(newData.trip.startDate)} ${newData.trip.startTime}</div>
											<div><b>Ngày về:</b> ${newData.tripBack ? formatDate(newData.tripBack.startDate) : ''} ${newData.tripBack ? newData.tripBack.startTime : ''}<div>
											<div><b>Loại ghế:</b> ${newData.seatType} </div>
											<div><b>Số kg mang theo:</b> ${newData.packageWeight} </div>
											<div><b>Hãng bay:</b> ${newData.airline}</div>
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
					`
				};

				const closedSellerEmail = {
					subject: '[Chove]Bạn đã bán vé thành công',
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
								background-image: url('${webUrl}/static/assets/images/email-background.png');
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
									<img src="${webUrl}/static/assets/images/logo/2x.png" width="200" />
									<h2 style="font-size: 28px">Chào mừng bạn đến với dịch vụ của Chợ vé</h2>
									<div style="font-size: 20px">Chúc mừng đã có người mua vé của bạn</div>
									<div style="font-size:16px; margin-top:30px; margin-bottom: 40px; line-height: 1.8">
										<div>Vui lòng liên hệ với người mua vé thông qua thông tin dưới đây</div>
										<div>
											<div><b>Tên:</b> ${contactor.fullName}</div>
											<div><b>Email:</b> ${contactor.email}</div>
											<div><b>SDT:</b> ${contactor.phone}</div>
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
				const webUrl = TicketSelling.app.get('webUrl');
				const pendingBuyerEmail = {
					subject: '[Chove]Thông tin thanh toán',
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
								background-image: url('${webUrl}/static/assets/images/email-background.png');
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
									<img src="${webUrl}/static/assets/images/logo/2x.png" width="200" />
									<h2 style="font-size: 28px">Chào mừng bạn đến với dịch vụ của Chợ vé</h2>
									<div style="font-size: 20px">Bạn đã đăng ký mua vé thành công</div>
									<div style="font-size:16px; margin-top:30px; margin-bottom: 40px; line-height: 1.8">
										<div>Chúc mừng bạn đã đăng ký mua vé thành công trên hệ thống chove.vn</div>
										<div>Để có thể nhận được vé. Vui lòng chuyển tiền đến tài khoản Chove với nội dung: "${contactor.fullName || ''} - ${newData.id || oldData.id}"</div>

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
				};

				const pendingSellerEmail = {
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
								background-image: url('${webUrl}/static/assets/images/email-background.png');
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
									<img src="${webUrl}/static/assets/images/logo/2x.png" width="200" />
									<h2 style="font-size: 28px">Chào mừng bạn đến với dịch vụ của Chợ vé</h2>
									<div style="font-size: 20px">Thông tin người mua vé</div>
									<div style="font-size:16px; margin-top:30px; margin-bottom: 40px; line-height: 1.8">
										<div>Chúc mừng đã có người đăng ký mua vé của bạn. Vui lòng liên hệ với người mua vé thông qua thông tin dưới đây</div>
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
				};

				Promise.all([
					_sendEmail(contactor, pendingBuyerEmail),
					_sendEmail(creator, pendingSellerEmail),

				]);
			});
		} else if (oldData.isBid && oldData.status === 'pending' && (String(newData.contactId) !== String(oldData.contactId) || newData.price !== oldData.price)){
			User.findById(newData.contactId || oldData.contactId, (errUser, contactor) => {
				if (errUser) {
					console.log('errUser', errUser);
					throw errUser;
				}

				const webUrl = TicketSelling.app.get('webUrl');
				const pendingBuyerEmail = {
					subject: '[Chove]Thông tin thanh toán',
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
								background-image: url('${webUrl}/static/assets/images/email-background.png');
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
									<img src="${webUrl}/static/assets/images/logo/2x.png" width="200" />
									<h2 style="font-size: 28px">Chào mừng bạn đến với dịch vụ của Chợ vé</h2>
									<div style="font-size: 20px">Bạn đã đấu giá thành công</div>
									<div style="font-size:16px; margin-top:30px; margin-bottom: 40px; line-height: 1.8">
										<div>Chúc mừng bạn đã đấu giá thành công trên hệ thống chove.vn</div>
										<div>Để có thể nhận được vé. Vui lòng chuyển tiền đến tài khoản Chove với nội dung: "${contactor.fullName || ''} - ${newData.id || oldData.id}"</div>

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

	TicketSelling.beforeRemote('create', (ctx, ticketSelling, next) => {
		const FBFeed = TicketSelling.app.models.FBFeed;

		if (ticketSelling.fbFeedId) {
			FBFeed.findById(ticketSelling.fbFeedId, (fbFeed) => {
				ticketSelling.fbFeed = fbFeed.toObject();
				ticketSelling.approved = true;

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
					// to: 'maihuunhan30071992@gmail.com',
					to: user.email,
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

			ticketSelling = ticketSelling.toObject(); //eslint-disable-line

			if (ticketSelling.status !== 'closed') {
				next();
			} else {
				const webUrl = TicketSelling.app.get('webUrl');
				const closedBuyerEmail = {
					subject: '[Chove]Bạn đã bán vé thành công',
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
								background-image: url('${webUrl}/static/assets/images/email-background.png');
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
									<img src="${webUrl}/static/assets/images/logo/2x.png" width="200" />
									<h2 style="font-size: 28px">Chào mừng bạn đến với dịch vụ của Chợ vé</h2>
									<div style="font-size: 20px">Chúc mừng bạn đã mua vé thành công</div>
									<div style="font-size:16px; margin-top:30px; margin-bottom: 40px; line-height: 1.8">
										<div>Thông tin vé</div>
										<div>
											<div><b>Loại vé:</b> ${ticketSelling.flightType === 'oneWay' ? 'Một chiều' : 'Khứ hồi'}</div>
											<div><b>Số vé:</b> ${ticketSelling.seatCount}</div>
											<div><b>Điểm đi:</b> ${ticketSelling.trip.departure}</div>
											<div><b>Điểm đến:</b> ${ticketSelling.trip.destination}</div>
											<div><b>Ngày đi:</b> ${formatDate(ticketSelling.trip.startDate)} ${ticketSelling.trip.startTime}</div>
											<div><b>Ngày về:</b> ${ticketSelling.tripBack ? formatDate(ticketSelling.tripBack.startDate) : ''} ${ticketSelling.tripBack ? ticketSelling.tripBack.startTime : ''}<div>
											<div><b>Loại ghế:</b> ${ticketSelling.seatType} </div>
											<div><b>Số kg mang theo:</b> ${ticketSelling.packageWeight} </div>
											<div><b>Hãng bay:</b> ${ticketSelling.airline}</div>
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
					`
				};

				_sendEmail(ticketSelling.contact, closedBuyerEmail).then(() => {
					next(null);
				});
			}

		});
	};
}
