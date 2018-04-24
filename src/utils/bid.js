import { app } from '../server';
import cronjob from './cronjob';

export const updateStatusPending = (job, done) => {
	const { ticketSellingId } = job.attrs.data;

	const TicketSelling = app.models.TicketSelling;

	TicketSelling.findById(ticketSellingId, (err, ticketSelling) => {
		if (err) {
			console.log('err', err);
			job.disable();
			throw err;
		}

		if (!ticketSelling) {
			job.disable();
			return;
		}

		ticketSelling.status = 'pending';

		ticketSelling.save({}, (errSave) => {
			if (errSave) {
				console.log('errSave', errSave);
				throw err;
			}

			cronjob.every('30 minutes', 'bid.update-bid-price', { ticketSellingId });
			done();
		});
	});
};

export const updateBidPrice = (job, done) => {
	const { ticketSellingId } = job.attrs.data;

	const TicketSelling = app.models.TicketSelling;
	const TicketSellingBid = app.models.TicketSellingBid;

	// if (firstRun) {
	// 	job.attrs.data.firstRun = false;
	// 	return done();
	// }

	TicketSellingBid.find({
		where: {
			status: 'active',
			ticketSellingId,
		},
		order: 'price DESC'
	}, (err, bids) => {
		if (err) {
			throw err;
		}

		if (bids.length >= 2) {
			const currentBid = bids[0];
			const nextBid = bids[1];

			currentBid.status = 'deactive';
			currentBid.save({}, () => {
				TicketSelling.upsertWithWhere(
					{ id: ticketSellingId },
					{ price: nextBid.price, contactId: nextBid.bidder },
					(errUpdate) => {
						if (errUpdate) {
							console.log('errUpdate', errUpdate);
							throw errUpdate;
						}
						done();
					}
				);
			});
		} else {
			console.log('disable job');
			job.disable();
		}
	});
};
