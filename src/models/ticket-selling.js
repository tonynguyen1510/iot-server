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
						<div style="box-sizing:border-box;padding: 40px;max-width:768px;margin-top:auto;margin-bottom:auto;margin-right:auto;margin-left:auto;background-color:#4A9CD5;" >
							<div class="main-email" style="box-sizing:border-box;padding:20px;background-color:#fff;box-shadow:0px 0px 17px rgba(148, 148, 148, 0.2485);text-align:center;" >
								<img src="${User.app.get('webUrl')}/static/assets/images/logo/1x.png" alt="" style="box-sizing:border-box;max-width:120px;height:auto;padding-top:25px;padding-bottom:25px;padding-right:0;padding-left:0;" >
								<p>Vui lòng liên hệ với người mua vé thông qua</p>
								<div>
									<h1>Chúc mừng</h1>
									<p>Bạn đã đặt vé thành công</p>
									<p>Thông tin vé</p>
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
								<div style="box-sizing:border-box;padding-bottom:20px;padding-right:0;padding-left:0;text-align:center;color:#7b7b7b;" >
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >25 Lạc Trung, Vĩnh Tuy, Hai Bà Trưng, Hà Nội.</p>
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >Hotline: 0913231019</p>
								</div>
							</div>
						</div>
					`
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
					throw errUser;
				}

				const pendingBuyerEmail = {
					subject: '[Chove]Thông tin thanh toán',
					html: `
						<div style="box-sizing:border-box;padding: 40px;max-width:768px;margin-top:auto;margin-bottom:auto;margin-right:auto;margin-left:auto;background-color:#f9fafc;" >
							<div class="main-email" style="box-sizing:border-box;padding:20px;background-color:#fff;box-shadow:0px 0px 17px rgba(148, 148, 148, 0.2485);text-align:center;" >
								<img src="http://35.201.229.48:3004/static/assets/images/logo/1x.png" alt="" style="box-sizing:border-box;max-width:120px;height:auto;padding-top:25px;padding-bottom:25px;padding-right:0;padding-left:0;" >
								<p>Vui lòng liên hệ với người mua vé thông qua</p>
								<div>
									<h1>Xin chào</h1>
									<p>Bạn vừa đặt vé thành công trên hệ thống chove.vn.</p>
									<p>Để nhận được vé, vui lòng chuyển tiền đến tài khoản ABCDEF với nội dung: "${contactor.fullName || ''} - ${newData.id || oldData.id}"</p>
								</div>
								<div style="box-sizing:border-box;padding-bottom:20px;padding-right:0;padding-left:0;text-align:center;color:#7b7b7b;" >
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >25 Lạc Trung, Vĩnh Tuy, Hai Bà Trưng, Hà Nội.</p>
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >Hotline: 0913231019</p>
								</div>
							</div>

						</div>
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
					throw errUser;
				}

				const pendingBuyerEmail = {
					subject: '[Chove]Thông tin thanh toán',
					html: `
						<div style="box-sizing:border-box;padding: 40px;max-width:768px;margin-top:auto;margin-bottom:auto;margin-right:auto;margin-left:auto;background-color:#f9fafc;" >
							<div class="main-email" style="box-sizing:border-box;padding:20px;background-color:#fff;box-shadow:0px 0px 17px rgba(148, 148, 148, 0.2485);text-align:center;" >
								<img src="http://35.201.229.48:3004/static/assets/images/logo/1x.png" alt="" style="box-sizing:border-box;max-width:120px;height:auto;padding-top:25px;padding-bottom:25px;padding-right:0;padding-left:0;" >
								<p>Vui lòng liên hệ với người mua vé thông qua</p>
								<div>
									<h1>Xin chào</h1>
									<p>Bạn đã đấu giá thành công thành công trên hệ thống chove.vn.</p>
									<p>Để nhận được vé, vui lòng chuyển tiền đến tài khoản ABCDEF với nội dung: "${contactor.fullName} - ${newData.id}"</p>
								</div>
								<div style="box-sizing:border-box;padding-bottom:20px;padding-right:0;padding-left:0;text-align:center;color:#7b7b7b;" >
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >25 Lạc Trung, Vĩnh Tuy, Hai Bà Trưng, Hà Nội.</p>
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >Hotline: 0913231019</p>
								</div>
							</div>

						</div>
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
				const closedBuyerEmail = {
					subject: '[Chove]Bạn đã bán vé thành công',
					html: `
						<div style="box-sizing:border-box;padding: 40px;max-width:768px;margin-top:auto;margin-bottom:auto;margin-right:auto;margin-left:auto;background-color:#4A9CD5;" >
							<div class="main-email" style="box-sizing:border-box;padding:20px;background-color:#fff;box-shadow:0px 0px 17px rgba(148, 148, 148, 0.2485);text-align:center;" >
								<img src="${TicketSelling.app.get('webUrl')}/static/assets/images/logo/1x.png" alt="" style="box-sizing:border-box;max-width:120px;height:auto;padding-top:25px;padding-bottom:25px;padding-right:0;padding-left:0;" >
								<p>Vui lòng liên hệ với người mua vé thông qua</p>
								<div>
									<h1>Chúc mừng</h1>
									<p>Bạn đã đặt vé thành công</p>
									<p>Thông tin vé</p>
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
								<div style="box-sizing:border-box;padding-bottom:20px;padding-right:0;padding-left:0;text-align:center;color:#7b7b7b;" >
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >25 Lạc Trung, Vĩnh Tuy, Hai Bà Trưng, Hà Nội.</p>
									<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >Hotline: 0913231019</p>
								</div>
							</div>
						</div>
					`
				};

				_sendEmail(ticketSelling.contact, closedBuyerEmail).then(() => {
					next(null);
				});
			}

		});
	};
}
