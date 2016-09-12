/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const CloudantObj = require('cloudant');


let env = null;

/**
 * Builds the options used to initialize with Cloudant (account/username/password)
 * based on the environment variables.
 *
 * @return {object} [Object with api object with account/username/password fields]
 */
function buildEnv() {

	let retEnv = {};

	// Build information for Cloudant API (obtain account from endpoint env var)
	// The account is derived by stripping the protocol:// and the :port from the endpoint.
	// Then .cloudant.com is stripped from the end.
	let endpoint = process.env.VCAP_SERVICES_CLOUDANTNOSQLDB_0_CREDENTIALS_HOST || process.env.HUBOT_CLOUDANT_ENDPOINT;
	let account = endpoint;
	if (account) {
		let protocolSepIndex = account.indexOf('://');
		if (protocolSepIndex >= 0) {
			account = account.substring(protocolSepIndex + 3);
		}
		let portSepIndex = account.lastIndexOf(':');
		if (portSepIndex >= 0) {
			account = account.substring(0, portSepIndex);
		}
		account = account.replace('.cloudant.com', '');
	}

	// Let's distinguish between the actual user name (either the one configured in the
	// environment variables are the default one associated with the account) and the
	// user name to use on all Cloudant API calls (if it is the same as the account,
	// then it should not be specified).
	let actualusername = process.env.VCAP_SERVICES_CLOUDANTNOSQLDB_0_CREDENTIALS_USERNAME || process.env.HUBOT_CLOUDANT_KEY || account;
	let username;
	if (actualusername && account && actualusername !== account) username = actualusername;

	// Build information for Cloudant API (obtain password from password env var).
	let password = process.env.VCAP_SERVICES_CLOUDANTNOSQLDB_0_CREDENTIALS_PASSWORD || process.env.HUBOT_CLOUDANT_PASSWORD;

   // cloudantNoSQLDB service bound to application, overrides any other settings.
	if (process.env.VCAP_SERVICES && JSON.parse(process.env.VCAP_SERVICES).cloudantNoSQLDB) {
		let credentials = JSON.parse(process.env.VCAP_SERVICES).cloudantNoSQLDB[0].credentials;
		account = credentials.username;
		username = credentials.username;
		password = credentials.password;
	}


	// Store api credential info
	retEnv.api = {
		account: account,
		username: username,
		password: password
	};

	return retEnv;
}

/**
 * Returns the options used to initialize with Cloudant (account/username/password)
 * based on the environment variables.
 *
 * @return {object} [Object with api object with account/username/password fields]
 */
function getEnv() {
	if (env === null) {
		env = buildEnv();
	}
	return env;
}

/**
 * Initializes and returns Cloudant API using configured account/username/password.
 * Returned Promise's resolve function is invoked with cloudant object.
 *
 * @return {Promise} [Promise object]
 */
function initCloudantApi() {
	return new Promise(function(resolve, reject) {

		// Verify environment variables are properly set.
		// Note that it is ok to not provide the HUBOT_CLOUDANT_KEY environment variable.
		// If the username is not provided, Cloudant assumes the default username associated with
		// the database (that is, the account name without .cloudant.com at the end).
		if (getEnv().api.account) {
			if (getEnv().api.password) {

				// Access cloudant
				CloudantObj(getEnv().api, function(err, cloudant) {
					if (err) {
						reject(err);
					}
					else {
						resolve(cloudant);
					}
				});

			}
			else {
				reject(new Error('The HUBOT_CLOUDANT_PASSWORD is not set; Cloudant operations cannot be performed.'));
			}
		}
		else {
			reject(new Error('The HUBOT_CLOUDANT_ENDPOINT is not set; Cloudant operations cannot be performed.'));
		}
	});

}

/**
 * This public class manages the operations related with Cloudant in Bluemix
 */
class Cloudant {

	/**
	 * The constructor
	 */
	constructor() {
	}

	/**
	 * Gets all of the Cloudant databases.
	 * Returned Promise's resolve function is invoked with array of database names.
	 *
	 * @return {Promise} [Promise object]
	 */
	getDatabases() {
		return new Promise(function(resolve, reject) {
			initCloudantApi().then(function(cloudant) {
				cloudant.db.list(function(err, body) {
					if (err) {
						reject(err);
					}
					else {
						resolve(body);
					}
				});
			}).catch(function(err) {
				reject(err);
			});
		});
	}

	/**
	 * Gets the detail information for the Cloudant database with the given name.
	 * Returned Promise's resolve function is invoked with JSON retrieved from Cloudant
	 * containing detailed information about the given database.
	 *
	 * @param  {string} databaseName [The name of the database to retrieve info for]
	 * @return {Promise} [Promise object]
	 */
	getDatabaseInfo(databaseName) {
		return new Promise(function(resolve, reject) {
			initCloudantApi().then(function(cloudant) {
				cloudant.db.get(databaseName, function(err, body) {
					if (err) {
						reject(err);
					}
					else {
						resolve(body);
					}
				});
			}).catch(function(err) {
				reject(err);
			});
		});
	}

