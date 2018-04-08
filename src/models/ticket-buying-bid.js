/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-04-02 10:41:48
*------------------------------------------------------- */

export default function (Bid) {
	Bid.afterRemote('create', (ctx, bid, next) => {
		const TicketBuying = Bid.app.models.TicketBuying;

		TicketBuying.findById(bid.ticketBuyingId, (err, ticketBuying) => {
			if (err) {
				throw err;
			}

			if (ticketBuying.price < bid.price) {
				ticketBuying.price = bid.price;
				ctx.result.isUpdatePrice = true;

				ticketBuying.save({}, (errSave) => {
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
