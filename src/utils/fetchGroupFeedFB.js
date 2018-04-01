import FB from 'fb';
import { app } from '../server';

const defaultAccessToken = 'EAAZAlZAgAfFCcBAFIHW1arqx2jl1cJJcYCMCw3u4LyLzsDhhZAaDkhPUpcgLi8A0BKrrvkcyW39nZBD1JHnz4F9gO0PtDcwenjDs3KQ22OIMMZACaDfGljPKW5Ah2OLfw7V8COSjGQPoqgZA154CTaJVFLVmovTrsZD';
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
	const FBFeed = app.models.FBFeed;

	/* eslint-disable camelcase */
	FB.api('oauth/access_token', {
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: 'fb_exchange_token',
		fb_exchange_token: accessToken,
	}, function (res) {
		console.log('res', res);
		job.attrs.data.fbAccessToken = res.access_token;
		job.attrs.data.unixtime = new Date().getTime() / 1000;

		console.log('unixtime', unixtime);

		// FB.api(`${groupId}/feed?since=${unixtime}`, {
		FB.api(`${groupId}/feed`, {
			fields: ['message', 'from{picture, name}', 'story'],
			access_token: res.access_token,
		}, (res1) => {
			if (!res1 || !res1.data) {
				return done();
			}

			Promise.all(res1.data.map((item) => {
				const fbFeedItem = {
					id: item.id,
					author: item.from,
					content: item.message || item.story,
				};

				return new Promise((resolve) => {
					FBFeed.findOrCreate({ where: { feedFbId: fbFeedItem.feedFbId } }, fbFeedItem, (err, returnedFlight) => {
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
