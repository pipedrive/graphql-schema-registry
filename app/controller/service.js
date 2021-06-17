const logger = require('../logger');

const { deleteService } = require('../database/services');

exports.deleteService = async ({ name }) => {
	const services = await deleteService({ name });
	if (services > 0) {
		logger.info('Deleted service from DB', { name });
	} else {
		logger.info('Service was not deleted from DB (not found)', { name });
	}
	return services;
};
