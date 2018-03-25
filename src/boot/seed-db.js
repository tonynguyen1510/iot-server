/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-02-28 01:46:37
*------------------------------------------------------- */
import userData from '../../mockData/user-data.json';
import flightRawData from '../../mockData/flight-data.json';

export default (app) => {
	const User = app.models.user;
	const Flight = app.models.Flight;

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

				const flightData = flightRawData.map((item) => ({
					...item,
					startDate: new Date(item.startDate),
					endDate: new Date(item.endDate),
					sellerId: userIds[Math.floor(Math.random() * 100)],
					buyerId: userIds[Math.floor(Math.random() * 100)],
				}));

				Flight.create(flightData, (err2) => {
					if (err2) {
						console.log('erro', err2);
						throw err2;
					}

					console.log('Seed success');
				});
			});
		}
	});

};
