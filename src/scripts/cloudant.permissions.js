// Description:
//	Listens for commands to initiate database actions against Bluemix Cloudant instance.
//
// Configuration:
//	 HUBOT_CLOUDANT_ENDPOINT Bluemix Cloudant endpoint
//	 HUBOT_CLOUDANT_KEY Bluemix Cloudant username
//	 HUBOT_CLOUDANT_PASSWORD Bluemix Cloudant password
//
// Author:
//	houghtoj
//
/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2016. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
'use strict';

const path = require('path');
const TAG = path.basename(__filename);

const cl = require('../lib/cloudant');
const entities = require('../lib/cloudant.entities');
const utils = require('hubot-ibmcloud-utils').utils;
const Conversation = require('hubot-conversation');
const activity = require('hubot-ibmcloud-activity-emitter');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

// cloudant set permissions |to|on [database] |for [username]
const SET_PERMISSIONS_ID = 'bluemix.cloudant.setpermissions';
const SET_PERMISSIONS = /cloudant set permissions(\sto|\son)?\s(\S+)(\sfor)?(\s(.*))?/i;

/*
 * Handle writing an error to robot log file.
 * If the given error is related to missing env variables, then log that message.
 * Otherwise, log the given generic message.
 *
 * @param {object} robot [The robot object used to log]
 * @param {object} err [The thrown error object]
 * @param {string} genericLogMessage [The generic message to write to log]
 */
function handleLogCloudantError(robot, err, genericLogMessage) {
	if (err.message.indexOf('HUBOT_CLOUDANT_ENDPOINT is not set') >= 0 ||
		err.message.indexOf('HUBOT_CLOUDANT_PASSWORD is not set') >= 0) {
		robot.logger.error(err.message);
	}
	else {
		robot.logger.error(genericLogMessage + `err=${err}.`);
		robot.logger.error(err.dumpstack);
	}
}

