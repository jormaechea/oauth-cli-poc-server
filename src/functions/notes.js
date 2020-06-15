'use strict';

const apiHandler = require('./api-handler');

const notesModel = require('../models/notes');

const getUserId = event => event && event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.userId;

const ensureUserId = event => {
	const userId = getUserId(event);

	if(!userId)
		throw new Error('Missing user id');

	return userId;
};

const ensureNoteId = event => {
	const id = event.pathParameters && event.pathParameters.id;

	if(!id)
		throw new Error('Missing ID in path');

	return id;
};

const parseNoteBody = event => {

	const { body } = event;

	if(!body)
		throw new Error('Missing request body');

	const note = JSON.parse(body);

	if(!note.title)
		throw new Error('Missing note title');

	if(typeof note.title !== 'string')
		throw new Error('Invalid note title');

	if(!note.content)
		throw new Error('Missing note content');

	if(typeof note.content !== 'string')
		throw new Error('Invalid note content');

	return note;
};

module.exports.getMany = apiHandler(event => {
	const userId = ensureUserId(event);
	return notesModel.getMany(userId);
});

module.exports.getOne = apiHandler(event => {
	const userId = ensureUserId(event);
	const noteId = ensureNoteId(event);
	return notesModel.getOne(userId, noteId);
});

module.exports.createOne = apiHandler(event => {
	const userId = ensureUserId(event);
	const { title, content } = parseNoteBody(event);
	return notesModel.createOne(userId, title, content)
		.then(id => console.log(id) || ({ id }));
});

module.exports.updateOne = apiHandler(event => {
	const userId = ensureUserId(event);
	const noteId = ensureNoteId(event);
	const { title, content } = parseNoteBody(event);
	return notesModel.updateOne(userId, noteId, title, content);
});

module.exports.deleteOne = apiHandler(event => {
	const userId = ensureUserId(event);
	const noteId = ensureNoteId(event);
	return notesModel.deleteOne(userId, noteId);
});
