/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-02-28 01:46:37
*------------------------------------------------------- */
// import userData from '../../mockData/user-data.json';
// import buyRawData from '../../mockData/buy-data.json';
// import fbFeedData from '../../mockData/fbFeed-data.json';

export default (app) => {
	const FBToken = app.models.FBToken;
	const FBGroup = app.models.FBGroup;

	FBToken.find({}, (err, resultsCheck) => {
		if (err) {
			throw err;
		}

		if (resultsCheck.length === 0) {
			FBToken.create({
				token: 'EAAAAAYsX7TsBAPwIZArbSdX2YxbqtKEqkqar7uuZCC0GrAmvQcluw1oBDIAaNwAm9UyjaNfqBrWLO4cLbqbIuZB9ZBzucOCDMZBKUYpQbrmaaqODUNWVadyc59AMcvDMO91pwrHtdPVt4JGjcZCMpAcsA0d0stCZAEqWnzeGsaM6wZDZD'
			}, (err1) => {
				if (err1) {
					throw err1;
				}

				FBGroup.find({}, (err2, resultsCheck2) => {
					if (err2) {
						throw err2;
					}

					if (resultsCheck2.length === 0) {
						const groupData = [
							{
								name: 'NHƯỢNG VÉ MÁY BAY GIÁ RẺ',
								id: '1614863552060801',
							},
							{
								name: 'Hội săn vé máy bay giá siêu rẻ trong nước và quốc tế',
								id: '559584547537712',
							},
							{
								name: 'HỘI BÁN VÉ MÁY BAY VIỆT NAM',
								id: '833732383406068',
							},
							{
								name: 'NHƯỢNG VÉ MÁY BAY ☑️',
								id: '588590314630048',
							},
							{
								name: 'HỘI VÉ MÁY BAY ✈',
								id: '701798596525303',
							},
							{
								name: 'HỘI SĂN VÉ MÁY BAY GIÁ RẺ (HỘI BÁN VÉ MÁY BAY CHO KHÁCH HÀNG VÀ ĐẠI LÝ)',
								id: '183307175193895',
							},
							{
								name: 'HỘI CANH VÉ MÁY BAY GIÁ RẺ',
								id: '172595422939825',
							},
							{
								name: 'HỘI SĂN VÉ MÁY BAY, TOUR DU LỊCH GIÁ RẺ',
								id: '1912667099017949',
							},
							{
								name: 'HIỆP HỘI  BÁN VÉ MÁY BAY VIỆT NAM',
								id: '1739820382911280',
							},
							{
								name: 'HỘI MUA BÁN VÉ MÁY BAY',
								id: '240992029570738',
							}
						];

						FBGroup.create(groupData, (err3) => {
							if (err3) {
								throw err3;
							}
							console.log('seed done');
						});
					}
				});
			});
		}
	});

};
