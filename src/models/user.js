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
import loopback from 'loopback';
// import axios from 'axios';
import _ from 'underscore';
import login from 'src/utils/login';
import predefined from 'src/constant/predefined';

const auth = new GoogleAuth();
const client = new auth.OAuth2(['502795845770-gcps0fn2j1dcrfan99ntvvbru3dbkomr.apps.googleusercontent.com'], 'BtNYH3oaXAgKxmfVVZR1BRds', '');

const ZSClient = new Zalo.ZaloSocial({
	appId: '92423462607218680',
	redirectUri: process.env.WEB_URL + '/login-zalo',
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
		const apiUrl = User.app.get('apiUrl');

		const [protocol, host] = apiUrl.split('://');

		// send mail
		const options = {
			type: 'email',
			host,
			protocol,
			port: protocol === 'https' ? 443 : 80,
			to: user.email,
			from: `"${process.env.EMAIL_NAME || 'Chove Support Team'}" <${process.env.EMAIL || 'noreply@chove.vn'}>`,
			subject: '[Chove] Chúc mừng bạn đã đăng ký tài khoản thành công.',
			template: 'src/email/verify.ejs',
			redirect: webUrl + '/email-verified',
			user: user,
			webUrl,
		};

		user.verify(options, (err, response) => {
			if (err) {
				// User.deleteById(user.id);
				// return next(err);
				console.log('err', err);
			}

			console.log('> verification email sent:', response);
		});
		if (typeof next === 'function') {
			next();
		}
	};

	User.observe('before save', function updateTimestamp(ctx, next) {
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

	User.loginZalo = (accessToken, email, username, ttl, include = '{}', next) => {
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
								}, include, function (errLogin, token) {
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
												avatar: userZalo.picture && userZalo.picture.data && userZalo.picture,
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
												}, include, function (errLogin, token) {
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

	User.loginFacebook = (accessToken, ttl, include = '{}', next) => {
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
				avatar: res.picture && res.picture.data && res.picture,
				password: passwordDefault,
			};

			User.findOne({ where: { email: userData.email } }, (err, userCheck) => {
				if (err) {
					return next({ ...err });
				}

				if (!userCheck) {
					User.create(userData, (errCreate, userCreate) => {
						if (errCreate) {
							return next({ ...errCreate });
						}

						sendMailVerify(userCreate);

						User.login({
							email: userCreate.email,
							password: passwordDefault,
							ttl
						}, include, function (errLogin, token) {
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
						}, include, function (errLogin, token) {
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

	User.loginGoogle = (accessToken, ttl, include = '{}', next) => {
		client.verifyIdToken(accessToken, ['502795845770-gcps0fn2j1dcrfan99ntvvbru3dbkomr.apps.googleusercontent.com'], function (e, res) {
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
						if (errCreate) {
							return next({ ...errCreate });
						}

						sendMailVerify(userCreate);

						User.login({
							email: userCreate.email,
							password: passwordDefault,
							ttl
						}, include, function (errLogin, token) {
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
						}, include, function (errLogin, token) {
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

		const params = { resetLink: webUrl + '/reset-password?access_token=' + info.accessToken.id };

		const renderer = loopback.template('src/email/reset-password.ejs');
		const html = renderer(params);

		User.app.models.Email.send({
			to: info.email,
			from: `"${process.env.EMAIL_NAME || 'Chove Support Team'}" <${process.env.EMAIL || 'noreply@chove.vn'}>`,
			subject: '[Chove] Đặt lại mật khẩu.',
			html: html
		}, (err) => {
			if (err) {
				return console.log('> error sending password reset email', err);
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

	User.remindUser = (id, next) => {
		const Email = User.app.models.Email;

		User.findById(id, (errUser, user) => {
			if (errUser) {
				console.log('errUser', errUser);
				return next(errUser);
			}

			Email.send({
				// to: 'maihuunhan30071992@gmail.com',
				to: user.email,
				from: `"${process.env.EMAIL_NAME || 'Chove Support Team'}" <${process.env.EMAIL || 'noreply@chove.vn'}>`,
				subject: '[Chove] Yêu cầu cung cấp thông tin người dùng',
				html: `
					<div style="box-sizing:border-box;padding: 40px;max-width:768px;margin-top:auto;margin-bottom:auto;margin-right:auto;margin-left:auto;background-color:#f9fafc;" >
						<div class="main-email" style="box-sizing:border-box;padding:20px;background-color:#fff;box-shadow:0px 0px 17px rgba(148, 148, 148, 0.2485);text-align:center;" >
							<img src="https://s3-ap-southeast-1.amazonaws.com/chove.vn/static/2x.png" alt="logo" style="box-sizing:border-box;max-width:120px;height:auto;padding-top:25px;padding-bottom:25px;padding-right:0;padding-left:0;" >
							<p>Vui lòng liên hệ với người mua vé thông qua</p>
							<div>
								<h1>Chào ${user.fullName}</h1>
								<p>Để thuận tiện giao dịch trên hệ thống chove.vn, bạn vui lòng cung cấp các thông tin yêu cầu trên trang web <a href="${User.app.get('webUrl')}">${User.app.get('webUrl')}</a></p>
								<p>Cảm ơn!</p>
							</div>
							<div style="box-sizing:border-box;padding-bottom:20px;padding-right:0;padding-left:0;text-align:center;color:#7b7b7b;" >
								<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >25 Lạc Trung, Vĩnh Tuy, Hai Bà Trưng, Hà Nội.</p>
								<p class="footer__copyright" style="box-sizing:border-box;font-size:14px;margin-top:10px;margin-bottom:0;margin-right:0;margin-left:0;color:#7b7b7b;" >Hotline: 0913231019</p>
							</div>
						</div>

					</div>
				`,
			}, (err) => {
				if (err) {
					console.log('send email error', err);
					return next(err);
				}
				next();
			});
		});
	};
}

