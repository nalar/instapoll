var Sequelize = require('sequelize');

var sequelize = new Sequelize('poll', 'jon', null, {
	host: 'localhost',
	dialect: 'postgres',
	define: {
		timestamps: false
	}
});

var Poll = sequelize.define('poll', {
	question: { type: Sequelize.TEXT }
});

var Answer = sequelize.define('answer', {
	name: { type: Sequelize.TEXT },
	votes: { type: Sequelize.INTEGER }
});

Answer.belongsTo(Poll);

exports.initialize = function (onComplete) {
	Poll.sync().then(function () {
		Answer.sync().then(function() {
			onComplete();
		});
	});
};