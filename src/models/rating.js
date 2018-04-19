/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-03-16 00:58:03
*------------------------------------------------------- */

const increaseRating = (newStar, { ratingsCount = 0, ratingsStats = {} }) => {
	const { star = 0, starDetail = {
		'1': 0,
		'2': 0,
		'3': 0,
		'4': 0,
		'5': 0,
	} } = ratingsStats;

	const newRating = {
		ratingsCount: ratingsCount + 1,
		ratingsStats: {
			star: ((star * ratingsCount) + newStar) / (ratingsCount + 1),
			starDetail: { ...starDetail, [newStar]: starDetail[newStar] + 1 }
		},
	};

	return newRating;
};

const decreaseRating = (newStar, { ratingsCount = 0, ratingsStats = {} }) => {
	const { star = 0, starDetail = {
		'1': 0,
		'2': 0,
		'3': 0,
		'4': 0,
		'5': 0,
	} } = ratingsStats;

	const newRating = {
		ratingsCount: ratingsCount === 0 ? 0 : ratingsCount - 1,
		ratingsStats: {
			star: ratingsCount === 0 ? 0 : ((star * ratingsCount) - newStar) / (ratingsCount - 1),
			starDetail: { ...starDetail, [newStar]: starDetail[newStar] === 0 ? 0 : starDetail[newStar] - 1 },
		},
	};

	return newRating;
};

export default function (Rating) {
	Rating.afterRemote('create', (ctx, rate, next) => {
		const User = Rating.app.models.user;

		const { star: newStar, receiverId } = rate;

		if (receiverId) {
			User.findById(receiverId, { field: ['id', 'ratingsCount', 'ratingsStats'] }, (error, user) => {
				if (error) {
					console.log('error', error);
				} else {
					const { ratingsCount = 0, ratingsStats = {} } = user;

					user.updateAttributes({ ...increaseRating(newStar, { ratingsCount, ratingsStats: JSON.parse(JSON.stringify(ratingsStats)) }) });
				}
			});
		}

		next();
	});

	Rating.afterRemote('deleteById', (ctx, data, next) => {
		const User = Rating.app.models.user;

		const { instance = {} } = ctx.args;

		if (instance.receiverId && instance.star) {
			User.findById(instance.receiverId, { field: ['id', 'ratingsCount', 'ratingsStats'] }, (error, user) => {
				if (error) {
					console.log('error', error);
				} else {
					const { ratingsCount = 0, ratingsStats = {} } = user;

					user.updateAttributes({ ...decreaseRating(instance.star, { ratingsCount, ratingsStats: JSON.parse(JSON.stringify(ratingsStats)) }) });
				}
			});
		}

		next();
	});
}
