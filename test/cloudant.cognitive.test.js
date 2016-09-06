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
const mockUtils = require('./cloudant.mock');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
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

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Cloudant through natural language interface', function() {

	let room;

	before(function() {
		mockUtils.setupMockery();
	});

	after(function() {
		mockUtils.destroyMockery();
	});

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('user says `I want help with cloudant` ', function() {
		it('should respond help', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				let help = '\n';
				help += 'hubot cloudant list|show databases - ' + i18n.__('help.cloudant.listdatabases') + '\n';
				help += 'hubot cloudant info|details database [database] - ' + i18n.__('help.cloudant.infodatabase') + '\n';
				help += 'hubot cloudant create database [database] - ' + i18n.__('help.cloudant.createdatabase') + '\n';
				help += 'hubot cloudant set permissions (|to|on) [database] (|for) [user/apikey] - ' + i18n.__('help.cloudant.setpermissions') + '\n';
				help += 'hubot cloudant list|show views [database] - ' + i18n.__('help.cloudant.listviews') + '\n';
				help += 'hubot cloudant run|execute view [database] [view] - ' + i18n.__('help.cloudant.runview') + '\n';
				expect(event.message).to.eql(help);
				done();
			});

			let res = { message: {text: 'I want help with cloudant'}, response: room };
			room.robot.emit('bluemix.cloudant.help', res, {});

		});
	});

	context('user calls `Show my cloudant databases`', function(done) {
		it('should send an event with a list of cloudant databases', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.eql(i18n.__('cloudant.listdatabases'));
				}
				else if (event.attachments && event.attachments.length >= 1) {
					const dbs = mockUtils.RESOURCES.DATABASES.join('\n');
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql(i18n.__('cloudant.listdatabases.title'));
					expect(event.attachments[0].text).to.eql(dbs);
					done();
				}
			});

			let res = { message: {text: 'Show my cloudant databases', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.listdatabases', res, {});

		});
	});

	context('user calls `Show me details for my cloudant database [database]`', function(done) {
		it('should send an event with details of a cloudant database', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.eql(i18n.__('cloudant.databaseinfo', mockUtils.RESOURCES.DATABASES[0]));
				}
				else if (event.attachments && event.attachments.length >= 1) {
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql(mockUtils.RESOURCES.DATABASES[0]);
					expect(event.attachments[0].fields.length).to.eql(7);
					done();
				}
			});

			let res = { message: {text: 'Show me details for my cloudant database [database]', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.databaseinfo', res, { databasename: mockUtils.RESOURCES.DATABASES[0] });

		});
	});

	context('user calls `Show me details for my cloudant database`', function(done) {
		it('should send an event with missing databasename error', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.eql(i18n.__('cognitive.parse.problem.databaseinfo'));
				done();
			});

			let res = { message: {text: 'Show me details for my cloudant database', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.databaseinfo', res, {});

		});
	});

	context('user calls `I want to create cloudant database named [database]`', function(done) {
		it('should send an event with results of cloudant database creation', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					if (event.message === i18n.__('cloudant.createdatabase', mockUtils.RESOURCES.DATABASES[0])) {
					}
					else if (event.message === i18n.__('cloudant.createdatabase.success', mockUtils.RESOURCES.DATABASES[0])) {
						done();
					}
					else {
						done(new Error(`Message received [${event.message}] does not match either of the two expected messages.`));
					}
				}
			});

			let res = { message: {text: 'I want to create cloudant database named [database]', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.createdatabase', res, { newdatabasename: mockUtils.RESOURCES.DATABASES[0] });

		});
	});

	context('user calls `I want to create cloudant database named`', function(done) {
		it('should send an event with missing newdatabasename error', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.eql(i18n.__('cognitive.parse.problem.createdatabase'));
				done();
			});

			let res = { message: {text: 'I want to create cloudant database named', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.createdatabase', res, {});

		});
	});

	context('user calls `I want to set permissions to cloudant database [database] for user [username]`', function(done) {
		it('should send an event with results of cloudant set permissions', function(done) {

			let replyFn = function(msg) {
				if (msg.includes(i18n.__('cloudant.setpermissions.permissions.keep.prompt', i18n.__('cloudant.setpermissions._reader'), mockUtils.RESOURCES.USERS[0], '_reader'))) {
					room.user.say('mimiron', '@hubot  yes');
				}
				else if (msg.includes(i18n.__('cloudant.setpermissions.permissions.keep.prompt', i18n.__('cloudant.setpermissions._writer'), mockUtils.RESOURCES.USERS[0], '_writer'))) {
					room.user.say('mimiron', '@hubot  no');
				}
				else if (msg.includes(i18n.__('cloudant.setpermissions.permissions.add.prompt', i18n.__('cloudant.setpermissions._replicator'), mockUtils.RESOURCES.USERS[0], '_replicator'))) {
					room.user.say('mimiron', '@hubot  yes');
				}
				else if (msg.includes(i18n.__('cloudant.setpermissions.permissions.add.prompt', i18n.__('cloudant.setpermissions._admin'), mockUtils.RESOURCES.USERS[0], '_admin'))) {
					room.user.say('mimiron', '@hubot  no');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};

			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					if (event.message === i18n.__('cloudant.setpermissions', mockUtils.RESOURCES.USERS[0], ['_reader', '_replicator'], mockUtils.RESOURCES.DATABASES[0])) {
					}
					else if (event.message === i18n.__('cloudant.setpermissions.success', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[0])) {
						done();
					}
					else {
						done(new Error(`Message received [${event.message}] does not match either of the two expected messages.`));
					}
				}
			});

			let res = { message: {text: 'I want to set permissions to cloudant database [database] for user [username]', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.cloudant.setpermissions', res, { databasename: mockUtils.RESOURCES.DATABASES[0], username: mockUtils.RESOURCES.USERS[0] });

		});
	});

	context('user calls `I want to set permissions to cloudant database for user [username]`', function(done) {
		it('should send an event with missing databasename error', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.eql(i18n.__('cognitive.parse.problem.setpermissions.databasename'));
				done();
			});

			let res = { message: {text: 'I want to set permissions to cloudant database for user [username]', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.setpermissions', res, { username: mockUtils.RESOURCES.USERS[0] });

		});
	});

	context('user calls `I want to set permissions to cloudant database for database [databasename]`', function(done) {
		it('should send an event with missing username error', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.eql(i18n.__('cognitive.parse.problem.setpermissions.username'));
				done();
			});

			let res = { message: {text: 'I want to set permissions to cloudant database for database [databasename]', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.setpermissions', res, { databasename: mockUtils.RESOURCES.DATABASES[0] });

		});
	});

	context('user calls `Show my views for cloudant database [database]`', function(done) {
		it('should send an event with a list of cloudant database views', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.eql(i18n.__('cloudant.listviews', mockUtils.RESOURCES.DATABASES[0]));
				}
				else if (event.attachments && event.attachments.length >= 1) {
					const viewNameList = mockUtils.RESOURCES.VIEWS.map(function(viewObj) {
						return viewObj.design + ':' + viewObj.view;
					});
					const views = viewNameList.sort().join('\n');
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql(i18n.__('cloudant.listviews.title'));
					expect(event.attachments[0].text).to.eql(views);
					done();
				}
			});

			let res = { message: {text: 'Show my views for cloudant database [database]', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.listviews', res, { databasename: mockUtils.RESOURCES.DATABASES[0] });

		});
	});

	context('user calls `Show my views for cloudant database [database]`', function(done) {
		it('should send an event with missing databasename error', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.eql(i18n.__('cognitive.parse.problem.listviews'));
				done();
			});

			let res = { message: {text: 'Show my views for cloudant database', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.listviews', res, {});

		});
	});

	context('user calls `I\'d like to execute a view [view] against my cloudant database [database]`', function(done) {
		it('should send an event with results of running view', function(done) {

			let replyFn = function(msg) {
				if (msg.includes(i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit'))) {
					room.user.say('mimiron', '@hubot Fred_Johnson, Jack_Johnson, William_Jones');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};

			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.eql(i18n.__('cloudant.runview', mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0]));
				}
				else if (event.attachments && event.attachments.length >= 1) {
					expect(event.attachments.length).to.eql(4);
					expect(event.attachments[0].title).to.eql(i18n.__('cloudant.runview.title'));
					for (let i = 1; i < event.attachments.length; i++) {
						expect(event.attachments[i].text).to.contain('key');
						expect(event.attachments[i].text).to.contain('value');
					}
					done();
				}
			});

			let res = { message: {text: 'I\'d like to execute a view [view] against my cloudant database [database]', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.cloudant.runview', res, { databasename: mockUtils.RESOURCES.DATABASES[0], viewname: mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view });

		});
	});

	context('user calls `I\'d like to execute a view [view] against my cloudant database [database]; bad view`', function(done) {
		it('should send an event with results of running view', function(done) {

			let replyFn = function(msg) {
				if (msg.includes(i18n.__('cloudant.runview.view.prompt'))) {
					room.user.say('mimiron', '@hubot ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view);
				}
				else if (msg.includes(i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit'))) {
					room.user.say('mimiron', '@hubot Fred_Johnson, Jack_Johnson, William_Jones');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};

			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.eql(i18n.__('cloudant.runview', mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0]));
				}
				else if (event.attachments && event.attachments.length >= 1) {
					expect(event.attachments.length).to.eql(4);
					expect(event.attachments[0].title).to.eql(i18n.__('cloudant.runview.title'));
					for (let i = 1; i < event.attachments.length; i++) {
						expect(event.attachments[i].text).to.contain('key');
						expect(event.attachments[i].text).to.contain('value');
					}
					done();
				}
			});

			let res = { message: {text: 'I\'d like to execute a view [view] against my cloudant database [database]', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.cloudant.runview', res, { databasename: mockUtils.RESOURCES.DATABASES[0], viewname: mockUtils.RESOURCES.VIEWS[0].view });

		});
	});

	context('user calls `I\'d like to execute a view [view] against my cloudant database`', function(done) {
		it('should send an event with missing databasename error', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.eql(i18n.__('cognitive.parse.problem.runview.databasename'));
				done();
			});

			let res = { message: {text: 'I\'d like to execute a view [view] against my cloudant database', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.runview', res, { viewname: mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view });

		});
	});

	context('user calls `I\'d like to execute a view against my cloudant database [database]`', function(done) {
		it('should send an event with missing viewname error', function(done) {

			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.eql(i18n.__('cognitive.parse.problem.runview.viewname'));
				done();
			});

			let res = { message: {text: 'I\'d like to execute a view against my cloudant database [database]', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.cloudant.runview', res, { databasename: mockUtils.RESOURCES.DATABASES[0] });

		});
	});

	context('verify entity functions', function(done) {

		it('should retrieve set of database names', function(done) {
			const entities = require('../src/lib/cloudant.entities');
			let res = { message: {text: '', user: {id: 'mimiron'}}, response: room };
			entities.getDatabaseNames(room.robot, res, 'databasename', {}).then(function(databaseNames) {
				expect(databaseNames.length).to.eql(mockUtils.RESOURCES.DATABASES.length);
				for (let i = 0; i < databaseNames.length; i++) {
					expect(databaseNames[i]).to.eql(mockUtils.RESOURCES.DATABASES[i]);
				}
				done();
			}).catch(function(error) {
				done(error);
			});
		});

		it('should retrieve set of database view names', function(done) {
			const entities = require('../src/lib/cloudant.entities');
			let res = { message: {text: '', user: {id: 'mimiron'}}, response: room };
			entities.getViewNames(room.robot, res, 'viewname', {databasename: mockUtils.RESOURCES.DATABASES[0]}).then(function(viewNames) {
				expect(viewNames.length).to.eql(mockUtils.RESOURCES.VIEWS.length);
				for (let i = 0; i < viewNames.length; i++) {
					expect(viewNames[i]).to.eql(mockUtils.RESOURCES.VIEWS[i].design + ':' + mockUtils.RESOURCES.VIEWS[i].view);
				}
				done();
			}).catch(function(error) {
				done(error);
			});
		});

		it('should get error retrieving set of database view names; no databasename provided', function(done) {
			const entities = require('../src/lib/cloudant.entities');
			entities.getViewNames('viewname', {}).then(function(viewNames) {
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
