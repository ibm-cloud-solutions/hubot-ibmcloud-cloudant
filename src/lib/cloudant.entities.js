/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const cl = require('./cloudant');
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;

const NAMESPACE = 'IBMcloudCloudant';
const PARAM_DATABASENAME = 'databasename';
const PARAM_VIEWNAME = 'viewname';

let functionsRegistered = false;


function buildGlobalName(parameterName) {
	return NAMESPACE + '_' + parameterName;
}
function buildGlobalFuncName(parameterName) {
	return NAMESPACE + '_func' + parameterName;
}

function registerEntityFunctions() {
	if (!functionsRegistered) {
		nlcconfig.setGlobalEntityFunction(buildGlobalFuncName(PARAM_DATABASENAME), getDatabaseNames);
		nlcconfig.setGlobalEntityFunction(buildGlobalFuncName(PARAM_VIEWNAME), getViewNames);
		functionsRegistered = true;
	}
}

function getDatabaseNames(robot, res, parameterName, parameters) {
	return new Promise(function(resolve, reject) {
		cl.cloudant.getDatabases().then(function(result) {
			nlcconfig.updateGlobalParameterValues(buildGlobalName(PARAM_DATABASENAME), result);
			resolve(result);
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getViewNames(robot, res, parameterName, parameters) {
	return new Promise(function(resolve, reject) {
		if (parameters[PARAM_DATABASENAME]) {
			cl.cloudant.getDatabaseViews(parameters[PARAM_DATABASENAME]).then(function(result) {
				const viewNameList = result.map(function(viewObj) {
					return viewObj.design + ':' + viewObj.view;
				});
				resolve(viewNameList);
			}).catch(function(err) {
				reject(err);
			});
		}
		else {
			reject(new Error('Unable to get view names for a database because the database name has not been set'));
		}
	});
}

module.exports.registerEntityFunctions = registerEntityFunctions;
module.exports.getDatabaseNames = getDatabaseNames;
module.exports.getViewNames = getViewNames;
