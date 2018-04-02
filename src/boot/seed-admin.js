/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2017-12-01 15:56:42
*------------------------------------------------------- */

export default (app) => {
	const User = app.models.user;
	const Role = app.models.Role;
	const RoleMapping = app.models.RoleMapping;

	User.findOne({ where: { email: 'admin@chove.vn' } }, (errCheck, userCheck) => {
		if (errCheck) {
			throw errCheck;
		}

		if (userCheck) {
			return ;
		}

		User.create({ fullName: 'Admin', email: 'admin@chove.vn', username: 'admin', password: '123456', emailVerified: true, role: 'admin' }, (err, user) => {
			if (err) {
				throw err;
			}

			Role.create({
				name: 'admin'
			}, (errRole, role) => {
				// if(err) throw err;

				console.log('Created role:', role);

				role.principals.create({
					principalType: RoleMapping.USER,
					principalId: user.id
				}, (errMap, principal) => {
					// if(err) throw err;

					console.log('Created principal:', principal);
				});
			});
		});
	});
};
