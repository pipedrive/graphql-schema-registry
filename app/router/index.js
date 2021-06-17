const express = require('express');
const router = express.Router();
const { json } = require('body-parser');
const { asyncWrap } = require('../helpers/middleware');

const assets = require('./assets');
const schema = require('./schema');
const service = require('./service');
const persistedQuery = require('./persisted-queries');

router.use(
	json({
		limit: '16mb',
	})
);
router.use(asyncWrap(require('../middleware/parse-request')));

router.get('/', assets.indexHtml());
assets.router(router);

router.get('/persisted_query', asyncWrap(persistedQuery.get));
router.post('/persisted_query', asyncWrap(persistedQuery.create));

router.get('/schema/latest', asyncWrap(schema.composeLatest));
router.post('/schema/compose', asyncWrap(schema.compose));
router.post('/schema/push', asyncWrap(schema.push));
router.post('/schema/diff', asyncWrap(schema.diff));

router.delete('/schema/delete/:schemaId', asyncWrap(schema.delete));
router.post('/schema/validate', asyncWrap(schema.validate));

router.delete('/service/delete/:name', asyncWrap(service.delete));

module.exports = router;
