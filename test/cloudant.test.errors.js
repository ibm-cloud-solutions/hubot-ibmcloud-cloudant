/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2016. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
'use strict';

const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');
const expect = require('chai').expect;
const sprinkles = require('mocha-sprinkles');
const mockUtils = require('./cloudant.mock');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
var i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../src/messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

// Length of time to wait for a message
const timeout = 1000;

function waitForMessageQueue(room, len) {
	return sprinkles.eventually({
		timeout: timeout
	}, function() {
		if (room.messages.length < len) {
			throw new Error('too soon');
		}
	}).then(() => false).catch(() => true).then((success) => {
		// Great.  Move on to tests
		expect(room.messages.length).to.eql(len);
	});
}

function getError(errorString) {
	return 'Error: ' + errorString;
}

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Cloudant through regular expression interface: Bad Env Error Testing', function() {

	let room;
	let saveEndpoint;
	let savePassword;

	const MISSING_ENDPOINT_MSG = 'The HUBOT_CLOUDANT_ENDPOINT is not set; Cloudant operations cannot be performed.';
	const MISSING_PASSWORD_MSG = 'The HUBOT_CLOUDANT_PASSWORD is not set; Cloudant operations cannot be performed.';

	before(function() {
		saveEndpoint = process.env.HUBOT_CLOUDANT_ENDPOINT;
		savePassword = process.env.HUBOT_CLOUDANT_PASSWORD;
	});

	after(function() {
		process.env.HUBOT_CLOUDANT_ENDPOINT = saveEndpoint;
		process.env.HUBOT_CLOUDANT_PASSWORD = savePassword;
		const cloudant = require('../src/lib/cloudant').cloudant;
		cloudant.clearEnv();
	});

	beforeEach(function() {
		process.env.HUBOT_CLOUDANT_ENDPOINT = saveEndpoint;
		process.env.HUBOT_CLOUDANT_PASSWORD = savePassword;
		const cloudant = require('../src/lib/cloudant').cloudant;
		cloudant.clearEnv();
		room = helper.createRoom();
		// Force all emits into a reply.
		room.robot.on('ibmcloud.formatter', function(event) {
			if (event.message) {
				event.response.reply(event.message);
			}
			else {
				event.response.send({attachments: event.attachments});
			}
		});
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `cloudant list databases`: init env endpoint error', function(done) {
		it('should send an event with an init env endpoint error', function(done) {
			delete process.env.HUBOT_CLOUDANT_ENDPOINT;
			room.user.say('mimiron', '@hubot cloudant list databases').then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listdatabases.error', getError(MISSING_ENDPOINT_MSG))]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant list databases`: init env password error', function(done) {
		it('should send an event with an init env password error', function(done) {
			delete process.env.HUBOT_CLOUDANT_PASSWORD;
			room.user.say('mimiron', '@hubot cloudant list databases').then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listdatabases.error', getError(MISSING_PASSWORD_MSG))]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant set permissions to [database] for [username]`: init env endpoint error', function(done) {
		it('should send an event with an init env endpoint error', function(done) {
			delete process.env.HUBOT_CLOUDANT_ENDPOINT;
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[0] + ' for ' + mockUtils.RESOURCES.USERS[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.get.error', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[0], getError(MISSING_ENDPOINT_MSG))]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant set permissions to [database] for [username]`: init env password error', function(done) {
		it('should send an event with an init env password error', function(done) {
			delete process.env.HUBOT_CLOUDANT_PASSWORD;
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[0] + ' for ' + mockUtils.RESOURCES.USERS[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.get.error', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[0], getError(MISSING_PASSWORD_MSG))]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant list views [database]`: init env endpoint error', function(done) {
		it('should send an event with an init env endpoint error', function(done) {
			delete process.env.HUBOT_CLOUDANT_ENDPOINT;
			room.user.say('mimiron', '@hubot cloudant list views ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listviews.error', mockUtils.RESOURCES.DATABASES[0], getError(MISSING_ENDPOINT_MSG))]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant list views [database]`: init env password error', function(done) {
		it('should send an event with an init env password error', function(done) {
			delete process.env.HUBOT_CLOUDANT_PASSWORD;
			room.user.say('mimiron', '@hubot cloudant list views ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listviews.error', mockUtils.RESOURCES.DATABASES[0], getError(MISSING_PASSWORD_MSG))]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant run view [database] [view]`: init env endpoint error', function(done) {
		it('should send an event with an init env endpoint error', function(done) {
			delete process.env.HUBOT_CLOUDANT_ENDPOINT;
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0] + ' ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
				room.user.say('mimiron', '@hubot none').then(() => {
					return waitForMessageQueue(room, 5);
				}).then(() => {
					expect(room.messages[4]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.error', mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0], getError(MISSING_ENDPOINT_MSG))]);
					done();
				}).catch((error) => {
					done(error);
				});
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant run view [database] [view]`: init env password error', function(done) {
		it('should send an event with an init env password error', function(done) {
			delete process.env.HUBOT_CLOUDANT_PASSWORD;
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0] + ' ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
				room.user.say('mimiron', '@hubot none').then(() => {
					return waitForMessageQueue(room, 5);
				}).then(() => {
					expect(room.messages[4]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.error', mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0], getError(MISSING_PASSWORD_MSG))]);
					done();
				}).catch((error) => {
					done(error);
				});
			}).catch((error) => {
				done(error);
			});
		});
	});

});

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Cloudant through regular expression interface: Init Error Testing', function() {

	let room;

	before(function() {
		mockUtils.setupInitErrorMockery();
	});

	after(function() {
		mockUtils.destroyInitErrorMockery();
	});

	beforeEach(function() {
		room = helper.createRoom();
		// Force all emits into a reply.
		room.robot.on('ibmcloud.formatter', function(event) {
			if (event.message) {
				event.response.reply(event.message);
			}
			else {
				event.response.send({attachments: event.attachments});
			}
		});
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `cloudant list databases`: init error', function(done) {
		it('should send an event with an init error', function(done) {
			room.user.say('mimiron', '@hubot cloudant list databases').then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.INIT);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listdatabases.error', errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant info database [database]`: init error', function(done) {
		it('should send an event with an init error', function(done) {
			room.user.say('mimiron', '@hubot cloudant info database ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.INIT);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.databaseinfo.error', mockUtils.RESOURCES.DATABASES[0], errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant create database [database]`: init error', function(done) {
		it('should send an event with an init error', function(done) {
			room.user.say('mimiron', '@hubot cloudant create database ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.INIT);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.createdatabase.error', mockUtils.RESOURCES.DATABASES[0], errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant set permissions to [database] for [username]`: init error on get', function(done) {
		it('should send an event with an init error', function(done) {
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[0] + ' for ' + mockUtils.RESOURCES.USERS[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.INIT);
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.get.error', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[0], errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant list views [database]`: init error', function(done) {
		it('should send an event with an init error', function(done) {
			room.user.say('mimiron', '@hubot cloudant list views ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.INIT);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listviews.error', mockUtils.RESOURCES.DATABASES[0], errMsg)]);
				done();
			});
		});
	});

	context('user calls `cloudant run view [database] [view]`: init error', function(done) {
		it('should send an event with an init error', function(done) {
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0] + ' ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
				room.user.say('mimiron', '@hubot none').then(() => {
					return waitForMessageQueue(room, 5);
				}).then(() => {
					const errMsg = getError(mockUtils.ERRORS.INIT);
					expect(room.messages[4]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.error', mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0], errMsg)]);
					done();
				}).catch((error) => {
					done(error);
				});
			}).catch((error) => {
				done(error);
			});
		});
	});

});


// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Cloudant through regular expression interface: Error Testing', function() {

	let room;

	before(function() {
		mockUtils.setupErrorMockery();
	});

	after(function() {
		mockUtils.destroyErrorMockery();
	});

	beforeEach(function() {
		room = helper.createRoom();
		// Force all emits into a reply.
		room.robot.on('ibmcloud.formatter', function(event) {
			if (event.message) {
				event.response.reply(event.message);
			}
			else {
				event.response.send({attachments: event.attachments});
			}
		});
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `cloudant list databases`: error', function(done) {
		it('should send an event with an error', function(done) {
			room.user.say('mimiron', '@hubot cloudant list databases').then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.GET_ALL_DBS);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listdatabases.error', errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant info database [database]`: error', function(done) {
		it('should send an event with an error', function(done) {
			room.user.say('mimiron', '@hubot cloudant info database ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.GET_DBINFO);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.databaseinfo.error', mockUtils.RESOURCES.DATABASES[0], errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant create database [database]`: error', function(done) {
		it('should send an event with an error', function(done) {
			room.user.say('mimiron', '@hubot cloudant create database ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.CREATE_DB);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.createdatabase.error', mockUtils.RESOURCES.DATABASES[0], errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant set permissions to [database] for [username]`: error on get', function(done) {
		it('should send an event with an error', function(done) {
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[0] + ' for ' + mockUtils.RESOURCES.USERS[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.GET_PERM);
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.get.error', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[0], errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant set permissions to [database] for [username]`: error on set', function(done) {
		it('should send an event with an init error', function(done) {
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[1] + ' for ' + mockUtils.RESOURCES.USERS[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.keep.prompt', i18n.__('cloudant.setpermissions._reader'), mockUtils.RESOURCES.USERS[0], '_reader')]);
				room.user.say('mimiron', '@hubot no').then(() => {
					return waitForMessageQueue(room, 4);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.keep.prompt', i18n.__('cloudant.setpermissions._writer'), mockUtils.RESOURCES.USERS[0], '_writer')]);
					room.user.say('mimiron', '@hubot no').then(() => {
						return waitForMessageQueue(room, 6);
					}).then(() => {
						expect(room.messages[5]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.add.prompt', i18n.__('cloudant.setpermissions._replicator'), mockUtils.RESOURCES.USERS[0], '_replicator')]);
						room.user.say('mimiron', '@hubot no').then(() => {
							return waitForMessageQueue(room, 8);
						}).then(() => {
							expect(room.messages[7]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.add.prompt', i18n.__('cloudant.setpermissions._admin'), mockUtils.RESOURCES.USERS[0], '_admin')]);
							room.user.say('mimiron', '@hubot no').then(() => {
								return waitForMessageQueue(room, 11);
							}).then(() => {
								const errMsg = getError(mockUtils.ERRORS.SET_PERM);
								expect(room.messages[10]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.set.error', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[1], errMsg)]);
								done();
							}).catch((error) => {
								done(error);
							});
						}).catch((error) => {
							done(error);
						});
					}).then(() => {
					}).catch((error) => {
						done(error);
					});
				}).catch((error) => {
					done(error);
				});
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant list views [database]`: error', function(done) {
		it('should send an event with an error', function(done) {
			room.user.say('mimiron', '@hubot cloudant list views ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const errMsg = getError(mockUtils.ERRORS.GET_VIEWS);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listviews.error', mockUtils.RESOURCES.DATABASES[0], errMsg)]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant run view [database] [view]`: error', function(done) {
		it('should send an event with an error', function(done) {
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0] + ' ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
				room.user.say('mimiron', '@hubot none').then(() => {
					return waitForMessageQueue(room, 5);
				}).then(() => {
					const errMsg = getError(mockUtils.ERRORS.RUN_VIEW);
					expect(room.messages[4]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.error', mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0], errMsg)]);
					done();
				}).catch((error) => {
					done(error);
				});
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('verify entity functions', function(done) {
		const entities = require('../src/lib/cloudant.entities');

		it('should get error retrieving set of database names', function(done) {
			entities.getDatabaseNames('databasename', {}).then(function(databaseNames) {
				done(new Error('Expected error but did not get one'));
			}).catch(function(error) {
				if (error) {
					done();
				}
				else {
					done(new Error('Catch block invoked, but no error; expected to get one.'));
				}
			});
		});

		it('should get error retrieving set of database view names', function(done) {
			entities.getViewNames('viewname', {databasename: mockUtils.RESOURCES.DATABASES[0]}).then(function(viewNames) {
				done(new Error('Expected error but did not get one'));
			}).catch(function(error) {
				if (error) {
					done();
				}
				else {
					done(new Error('Catch block invoked, but no error; expected to get one.'));
				}
			});
		});
	});

});