	/**
	 * Creates a Cloudant database with the given name.
	 * Returned Promise's resolve function is invoked with JSON retrieved from Cloudant
	 * containing result of creating database (ok).
	 *
	 * @param  {string} databaseName [The name of the database to create]
	 * @return {Promise} [Promise object]
	 */
	createDatabase(databaseName) {
		return new Promise(function(resolve, reject) {
			initCloudantApi().then(function(cloudant) {
				cloudant.db.create(databaseName, function(err, body) {
					if (err) {
						reject(err);
					}
					else {
						resolve(body);
					}
				});
			}).catch(function(err) {
				reject(err);
			});
		});
	}

	/**
	 * Obtains the permissions for the user with the given name to the database with
	 * the given name.
	 * Returned Promise's resolve function is invoked with JSON retrieved from Cloudant
	 * containing an array of currently set permissions for the given user (or an empty array).
	 *
	 * @param  {string} databaseName [The name of the database to obtain permissions from]
	 * @param  {string} userName [The name of the user to obtain permissions for]
	 * @return {Promise} [Promise object]
	 */
	getDatabasePermissions(databaseName, userName) {
		return new Promise(function(resolve, reject) {
			initCloudantApi().then(function(cloudant) {
				cloudant.db.use(databaseName).get_security(function(err, body) {
					if (err) {
						reject(err);
					}
					else {
						let permissions = body.cloudant[userName] || [];
						resolve(permissions);
					}
				});
			}).catch(function(err) {
				reject(err);
			});
		});
	}

	/**
	 * Grants the given user the given set of permissions to the database with the given name.
	 * Returned Promise's resolve function is invoked with JSON retrieved from Cloudant
	 * containing result of setting permissions (ok).
	 *
	 * @param  {string} databaseName [The name of the database to set permissions on]
	 * @param  {string} userName [The name of the user to grant permissions to]
	 * @param  {array} permissions [The array of permissions to grant]
	 * @return {Promise} [Promise object]
	 */
	setDatabasePermissions(databaseName, userName, permissions) {
		return new Promise(function(resolve, reject) {
			initCloudantApi().then(function(cloudant) {
				cloudant.db.use(databaseName).get_security(function(err, inPermissions) {
					if (err) {
						reject(err);
					}
					else {
						let permissionsObj = inPermissions.cloudant;
						permissionsObj[userName] = permissions;
						cloudant.db.use(databaseName).set_security(permissionsObj, function(err, body) {
							if (err) {
								reject(err);
							}
							else {
								resolve(body);
							}
						});
					}
				});
			}).catch(function(err) {
				reject(err);
			});
		});
	}

	/**
	 * Gets all of the views for the given Cloudant database.
	 * Returned Promise's resolve function is invoked with an array of object.  Each object
	 * contains two fields:
	 *  - design: The name of the design doc containing the view.
	 *  - view: The name of the view.
	 *
	 * @param  {string} databaseName [The name of the database to retrieve views for]
	 * @return {Promise} [Promise object]
	 */
	getDatabaseViews(databaseName) {
		return new Promise(function(resolve, reject) {
			initCloudantApi().then(function(cloudant) {
				cloudant.db.use(databaseName).list({startkey: '_design', endkey: '_design0', include_docs: true}, function(err, body) {
					if (err) {
						reject(err);
					}
					else {
						let retViews = [];
						if (body && body.rows && body.rows.length > 0) {
							for (let i = 0; i < body.rows.length; i++) {
								let row = body.rows[i];
								if (row.doc && row.doc.views) {
									let key = (row.key ? row.key : row.id);
									let designName = key.replace('_design/', '');
									Object.keys(row.doc.views).forEach(function(viewName) {
										retViews.push({ design: designName, view: viewName });
									});
								}
							}
						}
						resolve(retViews);
					}
				});
			}).catch(function(err) {
				reject(err);
			});
		});
	}

	/**
	 * Runs the view specified by the database name, design doc name, and view name.
	 * Returned Promise's resolve function is invoked with an array of the resulting view
	 * output row.  Each row is a JSON object retrieved from Cloudant.
	 *
	 * @param  {string} databaseName [The name of the database containing the view]
	 * @param  {string} designName [The name of the design document containing the view]
	 * @param  {string} viewName [The name of the view to run]
	 * @param  {array of strings} keys [An optional array of keys to pass to the view]
	 * @return {Promise} [Promise object]
	 */
	runDatabaseView(databaseName, designName, viewName, keys) {
		return new Promise(function(resolve, reject) {
			initCloudantApi().then(function(cloudant) {
				let keysParam = { limit: 20 };
				if (keys && keys.length > 0) {
					keysParam.keys = keys;
				}
				cloudant.db.use(databaseName).view(designName, viewName, keysParam, function(err, body) {
					if (err) {
						reject(err);
					}
					else {
						resolve(body.rows);
					}
				});
			}).catch(function(err) {
				reject(err);
			});
		});
	}

	clearEnv() {
		env = null;
	}

}

const cloudant = new Cloudant();

module.exports.cloudant = cloudant;
