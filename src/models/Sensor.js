/* --------------------------------------------------------
* Author Ngô An Ninh
* Email ninh.uit@gmail.com
* Phone 0978 108 807
*
* Created: 2018-05-17 16:20:06
*------------------------------------------------------- */
import _ from 'underscore';
import async from 'async';
// import { fft } from 'fft-js';

export default function (Sensor) {

	Sensor.observe('before save', function updateTimestamp(ctx, next) {
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

	Sensor.calculateRMS = (sensorValues) => {
		let ms = 0;
		let n = 0;
		let sum = 0;

		sensorValues.forEach((sensorValue) => {
			n += 1;
			sum = sum + sensorValue.value;
			ms = ms + sensorValue.value * sensorValue.value;
		});
		const signal = sensorValues.map(o => { return o.value });
		// console.log('signal', signal);

		ms = ms/n;
		const max = Math.max(...signal);
		const min = Math.min(...signal);
		const average = sum/n;
		// const varFFT = fft([1, 0, 1, 0]);

		const result = {
			rms: Math.sqrt(ms),
			max,
			min,
			average,
			// fft: varFFT,
		};

		return result;
	};

	Sensor.analysis = (next) => {
		let result = {
			'sensor1': 0,
			'sensor2': 0,
			'sensor3': 0,
			'sensor4': 0,
			'sensor5': 0
		};

		Sensor.find({
			include: {
				relation: 'SensorValues'
			}
		}, (err, sensors) => {
			async.eachLimit(sensors, 5, (sensor, cb) => {
				result[sensor.name] = Sensor.calculateRMS(sensor.SensorValues());
				cb();
			}, (err) => {
				if (err) console.log('err', err);
			});

			next(err, { sensor: result });
		});
	};


}
