/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email ductienas@gmail.com
* Phone 0972970075
*
* Created: 2018-02-12 00:54:41
*------------------------------------------------------- */

import { FB } from 'fb';
import GoogleAuth from 'google-auth-library';
import Zalo from 'zalo-sdk';
// import axios from 'axios';

import login from 'src/utils/login';
import predefined from 'src/constant/predefined';

const auth = new GoogleAuth();
const client = new auth.OAuth2(['314929847304-blffjtcncvq4vbc92msgojprhqnudu8i.apps.googleusercontent.com'], 'YIk4yZaKBMBynZentZX2MnLl', '');

const ZSClient = new Zalo.ZaloSocial({
	appId: '92423462607218680',
	redirectUri: 'http://localhost:3004/login-zalo',
	appSecret: 'TGt4bW5cO44nHiw3JawE',
});

export default function (User) {
	User.validatesInclusionOf('loginType', { in: predefined.userLoginType });
	User.validatesInclusionOf('status', { in: predefined.userStatus });
	User.validatesUniquenessOf('phone');


	// User.disableRemoteMethod('create', true);
	User.disableRemoteMethod('deleteById', true);
	User.disableRemoteMethod('__delete__accessTokens', true);
	User.disableRemoteMethod('__create__accessTokens', true);
	User.disableRemoteMethod('__destroyById__accessTokens', true);

	const passwordDefault = 'EAAE8vLtmdZBsBACc5EUHEw4hAAv2aPtmvwdbeYswkA0c88iN0kWcInZCZCZCMakrs3ZAjy';

	const sendMailVerify = (user, next) => {
		if (!user.email) {
			return next();
		}

		const webUrl = User.app.get('webUrl');
		// const apiUrl = User.app.get('apiUrl');

		// send mail
		const options = {
			type: 'email',
			host: 'api.chove.vn',
			protocol: 'https',
			port: 443,
			to: user.email,
			from: 'noreply@chove.vn',
			subject: 'Thanks for registering.',
			redirect: webUrl + '/email-verified',
			user: user
		};

		user.verify(options, (err, response) => {
			if (err) {
				// User.deleteById(user.id);
				// return next(err);
				console.log('err', err);
			}

			console.log('> verification email sent:', response);

			if (typeof next === 'function') {
				next();
			}
		});
	};

	User.beforeRemote('create', (ctx, u, next) => {
		const { data: user = {} } = ctx.args;

		if (!user.email || !user.username) {
			return next({
				statusCode: 400,
				code: 'EMAIL_USERNAME_REQUIRED',
				message: '{{email}} and {{username}} is required'
			});
		}
		next();
	});

	User.afterRemote('create', (ctx, user, next) => {
		sendMailVerify(user, next);
	});

	User.login = login;

	User.loginZalo = (accessToken, email, username, ttl, next) => {
		ZSClient.getAccessTokenByOauthCode(accessToken, function (response) {
			if (response && response.access_token) {
				ZSClient.setAccessToken(response.access_token);
				ZSClient.api('me', 'GET', { fields: 'id, name, birthday, gender, picture, phone' }, function (userZalo) {
					if (userZalo && userZalo.id) {
						User.findOne({ where: { zaloId: userZalo.id } }, (err, userCheck) => {
							if (err) {
								return next({ ...err });
							}

							if (userCheck && userCheck.email) {
								User.login({
									email: userCheck.email,
									password: passwordDefault,
									ttl
								}, 'user', function (errLogin, token) {
									if (errLogin) {
										return next({ ...errLogin });
									}

									return next(null, token);
								});
							} else {
								if (email && username) {
									User.findOne({ where: { email } }, (errr, userCheckEmail) => {
										if (errr) {
											return next({ ...errr });
										}
										if (userCheckEmail) {
											return next({ message: 'Email already exists!' });
										}
										User.findOne({ where: { username } }, (errrr, userCheckUsername) => {
											if (errrr) {
												return next({ ...errrr });
											}
											if (userCheckUsername) {
												return next({ message: 'Username already exists!' });
											}
											const userData = {
												fullName: userZalo.name || '',
												gender: userZalo.gender || '',
												zaloId: userZalo.id,
												loginType: 'zalo',
												avatar: userZalo.picture && userZalo.picture.data && userZalo.picture.data.url,
												email,
												username,
												password: passwordDefault,
											};

											User.create(userData, (errCreate, userCreate) => {
												if (err) {
													return next({ ...errCreate });
												}

												sendMailVerify(userCreate);

												User.login({
													email: userCreate.email,
													password: passwordDefault,
													ttl
												}, 'user', function (errLogin, token) {
													if (errLogin) {
														return next({ ...errLogin });
													}

													return next(null, token);
												});
											});
										});
									});
								} else {
									return next(null, { code: 'additionalEmail' });
								}
							}
						});
					} else {
						next('Đăng nhập không thành công');
					}
				});
			} else {
				return next('AccessToken không hợp lệ', response);
			}
		});
	};

	User.loginFacebook = (accessToken, ttl, next) => {
		FB.api('me', { fields: 'email,name,gender,picture,link', 'access_token': accessToken }, function (res) {
			if (res.error) {
				return next({ ...res.error });
			}

			if (!res.id) {
				return next({ message: 'accessToken is invalid!' });
			}

			if (!res.email) {
				return next({ message: 'Email not found!' });
			}

			// user.password = passwordDefault;

			const userData = {
				email: res.email,
				fullName: res.name || '',
				gender: res.gender || '',
				facebookId: res.id,
				loginType: 'facebook',
				avatar: res.picture && res.picture.data && res.picture.data.url,
				password: passwordDefault,
			};

			User.findOne({ where: { email: userData.email } }, (err, userCheck) => {
				if (err) {
					return next({ ...err });
				}

				if (!userCheck) {
					User.create(userData, (errCreate, userCreate) => {
						if (err) {
							return next({ ...errCreate });
						}

						sendMailVerify(userCreate);

						User.login({
							email: userCreate.email,
							password: passwordDefault,
							ttl
						}, 'user', function (errLogin, token) {
							if (errLogin) {
								return next({ ...errLogin });
							}

							return next(null, token);
						});
					});
				} else {
					if (userCheck.loginType === 'facebook') {
						User.login({
							email: userCheck.email,
							password: passwordDefault,
							ttl
						}, 'user', function (errLogin, token) {
							if (errLogin) {
								return next({ ...errLogin });
							}

							return next(null, token);
						});
					} else {
						return next({ message: 'Email already exists!' });
					}
				}
			});
		});
	};

	User.loginGoogle = (accessToken, ttl, next) => {
		client.verifyIdToken(accessToken, ['671782562952-rhmgci05iqn7bfg7l380c24ftb2kq5r5.apps.googleusercontent.com'], function (e, res) {
			if (e) {
				return next(e);
			}

			const payload = res.getPayload();


			if (payload.error) {
				return next({ ...payload.error });
			}

			if (!payload.sub) {
				return next({ message: 'accessToken is invalid!' });
			}

			if (!payload.email) {
				return next({ message: 'Email not found!' });
			}

			// user.password = passwordDefault;

			const userData = {
				email: payload.email,
				fullName: payload.name || '',
				googleId: payload.sub,
				loginType: 'google',
				avatar: payload.picture || '',
				password: passwordDefault,
			};

			User.findOne({ where: { email: userData.email } }, (err, userCheck) => {
				if (err) {
					return next({ ...err });
				}

				if (!userCheck) {
					User.create(userData, (errCreate, userCreate) => {
						if (err) {
							return next({ ...errCreate });
						}

						sendMailVerify(userCreate);

						User.login({
							email: userCreate.email,
							password: passwordDefault,
							ttl
						}, 'user', function (errLogin, token) {
							if (errLogin) {
								return next({ ...errLogin });
							}

							return next(null, token);
						});
					});
				} else {
					if (userCheck.loginType === 'google') {
						User.login({
							email: userCheck.email,
							password: passwordDefault,
							ttl
						}, 'user', function (errLogin, token) {
							if (errLogin) {
								return next({ ...errLogin });
							}

							return next(null, token);
						});
					} else {
						return next({ message: 'Email already exists!' });
					}
				}
			});
		});
	};


	// send password reset link when requested
	User.on('resetPasswordRequest', (info) => {
		const webUrl = User.app.get('webUrl');
		const url = webUrl + '/reset-password';
		const html = 'Click <a href="' + url + '?access_token=' + info.accessToken.id + '">here</a> to reset your password';

		User.app.models.Email.send({
			to: info.email,
			from: 'noreply@chove.vn',
			subject: 'Password reset',
			html: html
		}, (err) => {
			if (err) {
				return console.log('> error sending password reset email');
			}
			console.log('> sending password reset email to:', info.email);
		});
	});

	User.beforeRemote('resetPassword', (ctx, opt, next) => {
		if (ctx.args.options.email) {
			User.findOne({ where: { email: ctx.args.options.email }, fields: { status: true, loginType: true } }, function (err, user) {
				if (err) {
					return next(err);
				}
				if (user && user.status === 'inactive') {
					return next({
						code: 'ACCOUNT_DISABLED',
						message: 'Account has been disabled',
						name: 'Error',
						status: 401,
						statusCode: 401
					});
				}
				if (user && user.loginType !== 'email') {
					return next({
						code: 'ACCOUNT_INVALID',
						message: 'Email not exist',
						name: 'Error',
						status: 401,
						statusCode: 401
					});
				}
				return next();
			});
		} else {
			next();
		}
	});

	User.beforeRemote('find', (ctx, modelInstance, next) => {
		const filter = ctx.args.filter;

		if (filter && filter.where && filter.where.search) {
			const searchString = filter.where.search;

			ctx.args.filter.where = {
				or: [
					{ fullName: { like: searchString } },
					{ email: { like: searchString } },
				],
			};
		}
		next();
	});

}

