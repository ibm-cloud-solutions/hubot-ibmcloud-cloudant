// Description:
//	Listens for commands to initiate help actions against Bluemix Cloudant instance.
//
// Configuration:
//	 HUBOT_CLOUDANT_ACCOUNT Bluemix Cloudant account
//	 HUBOT_CLOUDANT_USERNAME Bluemix Cloudant username
//	 HUBOT_CLOUDANT_PASSWORD Bluemix Cloudant password
//
// Commands:
//   hubot cloudant help - Show available commands in the cloudant category.
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

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
var i18n = new (require('i18n-2'))({
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

// cloudant help
const CLOUDANT_HELP_ID = 'bluemix.cloudant.help';
const CLOUDANT_HELP = /cloudant+\s+help/i;

module.exports = (robot) => {

	// Natural Language match: cloudant help
	robot.on(CLOUDANT_HELP_ID, (res, parameters) => {
		robot.logger.debug(`${TAG}: ${CLOUDANT_HELP_ID} Natural Language match. res.message.text=${res.message.text}.`);
		processCloudantHelp(res);
	});


	// RegEx match: cloudant help
	robot.respond(CLOUDANT_HELP, {id: CLOUDANT_HELP_ID}, (res) => {
		robot.logger.debug(`${TAG}: ${CLOUDANT_HELP_ID} RegEx match. res.message.text=${res.message.text}.`);
		processCloudantHelp(res);
	});


	/**
	 * Processes the 'cloudant help' command.
	 * The help content is generated and sent back to the requesting user.
	 *
	 * @param {object} res The hubot response object.
	 */
	function processCloudantHelp(res) {
		let help = `${robot.name} cloudant list|show databases - ` + i18n.__('help.cloudant.listdatabases') + '\n';
		help += `${robot.name} cloudant info|details database [database] - ` + i18n.__('help.cloudant.infodatabase') + '\n';
		help += `${robot.name} cloudant create database [database] - ` + i18n.__('help.cloudant.createdatabase') + '\n';
		help += `${robot.name} cloudant set permissions (|to|on) [database] (|for) [user/apikey] - ` + i18n.__('help.cloudant.setpermissions') + '\n';
		help += `${robot.name} cloudant list|show views [database] - ` + i18n.__('help.cloudant.listviews') + '\n';
		help += `${robot.name} cloudant run|execute view [database] [view] - ` + i18n.__('help.cloudant.runview') + '\n';

		let message = '\n' + help;
		robot.emit('ibmcloud.formatter', { response: res, message: message});
	};
};