module.exports = (robot) => {

	// Register entity handling functions
	entities.registerEntityFunctions();

	// for dialog
	const switchBoard = new Conversation(robot);

	// Natural Language match: cloudant set permissions |to|on [database] |for [username]
	robot.on(SET_PERMISSIONS_ID, (res, parameters) => {
		robot.logger.debug(`${TAG}: ${SET_PERMISSIONS_ID} - Natural Language match - res.message.text=${res.message.text}.`);

		// Verify parameters
		let databaseName;
		let userName;
		if (parameters && parameters.databasename) {
			databaseName = parameters.databasename;
		}
		else {
			robot.logger.error(`${TAG}: Error extracting database name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.setpermissions.databasename');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
		if (parameters && parameters.username) {
			userName = parameters.username;
		}
		else {
			robot.logger.error(`${TAG}: Error extracting user name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.setpermissions.username');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}

		// If ok, process command
		if (databaseName && userName) {
			processCloudantSetPermissions(res, databaseName, userName);
		}

	});

	// RegEx match: cloudant set permissions |to|on [database] |for [username]
	robot.respond(SET_PERMISSIONS, {id: SET_PERMISSIONS_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${SET_PERMISSIONS_ID} - RegEx match - res.message.text=${res.message.text}.`);

		// Process command
		processCloudantSetPermissions(res, res.match[2], res.match[5]);
	});


	/**
	 * Processes the 'cloudant set permissions |to|on [database] |for [username]' command.
	 * The set of permissions are obtained from the user via a conversation.
	 * Permissions are set for a specific user and database via the cloudant API and
	 * the results are sent back to the requesting user.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database to set permissions for]
	 * @param {string} userName [The name of the user to set permissions for]
	 */
	function processCloudantSetPermissions(res, databaseName, userName){

		// If user not set, prompt for user name
		getUserName(res, databaseName, userName).then(function(newUserName) {

			// Obtain current permissions for the user
			cl.cloudant.getDatabasePermissions(databaseName, newUserName).then(function(result) {

				// Prompt user for permissions to grant
				getPermissionsToSet(res, databaseName, newUserName, result).then(function(permissions) {
					if (permissions != null) {

						// Tell user that the command is being started.
						robot.logger.info(`${TAG}: Granting user ${newUserName} [${permissions}] permissions to ${databaseName} Cloudant database.`);
						let message;
						if (permissions.length > 0) {
							message = i18n.__('cloudant.setpermissions', newUserName, permissions, databaseName);
						}
						else {
							message = i18n.__('cloudant.setpermissions.none', newUserName, databaseName);
						}
						robot.emit('ibmcloud.formatter', { response: res, message: message });

						// Set the specified permissions for the user to the Cloudant database.
						cl.cloudant.setDatabasePermissions(databaseName, newUserName, permissions).then(function(result2) {

							// Emit successful message
							let message = i18n.__('cloudant.setpermissions.success', newUserName, databaseName);
							robot.emit('ibmcloud.formatter', { response: res, message: message });

							// Emit activity
							activity.emitBotActivity(robot, res, {activity_id: 'activity.cloudant.setpermissions'});

						}).catch(function(err) {
							handleLogCloudantError(robot, err, `${TAG}: An error has occurred granting user ${newUserName} [${permissions}] permissions to Cloudant database ${databaseName}.`);
							const message = i18n.__('cloudant.setpermissions.set.error', newUserName, databaseName, err);
							robot.emit('ibmcloud.formatter', { response: res, message: message});
						});

					}
					else {
						let message = i18n.__('cloudant.setpermissions.nopermissions');
						robot.emit('ibmcloud.formatter', { response: res, message: message });
					}
				});

			}).catch(function(err) {
				handleLogCloudantError(robot, err, `${TAG}: An error has occurred obtaining permissions for user ${newUserName} to Cloudant database ${databaseName}.`);
				const message = i18n.__('cloudant.setpermissions.get.error', newUserName, databaseName, err);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
			});

		}).catch(function() {
			let message = i18n.__('cloudant.setpermissions.nouser');
			robot.emit('ibmcloud.formatter', { response: res, message: message });
		});

	};

	/**
	 * If the userName was already specified in the chat text, use it.
	 * If the userName was not specified in the chat text, then ask the user to enter
	 * the user name.
	 * The Promise's resolve function is invoked with the chosen user name.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database]
	 * @param {string} userName [The previously entered user name (optional)]
	 * @return {Promise} [Promise object]
	 */
	function getUserName(res, databaseName, userName) {
		return new Promise(function(resolve, reject) {

			// If user was already specifed, return it
			if (userName && userName.length > 0) {
				resolve(userName);
			}

			// User not already specified, ask user to enter one
			else {

				// Build conversation prompt to send back to user
				let prompt = i18n.__('cloudant.setpermissions.user.prompt', databaseName);

				// Start conversation and wait for response
				utils.getExpectedResponse(res, robot, switchBoard, prompt, /(.*)/i).then(function(dialogResult) {

					// Process user response.  It is expected to be the user name.
					let reply = dialogResult.match[1].trim();
					robot.logger.debug(`${TAG}: Dialog reply is: ${reply}`);

					// If exit was entered, then leave
					if (reply === 'exit') {
						reject();
					}

					// Return chosen user name
					else {
						resolve(reply);
					}

				});
			}

		});
	};

	/**
	 * Start a conversation with the user to obtain the list of permissions to set
	 * for the given database and user.
	 * There are currently four valid permissions (_reader, _writer, _replicator, and _admin).
	 * The user will be prompted for each permission to determine if the user wants to
	 * add or keep that permission.
	 * Returned Promise's resolve function is invoked with an array of permission strings.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database to set permissions for]
	 * @param {string} userName [The name of the user to set permissions for]
	 * @param {array} currentPermissions [An array of current permissions for the given user]
	 * @return {Promise} [Promise object]
	 */
	function getPermissionsToSet(res, databaseName, userName, currentPermissions) {
		return new Promise(function(resolve, reject) {

			let permissions = [];
			const PERMISSIONS = [
				'_reader',
				'_writer',
				'_replicator',
				'_admin'
			];

			// Sequentially prompt the user to see if they wish to add/keep each permission.
			// Once complete, return with the array of desired permissions.
			let prom = Promise.resolve();
			return PERMISSIONS.reduce(function(p, perm) {
				return p.then(function() {
					return getPermissionFromPrompt(res, databaseName, userName, perm, (currentPermissions && currentPermissions.indexOf(perm) >= 0), (permissions === null));
				}).then(function(newPerm) {
					if (newPerm) {
						if (permissions !== null) permissions.push(newPerm);
					}
				}).catch(function() {
					permissions = null;
				});
			}, prom).then(function() {
				resolve(permissions);
			}).catch(function(err) {
				reject(err);
			});

		});
	};

	/**
	 * Start a conversation with the user to determine if it is desired to grant the given
	 * user the given permission to the given database.
	 * Returned Promise's resolve function is invoked with either the permission (if it is
	 * to be granted), undefined (if it is not to be granted), or null (if the user wants to quit).
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database to set permissions for]
	 * @param {string} userName [The name of the user to set permissions for]
	 * @param {string} perm [The permission to grant or not grant]
	 * @param {bool} alreadySet [True if the given permission is already granted]
	 * @param {bool} abort [True if user has pressed exit and would like to abort]
	 * @return {Promise} [Promise object]
	 */
	function getPermissionFromPrompt(res, databaseName, userName, perm, alreadySet, abort) {
		return new Promise(function(resolve, reject) {

			// If abort flag set, then abort
			if (abort) {
				reject();
			}

			// Initiate conversation to obtain permissions
			else {

				let permission;

				// Build conversation prompt to send back to user
				let accessDesc = i18n.__('cloudant.setpermissions.' + perm);
				let prompt;
				if (alreadySet) {
					prompt = i18n.__('cloudant.setpermissions.permissions.keep.prompt', accessDesc, userName, perm);
				}
				else {

					prompt = i18n.__('cloudant.setpermissions.permissions.add.prompt', accessDesc, userName, perm);
				}

				// Start conversation and wait for response
				utils.getExpectedResponse(res, robot, switchBoard, prompt, /(yes|no)/i).then((dialogResult) => {
					let reply = dialogResult.match[1].trim();
					robot.logger.debug(`${TAG}: Dialog reply is: ${reply}`);

					// If response is yes, add the permission to the returned permissions array
					if (reply === 'yes') {
						permission = perm;
					}

					// Respond with either the perm (yes) or undefined (no)
					resolve(permission);

				// Reject (exit)
				}).catch(function() {
					robot.logger.debug(`${TAG}: User is choosing to terminate the command.`);
					reject();
				});

			}

		});
	};

};
