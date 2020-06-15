'use strict';

const { v4: uuid } = require('uuid');

const base = require('./base');

const tableName = process.env.NOTES_TABLE_NAME;

module.exports.getMany = userId => base.getMany(tableName, 'userId', userId);

module.exports.getOne = (userId, id) => base.getOne(tableName, { userId, id });

module.exports.createOne = (userId, title, content) => base.createOne(tableName, {
	userId,
	id: uuid(),
	title,
	content
});

module.exports.updateOne = (userId, id, title, content) => base.updateOne(tableName, { userId, id }, { title, content });

module.exports.deleteOne = (userId, id) => base.deleteOne(tableName, { userId, id });
