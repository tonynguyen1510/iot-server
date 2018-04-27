/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-02-28 01:46:37
*------------------------------------------------------- */
// import userData from '../../mockData/user-data.json';
// import buyRawData from '../../mockData/buy-data.json';
import fbFeedData from '../../mockData/fbFeed-data.json';

export default (app) => {
	// const User = app.models.user;
	// const TicketBuying = app.models.TicketBuying;
	// const TicketSelling = app.models.TicketSelling;
	const FBFeed = app.models.FBFeed;

	FBFeed.find({}, (err, resultsCheck) => {
		if (err) {
			throw err;
		}

		if (resultsCheck.length === 0) {
			FBFeed.create(fbFeedData, (err1) => {
				if (err1) {
					throw err;
				}

				console.log('seed fb feed success');
			});
		}
	});

	// User.find({}, (err, resultsCheck) => {
	// 	if (err) {
	// 		throw err;
	// 	}
	// 	if (resultsCheck.length === 0) {
	// 		User.create(userData, (err1, users) => {
	// 			if (err1) {
	// 				throw err1;
	// 			}

	// 			const userIds = users.map((user) => user.id);

	// 			const buyData = buyRawData.map((item) => ({
	// 				content: item.content,
	// 				flightType: item.flightType,
	// 				contactId: item.status === 'open' ? undefined : userIds[Math.floor(Math.random() * 100)],
	// 				creatorId: userIds[Math.floor(Math.random() * 100)],
	// 				airline: 'vna',
	// 				packageWeight: '7',
	// 				seatType: 'promo',
	// 				status: item.status,
	// 				price: 1200000,
	// 				trip: {
	// 					departure: item.departure,
	// 					destination: item.destination,
	// 					startDate: new Date(item.startDate),
	// 					startTime: '12:00'
	// 				},
	// 				tripBack: item.flightType === 'oneWay' ? undefined : {
	// 					departure: item.destination,
	// 					destination: item.departure,
	// 					startDate: new Date(item.endDate),
	// 					startTime: '12:00'
	// 				}
	// 			}));

	// 			const sellData = buyRawData.map((item) => ({
	// 				content: item.content,
	// 				flightType: item.flightType,
	// 				contactId: item.status === 'open' ? undefined : userIds[Math.floor(Math.random() * 100)],
	// 				creatorId: userIds[Math.floor(Math.random() * 100)],
	// 				airline: 'vna',
	// 				packageWeight: '7',
	// 				seatType: 'promo',
	// 				status: item.status,
	// 				price: 1200000,
	// 				trip: {
	// 					departure: item.departure,
	// 					destination: item.destination,
	// 					startDate: new Date(item.startDate),
	// 					startTime: '12:00'
	// 				},
	// 				tripBack: item.flightType === 'oneWay' ? undefined : {
	// 					departure: item.destination,
	// 					destination: item.departure,
	// 					startDate: new Date(item.endDate),
	// 					startTime: '12:00'
	// 				}
	// 			}));

	// 			TicketBuying.create(buyData, (err2) => {
	// 				if (err2) {
	// 					console.log('erro', err2);
	// 					throw err2;
	// 				}

	// 				console.log('Seed buy success');
	// 			});

	// 			TicketSelling.create(sellData, (err2) => {
	// 				if (err2) {
	// 					console.log('erro', err2);
	// 					throw err2;
	// 				}

	// 				console.log('Seed sell success');
	// 			});
	// 		});
	// 	}
	// });

};
