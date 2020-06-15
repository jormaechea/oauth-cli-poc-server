'use strict';

const { inspect } = require('util');

const dynamodb = require('./dynamodb');

const getDynamoType = value => {
	switch(typeof value) {
		case 'string':
			return 'S';
		case 'number':
			return 'N';
		case 'boolean':
			return 'BOOL';
		default:
			throw new Error(`Unknown value type for ${inspect(value)} of type ${typeof value}`);
	}
};

const getDynamoValue = value => (typeof value === 'number' ? value.toString() : value);

const parseDynamoTypedObject = key => Object.entries(key)
	.reduce((acum, [field, value]) => {
		acum[field] = {
			[getDynamoType(value)]: getDynamoValue(value)
		};

		return acum;
	}, {});

const parseUpdateExpression = updateData => {

	let UpdateExpression = '';
	const ExpressionAttributeNames = {};
	const ExpressionAttributeValues = {};

	let i = 0;

	Object.entries(updateData)
		.forEach(([field, value]) => {

			i++;

			UpdateExpression = `${UpdateExpression}${UpdateExpression === '' ? 'SET ' : ', '}#attr_${i} = :attr_${i}`;
			ExpressionAttributeNames[`#attr_${i}`] = field;
			ExpressionAttributeValues[`:attr_${i}`] = {
				[getDynamoType(value)]: getDynamoValue(value)
			};

		});

	return {
		UpdateExpression,
		ExpressionAttributeNames,
		ExpressionAttributeValues
	};
};

const parseDynamoType = valueWithType => {
	if(valueWithType.S)
		return valueWithType.S;
	if(valueWithType.N)
		return Number(valueWithType.N);

	return Object.entries(valueWithType)[0][1];
};

const parseDynamoItem = item => Object.entries(item)
	.reduce((acum, [field, valueWithType]) => {
		acum[field] = parseDynamoType(valueWithType);
		return acum;
	}, {});

module.exports.getOne = async (table, key) => {

	const dynamoKey = parseDynamoTypedObject(key);

	const result = await dynamodb.getItem({
		TableName: table,
		Key: dynamoKey
	}).promise();

	return result && result.Item ? parseDynamoItem(result.Item) : null;
};

module.exports.getMany = async (table, keyName, searchValue) => {

	const result = await dynamodb.query({
		TableName: table,
		KeyConditionExpression: `${keyName} = :${keyName}`,
		ExpressionAttributeValues: parseDynamoTypedObject({ [`:${keyName}`]: searchValue })
	}).promise();

	return result && result.Items ? result.Items.map(parseDynamoItem) : [];
};

module.exports.createOne = async (table, documentValue, propToReturn = 'id') => {

	const dynamoItem = parseDynamoTypedObject(documentValue);

	await dynamodb.putItem({
		TableName: table,
		Item: dynamoItem
	}).promise();

	return propToReturn && documentValue[propToReturn] ? documentValue[propToReturn] : null;
};

module.exports.updateOne = async (table, uniqueKey, updateData) => {

	const result = await dynamodb.updateItem({
		TableName: table,
		ReturnValues: 'ALL_NEW',
		Key: parseDynamoTypedObject(uniqueKey),
		...parseUpdateExpression(updateData)
	}).promise();

	return result && result.Attributes ? parseDynamoItem(result.Attributes) : null;
};

module.exports.deleteOne = async (table, key) => {

	const dynamoKey = parseDynamoTypedObject(key);

	const result = await dynamodb.deleteItem({
		TableName: table,
		ReturnValues: 'ALL_OLD',
		Key: dynamoKey
	}).promise();

	return result && result.Attributes ? parseDynamoItem(result.Attributes) : null;
};
