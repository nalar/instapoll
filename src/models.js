var Sequelize = require('sequelize');

var sequelize = new Sequelize('poll', 'jon', null, {
	host: 'localhost',
	dialect: 'postgres',
	define: {
		timestamps: false
	}
});

var Poll = sequelize.define('poll', {
	question: {type: Sequelize.TEXT}
});

var Answer = sequelize.define('answer', {
	name: {type: Sequelize.TEXT},
	votes: {type: Sequelize.INTEGER}
});

Poll.hasMany(Answer);
Answer.belongsTo(Poll);

function initialize(onComplete) {
	Poll.sync().then(function () {
		Answer.sync().then(function () {
			onComplete();
		});
	});
}

module.exports = {
	initialize: initialize,
	Poll: Poll,
	Answer: Answer
};