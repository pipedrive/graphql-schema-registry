const Joi = require('joi');
const {
	deleteService
} = require('../controller/service');

exports.delete = async (req, res) => {
	const params = Joi.attempt(
		req.params,
		Joi.object().keys({
			name: Joi.string().required(),
		})
	);

	const services = await deleteService({ name: params.name });

	return res.json({
		success: services > 0,
		data: null,
	});
};
