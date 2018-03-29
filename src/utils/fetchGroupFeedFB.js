import FB from 'fb';
import { app } from '../server';

const defaultAccessToken = 'EAAZAlZAgAfFCcBALLDHnynBY74AuNLrZCvTEqh3j08R2FGnmXlz7vUGSOW7BJGCTUKuZCdLEP7E4N5QBkQ22Ob4xUdCKlKYRUAtHU2YKy2TaolOmckNJ6eZCKYFR21aAsrbgjnxMKEFR9ebjYZAEF6WJF8EOFRrJ7PyLZAoZCpmYwKYlzmHnNhv6PU4DAYG59cMZD';
const groupId = '588371654842756';
const clientId = '1800338623370279';
const clientSecret = '5781762d36cadb9417fa63842708d4a9';

const startOfDay = (dirtyDate) => {
	const date = new Date(dirtyDate);

	date.setHours(0, 0, 0, 0);
	return date;
};

export default function fetchGroupFeedFB(job, done) {
	const data = job.attrs.data || {};
	const accessToken = data.fbAccessToken || defaultAccessToken;
	const unixtime = data.unixtime || startOfDay(Date.now()).getTime() / 1000;
	const Flight = app.models.Flight;

	/* eslint-disable camelcase */
	FB.api('oauth/access_token', {
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: 'fb_exchange_token',
		fb_exchange_token: accessToken,
	}, function (res) {
		job.attrs.data.fbAccessToken = res.access_token;
		job.attrs.data.unixtime = new Date().getTime() / 1000;

		// const unixtime = startOfDay(Date.now()).getTime() / 1000;

		// FB.api(`${groupId}/feed?since=${unixtime}`, {
		FB.api(`${groupId}/feed`, {
			fields: ['message', 'from{picture, name}', 'story'],
			access_token: res.access_token,
			unixtime,
		}, (res1) => {
			if (!res1 || !res1.data) {
				return done();
			}

			Promise.all(res1.data.map((item) => {
				const flightItem = {
					feedFbId: item.id,
					from: item.from,
					status: 'Wait for approval',
					content: item.message || item.story,
				};

				return new Promise((resolve) => {
					Flight.findOrCreate({ where: { feedFbId: flightItem.feedFbId } }, flightItem, (err, returnedFlight) => {
						if (err) {
							throw err;
						}

						resolve(returnedFlight);
					});
				});
			})).then(() => {
				console.log('seed feed');

				done();
			});
		});
	});
}
