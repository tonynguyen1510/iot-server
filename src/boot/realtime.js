/* --------------------------------------------------------
* Author Ngô An Ninh
* Email ninh.uit@gmail.com
* Phone 0978108807
*
* Created: 2018-05-28 16:57:48
*------------------------------------------------------- */

import es from 'event-stream';

export default function (app) {
	const SensorValue = app.models.SensorValue;

	SensorValue.createChangeStream((err, changes) => {
		if (err) {
			console.log('err', err);
		}
		// console.log('changes', changes);
		changes.pipe(es.stringify()).pipe(process.stdout);
	});
}
