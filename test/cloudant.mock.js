/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';
const nock = require('nock');

function buildMockEndpoint() {
	let clEndpoint;
	const endpoint = process.env.HUBOT_CLOUDANT_ENDPOINT || 'https://mycloudant.cloudant.com';
	const username = process.env.HUBOT_CLOUDANT_KEY || 'mycloudant';
	const password = process.env.HUBOT_CLOUDANT_PASSWORD || 'mypassword';
	const index = endpoint.indexOf('://');
	if (index >= 0) {
		clEndpoint = endpoint.substring(0, index + 3) +
						username + ':' + password + '@' +
						endpoint.substring(index + 3);
	}
	else {
		clEndpoint = endpoint;
	}
	return clEndpoint;
}
const cloudantEndpoint = buildMockEndpoint();

const RESOURCES = {
	DATABASES: [ 'test_database01', 'test_database02', 'test_database03' ],
	VIEWS: [	{ design: 'awards', view: 'hasawards' },
				{ design: 'awards2', view: 'hasawards' },
				{ design: 'awards3', view: 'hasawards3' } ],
	USERS: [ 'test_user01', 'test_user02' ]
};

const ERRORS = {
	INIT: 'A mock cloudant initialization error',
	GET_ALL_DBS: 'A mock cloudant _all_dbs error',
	GET_DBINFO: 'A mock cloudant dbinfo error',
	CREATE_DB: 'A mock cloudant dbcreate error',
	GET_PERM: 'A mock cloudant getperm error',
	SET_PERM: 'A mock cloudant setperm error',
	GET_VIEWS: 'A mock cloudant getviews error',
	RUN_VIEW: 'A mock cloudant runview error'
};

let cloudantScope, cloudantErrorScope, cloudantInitErrorScope;

