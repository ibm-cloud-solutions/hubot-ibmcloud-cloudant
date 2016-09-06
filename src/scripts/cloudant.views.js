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
const palette = require('hubot-ibmcloud-utils').palette;
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

// cloudant list|show views [database]
const LIST_VIEWS_ID = 'bluemix.cloudant.listviews';
const LIST_VIEWS = /cloudant (list|show)\sviews\s(.*)/i;

// cloudant run|execute view [database] [view]
const RUN_VIEW_ID = 'bluemix.cloudant.runview';
const RUN_VIEW = /cloudant (run|execute) view\s(\S+)(\s((\S+):(.*)))?/i;

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

	// Natural Language match: cloudant list|show views [database]
	robot.on(LIST_VIEWS_ID, (res, parameters) => {
		robot.logger.debug(`${TAG}: ${LIST_VIEWS_ID} - Natural Language match - res.message.text=${res.message.text}.`);

		// Verify parameters
		let databaseName;
		if (parameters && parameters.databasename) {
			databaseName = parameters.databasename;
		}
		else {
			robot.logger.error(`${TAG}: Error extracting database name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.listviews');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}

		// If ok, process command
		if (databaseName) {
			processCloudantListViews(res, databaseName);
		}

	});

	// Natural Language match: cloudant run|execute view [database] [view]
	robot.on(RUN_VIEW_ID, (res, parameters) => {
		robot.logger.debug(`${TAG}: ${RUN_VIEW_ID} - Natural Language match - res.message.text=${res.message.text}.`);

		// Verify parameters
		let databaseName;
		let viewName;
		if (parameters && parameters.databasename) {
			databaseName = parameters.databasename;
		}
		else {
			robot.logger.error(`${TAG}: Error extracting database name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.runview.databasename');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
		if (parameters && parameters.viewname) {
			viewName = parameters.viewname;
		}
		else {
			robot.logger.error(`${TAG}: Error extracting database view name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.runview.viewname');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}

		// If ok, process command
		if (databaseName && viewName) {
			processCloudantRunView(res, databaseName, viewName);
		}
	});

	// RegEx match: cloudant list|show views [database]
	robot.respond(LIST_VIEWS, {id: LIST_VIEWS_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${LIST_VIEWS_ID} - RegEx match - res.message.text=${res.message.text}.`);

		// Process command
		processCloudantListViews(res, res.match[2]);
	});

	// RegEx match: cloudant run|execute view [database] [view]
	robot.respond(RUN_VIEW, {id: RUN_VIEW_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${RUN_VIEW_ID} - RegEx match - res.message.text=${res.message.text}.`);

		// Process command
		processCloudantRunView(res, res.match[2], res.match[4]);
	});


	/**
	 * Processes the 'cloudant list|show views [database]' command.
	 * The list of known views for the given database is obtained via the cloudant API and
	 * sent back to the requesting user.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database to obtain views for]
	 */
	function processCloudantListViews(res, databaseName){

		// Tell user that the command is being started.
		robot.logger.info(`${TAG}: Showing all Cloudant database views.`);
		let message = i18n.__('cloudant.listviews', databaseName);
		robot.emit('ibmcloud.formatter', { response: res, message: message });

		// Get a list of all the Cloudant database views.
		cl.cloudant.getDatabaseViews(databaseName).then(function(result) {

			// Build response to send back to user
			const title = i18n.__('cloudant.listviews.title');
			const viewNameList = result.map(function(viewObj) {
				return viewObj.design + ':' + viewObj.view;
			});
			const viewNames = viewNameList.sort().join('\n');
			const attachment = {
				title: title,
				color: palette.normal,
				text: viewNames
			};

			// Emit as attachments
			robot.emit('ibmcloud.formatter', { response: res, attachments: [attachment] });

			// Emit activity
			activity.emitBotActivity(robot, res, {activity_id: 'activity.cloudant.listviews'});

		}).catch(function(err) {
			handleLogCloudantError(robot, err, `${TAG}: An error has occurred listing views for the ${databaseName} Cloudant database.`);
			const message = i18n.__('cloudant.listviews.error', databaseName, err);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		});

	};


	/**
	 * Processes the 'cloudant run|execute view [database] [view]' command.
	 * If the view name is ambiguous (there are multiple design docs with the same
	 * view name), then the desired one is chosen by the user via a conversation.
	 * The optional set of view keys are obtained from the user via a conversation.
	 * The given view is run via the cloudant API and the resulting view results are
	 * sent back to the requesting user.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database to run the view against]
	 * @param {string} viewName [The name of the view to run the view against]
	 */
	function processCloudantRunView(res, databaseName, viewName){

		// If user not set, prompt for user name
		getViewName(res, databaseName, viewName).then(function(newDesignViewObj) {
			let newDesignName = newDesignViewObj.design;
			let newViewName = newDesignViewObj.view;

			// Prompt user for view keys
			getViewKeys(res, databaseName, newDesignName, newViewName).then(function(keys) {

				// Tell user that the command is being started.
				robot.logger.info(`${TAG}: Running view [${newDesignName}/${newViewName}] on ${databaseName} Cloudant database.`);
				let message = i18n.__('cloudant.runview', newViewName, databaseName);
				robot.emit('ibmcloud.formatter', { response: res, message: message });

				// Run the view.
				cl.cloudant.runDatabaseView(databaseName, newDesignName, newViewName, keys).then(function(result) {

					// Build response to send back to user
					let attachments = result.map(function(viewItem) {
						const text = JSON.stringify(viewItem, null, 4);
						const attachment = {
							color: palette.normal,
							text: text
						};
						return attachment;
					});
					const title = i18n.__('cloudant.runview.title');
					attachments.unshift({
						title: title,
						color: palette.normal
					});

					// Emit as attachments
					robot.emit('ibmcloud.formatter', { response: res, attachments: attachments });

					// Emit activity
					activity.emitBotActivity(robot, res, {activity_id: 'activity.cloudant.runview'});

				}).catch(function(err) {
					handleLogCloudantError(robot, err, `${TAG}: An error has occurred running view ${newDesignName}:${newViewName} on Cloudant database ${databaseName}.`);
					const message = i18n.__('cloudant.runview.error', newDesignName + ':' + newViewName, databaseName, err);
					robot.emit('ibmcloud.formatter', { response: res, message: message});
				});

			}).catch(function() {
				let message = i18n.__('cloudant.runview.noview');
				robot.emit('ibmcloud.formatter', { response: res, message: message });
			});

		}).catch(function() {
			let message = i18n.__('cloudant.runview.noview');
			robot.emit('ibmcloud.formatter', { response: res, message: message });
		});

	};

	/**
	 * If the viewName was already specified in the chat text and is valid, use it.
	 * If the viewName was not specified in the chat text or is invalid, then ask the user to enter
	 * the view name.
	 * The Promise's resolve function is invoked with an object.  The object has two fields:
	 *  - design: The name of the design doc containing the view.
	 *  - view: The name of the view.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database]
	 * @param {string} viewName [The previously entered view name (optional)]
	 * @return {Promise} [Promise object]
	 */
	function getViewName(res, databaseName, viewName) {
		return new Promise(function(resolve, reject) {

			// If view was already specifed, check it and if valid, return it
			if (viewName && viewName.length > 0) {
				let parts = viewName.match(/(\S+):(.*)/i);
				if (parts && parts.length === 3) {
					resolve({ design: parts[1], view: parts[2] });
				}
				else {
					robot.logger.debug(`${TAG}: Entered view name is ignored since it is not valid: ${viewName}`);
					viewName = null;
				}
			}

			// View not already specified or invalid, ask user to enter one
			if (!viewName || viewName === null) {

				// Build conversation prompt to send back to user
				let prompt = i18n.__('cloudant.runview.view.prompt');

				// Start conversation and wait for response
				utils.getExpectedResponse(res, robot, switchBoard, prompt, /(\S+):(.*)/i).then(function(dialogResult) {

					// Process user response.  It is expected to be the view name.
					let design = dialogResult.match[1].trim();
					let view = dialogResult.match[2].trim();
					robot.logger.debug(`${TAG}: Dialog reply is: ${design}:${view}`);

					// Return chosen design and view name
					resolve({ design: design, view: view });

				// Reject (exit)
				}).catch(function() {
					robot.logger.debug(`${TAG}: User is choosing to terminate the command.`);
					reject();
				});
			}

		});
	};


	/**
	 * Start a conversation with the user to obtain the list of keys to use when running
	 * the given view.
	 * Returned Promise's resolve function is invoked with an array of key strings.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database]
	 * @param {string} viewName [The name of the view]
	 * @return {Promise} [Promise object]
	 */
	function getViewKeys(res, databaseName, designName, viewName) {
		return new Promise(function(resolve, reject) {

			const NONE_TEXT = 'none';
			const EXIT_TEXT = 'exit';

			// Build conversation prompt to send back to user
			let prompt = i18n.__('cloudant.runview.keys.prompt', viewName, NONE_TEXT, EXIT_TEXT);

			// Start conversation and wait for response
			utils.getExpectedResponse(res, robot, switchBoard, prompt, /(.*)/i).then((dialogResult) => {

				// Process user response.  It is expected to be a ', ' deliminated list of keys.
				let reply = dialogResult.match[1].trim();
				robot.logger.debug(`${TAG}: Dialog reply is: ${reply}`);
				if (reply.length === 0 || reply === NONE_TEXT) {
					resolve([]);
				}
				else if (reply === EXIT_TEXT) {
					robot.logger.debug(`${TAG}: User is choosing to terminate the command with reply [${reply}]`);
					reject();
				}
				else {
					let keys = reply.split(/,\s*/);
					robot.logger.debug(`${TAG}: Keys entered are [${keys}]`);
					resolve(keys);
				}

			});

		});
	};

};
