/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-02-28 01:46:37
*------------------------------------------------------- */
import userData from '../../mockData/user-data.json';
import buyRawData from '../../mockData/buy-data.json';

export default (app) => {
	const User = app.models.user;
	const BuyTicket = app.models.BuyTicket;
	const SellTicket = app.models.SellTicket;

	User.find({}, (err, resultsCheck) => {
		if (err) {
			throw err;
		}
		if (resultsCheck.length === 0) {
			User.create(userData, (err1, users) => {
				if (err1) {
					throw err1;
				}

				const userIds = users.map((user) => user.id);

				const buyData = buyRawData.map((item) => ({
					...item,
					startDate: new Date(item.startDate),
					endDate: new Date(item.endDate),
					sellerId: userIds[Math.floor(Math.random() * 100)],
					buyerId: userIds[Math.floor(Math.random() * 100)],
				}));

				const sellData = buyRawData.map((item) => ({
					...item,
					startDate: new Date(item.startDate),
					endDate: new Date(item.endDate),
					sellerId: userIds[Math.floor(Math.random() * 100)],
					buyerId: userIds[Math.floor(Math.random() * 100)],
				}));

				BuyTicket.create(buyData, (err2) => {
					if (err2) {
						console.log('erro', err2);
						throw err2;
					}

					console.log('Seed buy success');
				});

				SellTicket.create(sellData, (err2) => {
					if (err2) {
						console.log('erro', err2);
						throw err2;
					}

					console.log('Seed sell success');
				});
			});
		}
	});

};
