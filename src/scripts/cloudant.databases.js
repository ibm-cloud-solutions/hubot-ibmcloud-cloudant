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

var path = require('path');
var TAG = path.basename(__filename);

const cl = require('../lib/cloudant');
const entities = require('../lib/cloudant.entities');
const palette = require('hubot-ibmcloud-utils').palette;
const utils = require('hubot-ibmcloud-utils').utils;
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;
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

// cloudant list|show databases
const LIST_DATABASES_ID = 'bluemix.cloudant.listdatabases';
const LIST_DATABASES = /cloudant (list|show)\sdatabases$/i;

// cloudant info|details database [database]
const DATABASE_INFO_ID = 'bluemix.cloudant.databaseinfo';
const DATABASE_INFO = /cloudant (info|details)\sdatabase\s(.*)/i;

// cloudant create database [database]
const CREATE_DATABASE_ID = 'bluemix.cloudant.createdatabase';
const CREATE_DATABASE = /cloudant create\sdatabase\s(.*)/i;

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

	// Natural Language match: cloudant list|show databases
	robot.on(LIST_DATABASES_ID, (res, parameters) => {
		robot.logger.debug(`${TAG}: ${LIST_DATABASES_ID} - Natural Language match - res.message.text=${res.message.text}.`);

		// Process command
		processCloudantListDatabases(res);
	});

	// Natural Language match: cloudant info|details database [database]
	robot.on(DATABASE_INFO_ID, (res, parameters) => {
		robot.logger.debug(`${TAG}: ${DATABASE_INFO_ID} - Natural Language match - res.message.text=${res.message.text}.`);

		// Verify parameters
		var databaseName;
		if (parameters && parameters.databasename) {
			databaseName = parameters.databasename;
		}
		else {
			robot.logger.error(`${TAG}: Error extracting database name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.databaseinfo');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}

		// If ok, process command
		if (databaseName) {
			processCloudantDatabaseInfo(res, databaseName);
		}

	});

	// Natural Language match: cloudant create database [database]
	robot.on(CREATE_DATABASE_ID, (res, parameters) => {
		robot.logger.debug(`${TAG}: ${CREATE_DATABASE_ID} - Natural Language match - res.message.text=${res.message.text}.`);

		// Verify parameters
		var newDatabaseName;
		if (parameters && parameters.newdatabasename) {
			newDatabaseName = parameters.newdatabasename;
		}
		else {
			robot.logger.error(`${TAG}: Error extracting database name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.createdatabase');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}

		// If ok, process command
		if (newDatabaseName) {
			processCloudantCreateDatabase(res, newDatabaseName);
		}
	});

	// RegEx match: cloudant list|show databases
	robot.respond(LIST_DATABASES, {id: LIST_DATABASES_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${LIST_DATABASES_ID} - RegEx match - res.message.text=${res.message.text}.`);

		// Process command
		processCloudantListDatabases(res);
	});

	// RegEx match: cloudant info|details database [database]
	robot.respond(DATABASE_INFO, {id: DATABASE_INFO_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${LIST_DATABASES_ID} - RegEx match - res.message.text=${res.message.text}.`);

		// Process command
		processCloudantDatabaseInfo(res, res.match[2]);
	});

	// RegEx match: cloudant create database [database]
	robot.respond(CREATE_DATABASE, {id: CREATE_DATABASE_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${CREATE_DATABASE_ID} - RegEx match - res.message.text=${res.message.text}.`);

		// Process command
		processCloudantCreateDatabase(res, res.match[1]);
	});


	/**
	 * Processes the 'cloudant list|show databases' command.
	 * The list of known databases is obtained via the cloudant API and
	 * sent back to the requesting user.
	 *
	 * @param {object} res [The hubot response object]
	 */
	function processCloudantListDatabases(res){

		// Tell user that the command is being started.
		robot.logger.info(`${TAG}: Showing all Cloudant database names.`);
		let message = i18n.__('cloudant.listdatabases');
		robot.emit('ibmcloud.formatter', { response: res, message: message });

		// Get a list of all the Cloudant databases.
		cl.cloudant.getDatabases().then(function(result) {

			// Update nlc parameter values for database parameter
			nlcconfig.updateGlobalParameterValues('IBMcloudCloudant_databasename', result);

			// Build response to send back to user
			const title = i18n.__('cloudant.listdatabases.title');
			const databaseNames = result.join('\n');
			const attachment = {
				title: title,
				color: palette.normal,
				text: databaseNames
			};

			// Emit as attachments
			robot.emit('ibmcloud.formatter', { response: res, attachments: [attachment] });

			// Emit activity
			activity.emitBotActivity(robot, res, {activity_id: 'activity.cloudant.listdatabases'});

		}).catch(function(err) {
			handleLogCloudantError(robot, err, `${TAG}: An error has occurred listing Cloudant database names.`);
			const message = i18n.__('cloudant.listdatabases.error', err);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		});

	};


	/**
	 * Processes the 'cloudant info|details database [database]' command.
	 * The detailed information for the given database is obtained via the cloudant API and
	 * sent back to the requesting user.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database to obtain info for]
	 */
	function processCloudantDatabaseInfo(res, databaseName){

		// Tell user that the command is being started.
		robot.logger.info(`${TAG}: Showing details for Cloudant database ${databaseName}.`);
		let message = i18n.__('cloudant.databaseinfo', databaseName);
		robot.emit('ibmcloud.formatter', { response: res, message: message });

		// Get detailed information for the given Cloudant database.
		cl.cloudant.getDatabaseInfo(databaseName).then(function(result) {

			// Build response to send back to user
			var attachments = [];
			const attachment = {
				title: databaseName,
				color: palette.normal
			};
			attachment.fields = [
				{title: i18n.__('cloudant.databaseinfo.field.numdocs'), value: result.doc_count, short: true },
				{title: i18n.__('cloudant.databaseinfo.field.numdeldocs'), value: result.doc_del_count, short: true },
				{title: i18n.__('cloudant.databaseinfo.field.disksize'), value: utils.bytesToSize(result.disk_size), short: true },
				{title: i18n.__('cloudant.databaseinfo.field.filesize'), value: utils.bytesToSize(result.sizes.file), short: true },
				{title: i18n.__('cloudant.databaseinfo.field.extsize'), value: utils.bytesToSize(result.sizes.external), short: true },
				{title: i18n.__('cloudant.databaseinfo.field.actsize'), value: utils.bytesToSize(result.sizes.active), short: true },
				{title: i18n.__('cloudant.databaseinfo.field.compact'), value: i18n.__((result.compact_running ? 'cloudant.yes' : 'cloudant.no')), short: true }
			];
			attachments.push(attachment);

			// Emit as attachments
			robot.emit('ibmcloud.formatter', { response: res, attachments: attachments });

			// Emit activity
			activity.emitBotActivity(robot, res, {activity_id: 'activity.cloudant.databaseinfo'});

		}).catch(function(err) {
			handleLogCloudantError(robot, err, `${TAG}: An error has occurred retrieving info for Cloudant database ${databaseName}.`);
			const message = i18n.__('cloudant.databaseinfo.error', databaseName, err);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		});

	};


	/**
	 * Processes the 'cloudant create database [database]' command.
	 * Create a database with the given name via the cloudant API and
	 * sent back result to the requesting user.
	 *
	 * @param {object} res [The hubot response object]
	 * @param {string} databaseName [The name of the database to create]
	 */
	function processCloudantCreateDatabase(res, databaseName){

		// Tell user that the command is being started.
		robot.logger.info(`${TAG}: Creating Cloudant database ${databaseName}.`);
		let message = i18n.__('cloudant.createdatabase', databaseName);
		robot.emit('ibmcloud.formatter', { response: res, message: message });

		// Create the specified Cloudant database.
		cl.cloudant.createDatabase(databaseName).then(function(result) {

			// Emit successful message
			let message = i18n.__('cloudant.createdatabase.success', databaseName);
			robot.emit('ibmcloud.formatter', { response: res, message: message });

			// Emit activity
			activity.emitBotActivity(robot, res, {activity_id: 'activity.cloudant.createdatabase'});

		}).catch(function(err) {
			handleLogCloudantError(robot, err, `${TAG}: An error has occurred creating Cloudant database ${databaseName}.`);
			const message = i18n.__('cloudant.createdatabase.error', databaseName, err);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		});

	};

};