module.exports = {

	RESOURCES: RESOURCES,

	ERRORS: ERRORS,

	setupMockery: function() {
		cloudantScope = nock(cloudantEndpoint).persist();

		cloudantScope.get('/_session')
		.reply(200, { ok: true, userCtx: { name: null, roles: [] } });

		cloudantScope.post('/_session')
		.reply(200, { ok: true, userCtx: { name: null, roles: [] } });

		cloudantScope.get('/')
		.reply(200, { couchdb: 'Welcome', version: '1.0.2' });

		cloudantScope.get('/_all_dbs')
		.reply(200, RESOURCES.DATABASES);

		const _ALL_DOCS0_REGEX = new RegExp('\/' + RESOURCES.DATABASES[0] + '\/_all_docs');
		cloudantScope.get(_ALL_DOCS0_REGEX)
		.reply(200, { total_rows: 22,
						offset: 19,
						rows: [
							{	id: '_design/awards',
								key: '_design/awards',
								value: { rev: '1-546f49f3f258baa07b4596e6eeae7676' },
								doc: {
									_id: '_design/awards',
									_rev: '1-546f49f3f258baa07b4596e6eeae7676',
									views: {
										hasawards: { map: 'function(employee) { if(employee.numAwards) { emit(employee.firstName+\'_\'+employee.lastName, employee.numAwards); } }' }
									}
								}
							},
							{	id: '_design/awards2',
								key: '_design/awards2',
								value: { rev: '1-546f49f3f258baa07b4596e6eeae7676' },
								doc: {
									_id: '_design/awards2',
									_rev: '1-546f49f3f258baa07b4596e6eeae7676',
									views: {
										hasawards: { map: 'function(employee) { if(employee.numAwards) { emit(employee.firstName+\'_\'+employee.lastName, employee.numAwards); } }' }
									}
								}
							},
							{	id: '_design/awards3',
								key: '_design/awards3',
								value: { rev: '1-fb034b4769c6d556a11ccd879f46b875' },
								doc: {
									_id: '_design/awards3',
									_rev: '1-fb034b4769c6d556a11ccd879f46b875',
									views: {
										hasawards3: { map: 'function(employee) { if(employee.numAwards) { emit(employee.firstName+\'_\'+employee.lastName, employee.numAwards); } }' }
									}
								}
							}
						]
					});

		const D0_V1 = new RegExp('\/' + RESOURCES.DATABASES[0] + '\/_design\/(' + RESOURCES.VIEWS[0].design + '|' + RESOURCES.VIEWS[1].design + '|' + RESOURCES.VIEWS[2].design + ')\/_view\/(' + RESOURCES.VIEWS[0].view + '|' + RESOURCES.VIEWS[1].view + '|' + RESOURCES.VIEWS[2].view + ')');
		cloudantScope.get(D0_V1)
		.reply(200, { total_rows: 10,
						offset: 0,
						rows: [
							{	id: '7b26e0fd8c129b8cf9966db70f027b35',
								key: 'Carolyn_Thomas',
								value: 23
							},
							{	id: '7b26e0fd8c129b8cf9966db70f02992e',
								key: 'Carson_White',
								value: 2
							},
							{	id: '7b26e0fd8c129b8cf9966db70f028d4f',
								key: 'David_Williams',
								value: 2
							},
							{	id: '7b26e0fd8c129b8cf9966db70f0226e5',
								key: 'Fred_Johnson',
								value: 2
							},
							{	id: '7b26e0fd8c129b8cf9966db70f024d76',
								key: 'Jack_Johnson',
								value: 1
							},
							{	id: '7b26e0fd8c129b8cf9966db70f025ff6',
								key: 'Jason_Miller',
								value: 8
							},
							{	id: '7b26e0fd8c129b8cf9966db70f02367a',
								key: 'Jennifer_Jackson',
								value: 5
							},
							{	id: '7b26e0fd8c129b8cf9966db70f02471a',
								key: 'John_Smith',
								value: 2
							},
							{	id: '7b26e0fd8c129b8cf9966db70f02c715',
								key: 'Stephanie_Davis',
								value: 8
							},
							{	id: '7b26e0fd8c129b8cf9966db70f02b123',
								key: 'William_Jones',
								value: 5
							}
						]
					});

		cloudantScope.post(D0_V1)
		.reply(200, { total_rows: 10,
						offset: 3,
						rows: [
							{	id: '7b26e0fd8c129b8cf9966db70f0226e5',
								key: 'Fred_Johnson',
								value: 2
							},
							{	id: '7b26e0fd8c129b8cf9966db70f024d76',
								key: 'Jack_Johnson',
								value: 1
							},
							{	id: '7b26e0fd8c129b8cf9966db70f02b123',
								key: 'William_Jones',
								value: 5
							}
						]
					});

		cloudantScope.get('/' + RESOURCES.DATABASES[0])
		.reply(200, { db_name: RESOURCES.DATABASES[0],
						sizes: { file: 148920, external: 459, active: 5874 },
						purge_seq: 0,
						other: { data_size: 459 },
						doc_del_count: 0,
						doc_count: 2,
						disk_size: 148920,
						disk_format_version: 6,
						compact_running: false,
						instance_start_time: '0' });

		cloudantScope.put('/' + RESOURCES.DATABASES[0])
		.reply(200, { ok: true });

		cloudantScope.get('/_api/v2/db/' + RESOURCES.DATABASES[0] + '/_security')
		.reply(200, { _id: 'security',
						cloudant: {
							'11111111-1111-1111-1111-111111111111-bluemix': [ '_admin', '_reader', '_writer', '_replicator' ],
							nobody: [],
							test_user01: [ '_reader', '_writer' ],
							test_user02: [ '_reader' ]
						}
					});

		cloudantScope.put('/_api/v2/db/' + RESOURCES.DATABASES[0] + '/_security')
		.reply(200, { ok: true });

	},

	destroyMockery: function() {

		if (cloudantScope) {
			nock.cleanAll();
			cloudantScope = undefined;
		}

	},

	setupInitErrorMockery: function() {
		cloudantInitErrorScope = nock(cloudantEndpoint).persist();

		cloudantInitErrorScope.get('/_session')
		.reply(500, { message: ERRORS.INIT });

		cloudantInitErrorScope.post('/_session')
		.reply(500, { message: ERRORS.INIT });

		cloudantInitErrorScope.get('/')
		.reply(500, { message: ERRORS.INIT });

	},

	destroyInitErrorMockery: function() {

		if (cloudantInitErrorScope) {
			nock.cleanAll();
			cloudantInitErrorScope = undefined;
		}

	},

	setupErrorMockery: function() {
		cloudantErrorScope = nock(cloudantEndpoint).persist();

		cloudantErrorScope.get('/_session')
		.reply(200, { ok: true, userCtx: { name: null, roles: [] } });

		cloudantErrorScope.post('/_session')
		.reply(200, { ok: true, userCtx: {name: null, roles: [] } });

		cloudantErrorScope.get('/')
		.reply(200, { couchdb: 'Welcome', version: '1.0.2' });

		cloudantErrorScope.get('/_all_dbs')
		.reply(500, { message: ERRORS.GET_ALL_DBS });

		const _ALL_DOCS0_REGEX = new RegExp('\/' + RESOURCES.DATABASES[0] + '\/_all_docs');
		cloudantErrorScope.get(_ALL_DOCS0_REGEX)
		.reply(500, { message: ERRORS.GET_VIEWS });

		const D0_V1 = new RegExp('\/' + RESOURCES.DATABASES[0] + '\/_design\/(' + RESOURCES.VIEWS[0].design + '|' + RESOURCES.VIEWS[1].design + '|' + RESOURCES.VIEWS[2].design + ')\/_view\/(' + RESOURCES.VIEWS[0].view + '|' + RESOURCES.VIEWS[1].view + '|' + RESOURCES.VIEWS[2].view + ')');
		cloudantErrorScope.get(D0_V1)
		.reply(500, { message: ERRORS.RUN_VIEW });

		cloudantErrorScope.post(D0_V1)
		.reply(500, { message: ERRORS.RUN_VIEW });

		cloudantErrorScope.get('/' + RESOURCES.DATABASES[0])
		.reply(500, { message: ERRORS.GET_DBINFO });

		cloudantErrorScope.put('/' + RESOURCES.DATABASES[0])
		.reply(500, { message: ERRORS.CREATE_DB });

		cloudantErrorScope.get('/_api/v2/db/' + RESOURCES.DATABASES[0] + '/_security')
		.reply(500, { message: ERRORS.GET_PERM });

		cloudantErrorScope.get('/_api/v2/db/' + RESOURCES.DATABASES[1] + '/_security')
		.reply(200, { _id: 'security',
						cloudant: {
							'11111111-1111-1111-1111-111111111111-bluemix': [ '_admin', '_reader', '_writer', '_replicator' ],
							nobody: [],
							test_user01: [ '_reader', '_writer' ],
							test_user02: [ '_reader' ]
						}
					});

		cloudantErrorScope.put('/_api/v2/db/' + RESOURCES.DATABASES[1] + '/_security')
		.reply(500, { message: ERRORS.SET_PERM });

	},

	destroyErrorMockery: function() {

		if (cloudantErrorScope) {
			nock.cleanAll();
			cloudantErrorScope = undefined;
		}

	}

};
