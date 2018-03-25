import { MongoClient } from 'mongodb';
import Agenda from 'agenda';
import fetchGroupFeedFB from './fetchGroupFeedFB';

const cronjob = {
	_defineJobs() {
		const agenda = this._agenda;

		agenda.define('facebook.group-feed', fetchGroupFeedFB);
	},

	_initDefaultJobs(db) {
		const agenda = this._agenda;

		db.collection('cronjob').findOne({ name: 'facebook.group-feed' }).then((fbCron) => {
			if (!fbCron) {
				agenda.every('2 hours', 'facebook.group-feed', {});
			} else {
				db.collection('cronjob').updateOne({ name: 'facebook.group-feed' }, { $unset: { 'lockedAt': 1 } });
			}
		});
	},

	init() {
		const connectionString = 'mongodb://127.0.0.1:27017/chove';
		const options = {
			autoReconnect: true
		};
		const self = this;

		MongoClient.connect(connectionString, options, (error, db) => {
			if (error) {
				return new Error(error);
			}

			const agenda = new Agenda({
				db: {
					address: connectionString,
					collection: 'cronjob',
					options: options
				},
				mongo: db,
				processEvery: '2 seconds',
				maxConcurrency: 1000
			});

			this._agenda = agenda;

			agenda.define('facebook.group-feed', fetchGroupFeedFB);

			agenda.on('ready', () => {
				self._defineJobs();
				self._initDefaultJobs(db);
				agenda.start();
			});
		});
	},
};

export default cronjob;
