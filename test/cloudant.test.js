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

function waitForMessageQueue(room, len){
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

describe('Load modules through index', function() {

	let room;

	before(function() {
		mockUtils.setupMockery();
	});

	after(function() {
		mockUtils.destroyMockery();
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

	context('load index`', function() {
		it('should load without problems', function() {
			require('../index')(room.robot);
		});
	});
});

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Cloudant through regular expression interface', function() {

	let room;

	before(function() {
		mockUtils.setupMockery();
	});

	after(function() {
		mockUtils.destroyMockery();
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

	context('user calls `cloudant help`', function(done) {
		it('should respond with the help', function(done) {
			room.user.say('mimiron', '@hubot cloudant help').then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages.length).to.eql(2);
				expect(room.messages[1][1]).to.be.a('string');
				let help = 'hubot cloudant list|show databases - ' + i18n.__('help.cloudant.listdatabases') + '\n';
				help += 'hubot cloudant info|details database [database] - ' + i18n.__('help.cloudant.infodatabase') + '\n';
				help += 'hubot cloudant create database [database] - ' + i18n.__('help.cloudant.createdatabase') + '\n';
				help += 'hubot cloudant set permissions (|to|on) [database] (|for) [user/apikey] - ' + i18n.__('help.cloudant.setpermissions') + '\n';
				help += 'hubot cloudant list|show views [database] - ' + i18n.__('help.cloudant.listviews') + '\n';
				help += 'hubot cloudant run|execute view [database] [view] - ' + i18n.__('help.cloudant.runview') + '\n';
				expect(room.messages[1]).to.eql(['hubot', '@mimiron \n' + help]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant list databases`', function(done) {
		it('should send a slack event with a list of cloudant databases', function(done) {
			room.user.say('mimiron', '@hubot cloudant list databases').then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const dbs = mockUtils.RESOURCES.DATABASES.join('\n');
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listdatabases')]);
				let event = room.messages[2][1];
				expect(event.attachments.length).to.eql(1);
				expect(event.attachments[0].title).to.eql(i18n.__('cloudant.listdatabases.title'));
				expect(event.attachments[0].text).to.eql(dbs);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant info database [database]`', function(done) {
		it('should send a slack event with details of a cloudant database', function(done) {
			room.user.say('mimiron', '@hubot cloudant info database ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.databaseinfo', mockUtils.RESOURCES.DATABASES[0])]);
				let event = room.messages[2][1];
				expect(event.attachments.length).to.eql(1);
				expect(event.attachments[0].title).to.eql(mockUtils.RESOURCES.DATABASES[0]);
				expect(event.attachments[0].fields.length).to.eql(7);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant create database [database]`', function(done) {
		it('should send a slack event with results of cloudant database creation', function(done) {
			room.user.say('mimiron', '@hubot cloudant create database ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.createdatabase', mockUtils.RESOURCES.DATABASES[0])]);
				expect(room.messages[2]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.createdatabase.success', mockUtils.RESOURCES.DATABASES[0])]);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant set permissions to [database]; ask for user and permissions`', function(done) {
		it('should send a slack event with results of cloudant set permissions', function(done) {
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.user.prompt', mockUtils.RESOURCES.DATABASES[0])]);
				room.user.say('mimiron', '@hubot ' + mockUtils.RESOURCES.USERS[0]).then(() => {
					return waitForMessageQueue(room, 4);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.keep.prompt', i18n.__('cloudant.setpermissions._reader'), mockUtils.RESOURCES.USERS[0], '_reader')]);
					room.user.say('mimiron', '@hubot yes').then(() => {
						return waitForMessageQueue(room, 6);
					}).then(() => {
						expect(room.messages[5]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.keep.prompt', i18n.__('cloudant.setpermissions._writer'), mockUtils.RESOURCES.USERS[0], '_writer')]);
						room.user.say('mimiron', '@hubot yes').then(() => {
							return waitForMessageQueue(room, 8);
						}).then(() => {
							expect(room.messages[7]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.add.prompt', i18n.__('cloudant.setpermissions._replicator'), mockUtils.RESOURCES.USERS[0], '_replicator')]);
							room.user.say('mimiron', '@hubot yes').then(() => {
								return waitForMessageQueue(room, 10);
							}).then(() => {
								expect(room.messages[9]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.add.prompt', i18n.__('cloudant.setpermissions._admin'), mockUtils.RESOURCES.USERS[0], '_admin')]);
								room.user.say('mimiron', '@hubot yes').then(() => {
									return waitForMessageQueue(room, 13);
								}).then(() => {
									expect(room.messages[11]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions', mockUtils.RESOURCES.USERS[0], ['_reader', '_writer', '_replicator', '_admin'], mockUtils.RESOURCES.DATABASES[0])]);
									expect(room.messages[12]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.success', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[0])]);
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
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant set permissions to [database]; ask for user; exit entered`', function(done) {
		it('should send a slack event with results of cloudant set permissions', function(done) {
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.user.prompt', mockUtils.RESOURCES.DATABASES[0])]);
				room.user.say('mimiron', '@hubot exit').then(() => {
					return waitForMessageQueue(room, 4);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.nouser')]);
					done();
				}).catch((error) => {
					done(error);
				});
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant set permissions to [database] for [username]; ask for permissions`', function(done) {
		it('should send a slack event with results of cloudant set permissions', function(done) {
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[0] + ' for ' + mockUtils.RESOURCES.USERS[0]).then(() => {
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
								expect(room.messages[9]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.none', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[0])]);
								expect(room.messages[10]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.success', mockUtils.RESOURCES.USERS[0], mockUtils.RESOURCES.DATABASES[0])]);
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

	context('user calls `cloudant set permissions to [database] for [username]; ask for permissions; invalid user entered, then exit`', function(done) {
		it('should send a slack event with no user message', function(done) {
			room.user.say('mimiron', '@hubot cloudant set permissions to ' + mockUtils.RESOURCES.DATABASES[0] + ' for ' + mockUtils.RESOURCES.USERS[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.keep.prompt', i18n.__('cloudant.setpermissions._reader'), mockUtils.RESOURCES.USERS[0], '_reader')]);
				room.user.say('mimiron', '@hubot junk').then(() => {
					return waitForMessageQueue(room, 5);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron That is not one of the choices. Try again, or type *exit*.']);
					expect(room.messages[4]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.permissions.keep.prompt', i18n.__('cloudant.setpermissions._reader'), mockUtils.RESOURCES.USERS[0], '_reader')]);
					room.user.say('mimiron', '@hubot exit').then(() => {
						return waitForMessageQueue(room, 7);
					}).then(() => {
						expect(room.messages[6]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.setpermissions.nopermissions')]);
						done();
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

	context('user calls `cloudant list views [database]`', function(done) {
		it('should send a slack event with a list of cloudant database views', function(done) {
			room.user.say('mimiron', '@hubot cloudant list views ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 3);
			}).then(() => {
				const viewNameList = mockUtils.RESOURCES.VIEWS.map(function(viewObj) {
					return viewObj.design + ':' + viewObj.view;
				});
				const views = viewNameList.sort().join('\n');
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.listviews', mockUtils.RESOURCES.DATABASES[0])]);
				let event = room.messages[2][1];
				expect(event.attachments.length).to.eql(1);
				expect(event.attachments[0].title).to.eql(i18n.__('cloudant.listviews.title'));
				expect(event.attachments[0].text).to.eql(views);
				done();
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant run view [database]; enter view, multiple keys`', function(done) {
		it('should send a slack event with results of running view', function(done) {
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.view.prompt')]);
				room.user.say('mimiron', '@hubot ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
					return waitForMessageQueue(room, 4);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
					room.user.say('mimiron', '@hubot Fred_Johnson, Jack_Johnson, William_Jones').then(() => {
						return waitForMessageQueue(room, 7);
					}).then(() => {
						expect(room.messages[5]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview', mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0])]);
						let event = room.messages[6][1];
						expect(event.attachments.length).to.eql(4);
						expect(event.attachments[0].title).to.eql(i18n.__('cloudant.runview.title'));
						for (var i = 1; i < event.attachments.length; i++) {
							expect(event.attachments[i].text).to.contain('key');
							expect(event.attachments[i].text).to.contain('value');
						}
						done();
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

	context('user calls `cloudant run view [database]; enter invalid view then exit`', function(done) {
		it('should send a slack event with no view message', function(done) {
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0]).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.view.prompt')]);
				room.user.say('mimiron', '@hubot junk').then(() => {
					return waitForMessageQueue(room, 5);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron That is not one of the choices. Try again, or type *exit*.']);
					expect(room.messages[4]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.view.prompt')]);
					room.user.say('mimiron', '@hubot exit').then(() => {
						return waitForMessageQueue(room, 7);
					}).then(() => {
						expect(room.messages[6]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.noview')]);
						done();
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

	context('user calls `cloudant run view [database]; bad view, enter view, multiple keys`', function(done) {
		it('should send a slack event with results of running view', function(done) {
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0] + ' ' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.view.prompt')]);
				room.user.say('mimiron', '@hubot ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
					return waitForMessageQueue(room, 4);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
					room.user.say('mimiron', '@hubot Fred_Johnson, Jack_Johnson, William_Jones').then(() => {
						return waitForMessageQueue(room, 7);
					}).then(() => {
						expect(room.messages[5]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview', mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0])]);
						let event = room.messages[6][1];
						expect(event.attachments.length).to.eql(4);
						expect(event.attachments[0].title).to.eql(i18n.__('cloudant.runview.title'));
						for (var i = 1; i < event.attachments.length; i++) {
							expect(event.attachments[i].text).to.contain('key');
							expect(event.attachments[i].text).to.contain('value');
						}
						done();
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

	context('user calls `cloudant run view [database]; view provided, multiple keys`', function(done) {
		it('should send a slack event with results of running view', function(done) {
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0] + ' ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
				room.user.say('mimiron', '@hubot Fred_Johnson, Jack_Johnson, William_Jones').then(() => {
					return waitForMessageQueue(room, 5);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview', mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0])]);
					let event = room.messages[4][1];
					expect(event.attachments.length).to.eql(4);
					expect(event.attachments[0].title).to.eql(i18n.__('cloudant.runview.title'));
					for (var i = 1; i < event.attachments.length; i++) {
						expect(event.attachments[i].text).to.contain('key');
						expect(event.attachments[i].text).to.contain('value');
					}
					done();
				}).catch((error) => {
					done(error);
				});
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant run view [database]; view provided, no keys`', function(done) {
		it('should send a slack event with results of running view', function(done) {
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0] + ' ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
				room.user.say('mimiron', '@hubot none').then(() => {
					return waitForMessageQueue(room, 5);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview', mockUtils.RESOURCES.VIEWS[0].view, mockUtils.RESOURCES.DATABASES[0])]);
					let event = room.messages[4][1];
					expect(event.attachments.length).to.eql(11);
					expect(event.attachments[0].title).to.eql(i18n.__('cloudant.runview.title'));
					for (var i = 1; i < event.attachments.length; i++) {
						expect(event.attachments[i].text).to.contain('key');
						expect(event.attachments[i].text).to.contain('value');
					}
					done();
				}).catch((error) => {
					done(error);
				});
			}).catch((error) => {
				done(error);
			});
		});
	});

	context('user calls `cloudant run view [database]; view provided, exit on keys`', function(done) {
		it('should send a slack event with no view message', function(done) {
			room.user.say('mimiron', '@hubot cloudant run view ' + mockUtils.RESOURCES.DATABASES[0] + ' ' + mockUtils.RESOURCES.VIEWS[0].design + ':' + mockUtils.RESOURCES.VIEWS[0].view).then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				expect(room.messages[1]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.keys.prompt', mockUtils.RESOURCES.VIEWS[0].view, 'none', 'exit')]);
				room.user.say('mimiron', '@hubot exit').then(() => {
					return waitForMessageQueue(room, 4);
				}).then(() => {
					expect(room.messages[3]).to.eql(['hubot', '@mimiron ' + i18n.__('cloudant.runview.noview')]);
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
