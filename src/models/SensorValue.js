/* --------------------------------------------------------
* Author Ngô An Ninh
* Email ninh.uit@gmail.com
* Phone 0978 108 807
*
* Created: 2018-05-17 16:20:06
*------------------------------------------------------- */
import _ from 'underscore';
export default function (SensorValue) {

	SensorValue.observe('before save', function updateTimestamp(ctx, next) {
		const dateNow = Date.now(); // Math.floor(Date.now() / 1000);

		if (ctx.instance) {
			if (!ctx.instance.id) {
				ctx.instance.createdAt = dateNow;
			}
			ctx.instance.updatedAt = dateNow;
			if (!_.isEmpty(ctx.currentInstance) && !_.isEmpty(ctx.currentInstance.createdAt) && !_.isEmpty(ctx.instance.createdAt)) {
				ctx.instance.createdAt = ctx.currentInstance.createdAt;
			}
		} else {
			ctx.data.updatedAt = dateNow;
			if (!_.isEmpty(ctx.currentInstance) && (ctx.currentInstance.createdAt) && (ctx.data.createdAt)) {
				ctx.data.createdAt = ctx.currentInstance.createdAt;
			}
		}
		next();
	});
}
