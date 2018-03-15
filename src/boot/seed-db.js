// /* --------------------------------------------------------
// * Author Trần Đức Tiến
// * Email ductienas@gmail.com
// * Phone 0972970075
// *
// * Created: 2018-02-28 01:46:37
// *------------------------------------------------------- */
// import userData from '../../mockData/user-data.json';
// import questionData from '../../mockData/question-data.json';
// import answerData from '../../mockData/answer-data.json';
// import likeData from '../../mockData/like-data.json';

// export default (app) => {
// 	const User = app.models.user;
// 	const Question = app.models.Question;
// 	const Answer = app.models.Answer;
// 	const AnswerLike = app.models.AnswerLike;

// 	User.find({}, (errCheck, resultsCheck) => {
// 		if (resultsCheck.length === 0) {
// 			console.log('Seed user -----------');
// 			User.create(userData, (err, users) => {
// 				if (err) {
// 					throw err;
// 				}

// 				const userIds = users.map((user) => {
// 					return user.id;
// 				});

// 				const questionDataAdd = questionData.map((question) => {
// 					return {
// 						...question,
// 						creatorId: userIds[Math.floor(Math.random() * 100)],
// 					};
// 				});

// 				console.log('Seed question -----------');

// 				Question.create(questionDataAdd, (errr, questions) => {
// 					if (errr) {
// 						throw errr;
// 					}

// 					const questionIds = questions.map((question) => {
// 						return question.id;
// 					});

// 					const answerDataAdd = answerData.map((answer) => {
// 						return {
// 							...answer,
// 							creatorId: userIds[Math.floor(Math.random() * 100)],
// 							questionId: questionIds[Math.floor(Math.random() * 100)],
// 						};
// 					});

// 					console.log('Seed answer -----------');

// 					Answer.create(answerDataAdd, (errrr, answers) => {
// 						if (errrr) {
// 							throw errrr;
// 						}

// 						const answerIds = answers.map((answer) => {
// 							return answer.id;
// 						});

// 						const answerLikeDataAdd = likeData.map((Answerlike) => {
// 							return {
// 								...Answerlike,
// 								creatorId: userIds[Math.floor(Math.random() * 100)],
// 								receiverId: userIds[Math.floor(Math.random() * 100)],
// 								answerId: answerIds[Math.floor(Math.random() * 100)],
// 							};
// 						});

// 						console.log('Seed like -----------');

// 						AnswerLike.create(answerLikeDataAdd, (errrrr) => {
// 							if (errrrr) {
// 								throw errrrr;
// 							}
// 							console.log('Seed success');
// 						});
// 					});
// 				});
// 			});
// 		}
// 	});
// };
