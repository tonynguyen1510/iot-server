import FB from 'fb';
import { app } from '../server';

// const defaultAccessToken = 'EAAAAAYsX7TsBAO5dtI0FgwjreObtQXt0rO8fPhCTZBN8xfaxnOka8EASkzSJBZCvX0wOQlwntsY7MqZCYL9POZA9BTI4yTTKbipBBOATbLq2iv2dufnqThHmJ39d4yfTkDTFG8YtHB9ZAj99VjcQNoJ6WqMZBbnJ6BktAmVnwQ4i5kUKZBKKjBF';
// const groupId = '588371654842756';
// const clientId = '1984101708520688';
// const clientSecret = '81d81b68d93d52b6b9ca9f637c95b0b3';

const startOfDay = (dirtyDate) => {
	const date = new Date(dirtyDate);

	date.setHours(0, 0, 0, 0);
	return date;
};

export default function fetchGroupFeedFB(job, done) {
	// const data = job.attrs.data || {};
	// const accessToken = data.fbAccessToken || defaultAccessToken;
	const unixtime = startOfDay(Date.now()).getTime() / 1000;
	const FBFeed = app.models.FBFeed;
	const FBGroup = app.models.FBGroup;
	const FBToken = app.models.FBToken;

	/* eslint-disable camelcase */
	FBToken.findOne({}, (err, fbToken) => {
		if (err || !fbToken) {
			console.log('err', err);
			return done();
		}

		const _fetchGroupFeed = (groupId) => {
			console.log('groupId', groupId);
			return new Promise((resolveGroup) => {
				// FB.api(`${groupId}/feed`, {
				FB.api(`${groupId}/feed?since=${unixtime}`, {

					// FB.api(`${groupId}/feed`, {
					fields: ['message', 'from{picture, name}', 'story'],
					access_token: fbToken.token,
				}, (res1) => {
					if (res1.error) {
						fbToken.token = '';
						return fbToken.save({}, () => {
							return done();
						});
					}

					if (!res1 || !res1.data) {
						return resolveGroup();
					}

					Promise.all(res1.data.map((item) => {
						const fbFeedItem = {
							id: item.id,
							author: item.from,
							content: item.message || item.story,
						};

						if (!fbFeedItem.content) {
							return Promise.resolve({});
						}

						return new Promise((resolve) => {
							FBFeed.findById(fbFeedItem.id, (errFind, fbFeed) => {
								if (errFind) {
									throw errFind;
								}

								if (fbFeed) {
									resolve(fbFeed);
								} else {
									FBFeed.create(fbFeedItem, (errCreate, returnedFBFeed) => {
										if (errCreate) {
											throw errCreate;
										}
										resolve(returnedFBFeed);
									});
								}

							});
						});
					})).then(() => {
						console.log('seed feed');

						resolveGroup(true);
					});
				});
			});
		};

		FBGroup.find({ where: { active: true } }, (errGroup, groups) => {
			if (errGroup) {
				throw errGroup;
			}

			Promise.all(
				groups.map((group) => _fetchGroupFeed(group.id))
			).then(() => {
				done();
			});
		});

	});
}
