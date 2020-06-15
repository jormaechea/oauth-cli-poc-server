'use strict';

module.exports = api => async event => {
	try {
		const result = await api(event);
		return { body: JSON.stringify(result) };
	} catch(e) {
		throw new Error(`An error ocurred: ${e.message}`);
	}
};
