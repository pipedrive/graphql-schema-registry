const logger = require('./app/logger');

process.on('unhandledRejection', (error) => {
	logger.error(`unhandledRejection: ${error.message}`, {
		original_error: error,
	});
	setTimeout(() => process.exit(), 3000);
});

process.on('uncaughtException', (error) => {
	logger.error(`uncaughtException: ${error.message}`, {
		original_error: error,
	});
	setTimeout(() => process.exit(), 3000);
});

logger.info(`Starting schema-registry...`);

async function warmup() {
	logger.info('Warming up');
	logger.info(`Looking for environment variable DB_EXECUTE_MIGRATIONS  = ${process.env.DB_EXECUTE_MIGRATIONS}`);

	const executeMigrations = (process.env.DB_EXECUTE_MIGRATIONS || 'true').trim();

	logger.info(`Will execute DB migrations? ${executeMigrations}`);

	try {

		if (executeMigrations === 'true') {
			await require('./app/database').knex.migrate.latest();
		}

		await require('./app').init();

		logger.info('Warm up complete');
	} catch (error) {
		logger.error(`Service failed to warm up: ${error.message}`, {
			original_error: error,
		});

		setTimeout(() => warmup(), 10000);
	}
}

warmup();
