/* --------------------------------------------------------
* Author Ngô An Ninh
* Email ninh.uit@gmail.com
* Phone 0978108807
*
* Created: 2018-05-25 10:04:14
*------------------------------------------------------- */

import schedule from 'node-schedule';
import async from 'async';
import mqtt from 'mqtt';
const client = mqtt.connect({
	host: 'm11.cloudmqtt.com',
	port: 17012,
	username: 'itpkracb',
	password: 'C-RQgGr2a0Bz'
});

client.on('connect', function () {
	client.subscribe('topic/#');
});
client.on('message', function (topic, message) {
	// message is Buffer
	// console.log(message.toString());
	// client.end();
});

export default (app) => {
	const SensorValue = app.models.SensorValue;

	const randomNumber = (min, max) => {
		return Math.floor((Math.random() * max) + min);
	};

	const createValue = (del, sensorName, cb) => {
		const value = 100 + randomNumber(- del, 10);

		if (value % (del/2 - 1) !== 0) {
			return cb();
		}
		SensorValue.create({ value, sensorName }, (err1, instace) => {
			client.publish(sensorName, value.toString());
			return cb(err1, instace);
		});
	};

	schedule.scheduleJob('*/1 * * * * *', () => {
		async.parallel([
			(cb) => {
				createValue(6, 'sensor1', cb);
			},
			(cb) => {
				createValue(8, 'sensor2', cb);
			},
			(cb) => {
				createValue(10, 'sensor3', cb);
			},
			(cb) => {
				createValue(12, 'sensor4', cb);
			},
			(cb) => {
				createValue(14, 'sensor5', cb);
			},
		], (err, res) => {
			if (err) console.log(err);
			// console.log('complete generation with result: ', res);
		});
	});

};

