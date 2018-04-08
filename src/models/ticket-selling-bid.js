/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-04-02 10:41:48
*------------------------------------------------------- */

export default function (Bid) {
	Bid.afterRemote('create', (ctx, bid, next) => {
		const TicketSelling = Bid.app.models.TicketSelling;

		TicketSelling.findById(bid.ticketSellingId, (err, ticketSelling) => {
			if (err) {
				throw err;
			}

			if (ticketSelling.price < bid.price) {
				ctx.result.isUpdatePrice = true;

				ticketSelling.price = bid.price;
				ticketSelling.contactId = bid.bidderId;

				ticketSelling.save({}, (errSave) => {
					if (errSave) {
						throw errSave;
					}
					next();
				});
			} else {
				ctx.result.isUpdatePrice = false;
				next();
			}

		});
	});
}
