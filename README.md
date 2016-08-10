[![Build Status](https://travis-ci.org/ibm-cloud-solutions/hubot-ibmcloud-cloudant.svg?branch=master)](https://travis-ci.org/ibm-cloud-solutions/hubot-ibmcloud-cloudant)
[![Coverage Status](https://coveralls.io/repos/github/ibm-cloud-solutions/hubot-ibmcloud-cloudant/badge.svg?branch=cleanup)](https://coveralls.io/github/ibm-cloud-solutions/hubot-ibmcloud-cloudant?branch=master)
[![Dependency Status](https://dependencyci.com/github/ibm-cloud-solutions/hubot-ibmcloud-cloudant/badge)](https://dependencyci.com/github/ibm-cloud-solutions/hubot-ibmcloud-cloudant)
[![npm](https://img.shields.io/npm/v/hubot-ibmcloud-cloudant.svg?maxAge=2592000)](https://www.npmjs.com/package/hubot-ibmcloud-cloudant)

# hubot-ibmcloud-cloudant

A hubot script for management of your the IBM Bluemix Cloudant instance.

## Getting Started
* [Usage](#usage)
* [Commands](#commands)
* [Hubot Adapter Setup](#hubot-adapter-setup)
* [Development](#development)
* [License](#license)
* [Contribute](#contribute)

## Usage

Steps for adding this to your existing hubot:

1. `cd` into your hubot directory
2. Install the cloudant management functionality with `npm install hubot-ibmcloud-cloudant --save`
3. Add `hubot-ibmcloud-cloudant` to your `external-scripts.json`
4. Add the necessary environment variables:
```
export HUBOT_CLOUDANT_ENDPOINT=<Bluemix Cloudant Endpoint 
          (https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-bluemix.cloudant.com:443)>
export HUBOT_CLOUDANT_KEY=<Bluemix Cloudant User ID>
export HUBOT_CLOUDANT_PASSWORD=<Password for the Bluemix Cloudant user>
```

5. Start up your bot & off to the races!

## Commands <a id="commands"></a>
- `hubot cloudant help` - Show available commands for cloudant management.
- `hubot cloudant list databases` - List databases.
- `hubot cloudant info database [database]` - Show details for a database.
- `hubot cloudant create database [database]` - Create a database.
- `hubot cloudant set permissions [database] [user/apikey]` - Set permissions for a user/apikey for a database.
- `hubot cloudant list views [database]` - List all views for a database.
- `hubot cloudant run view [database] [view]` - Run the view for a database.

## Hubot Adapter Setup

Hubot supports a variety of adapters to connect to popular chat clients.  For more feature rich experiences you can setup the following adapters:
- [Slack setup](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-cloudant/blob/master/docs/adapters/slack.md)
- [Facebook Messenger setup](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-cloudant/blob/master/docs/adapters/facebook.md)

## Development

Please refer to the [CONTRIBUTING.md](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-cloudant/blob/master/CONTRIBUTING.md) before starting any work.  Steps for running this script for development purposes:

### Configuration Setup

1. Create `config` folder in root of this project.
2. Create `env` in the `config` folder, with the following contents:
```
export HUBOT_CLOUDANT_ENDPOINT=<Bluemix Cloudant Endpoint 
          (https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-bluemix.cloudant.com:443)>
export HUBOT_CLOUDANT_KEY=<Bluemix Cloudant User ID>
export HUBOT_CLOUDANT_PASSWORD=<Password for the Bluemix Cloudant user>
```
3. In order to view content in chat clients you will need to add `hubot-ibmcloud-formatter` to your `external-scripts.json` file. Additionally, if you want to use `hubot-help` to make sure your command documentation is correct. Create `external-scripts.json` in the root of this project
```
[
    "hubot-help",
    "hubot-ibmcloud-formatter"
]
```
4. Lastly, run `npm install` to obtain all the dependent node modules.

### Running Hubot with Adapters

Hubot supports a variety of adapters to connect to popular chat clients.

If you just want to use:
 - Terminal: run `npm run start`
 - [Slack: link to setup instructions](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-cloudant/blob/master/docs/adapters/slack.md)
 - [Facebook Messenger: link to setup instructions](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-cloudant/blob/master/docs/adapters/facebook.md)


## License

See [LICENSE.txt](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-cloudant/blob/master/LICENSE.txt) for license information.

## Contribute

Please check out our [Contribution Guidelines](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-cloudant/blob/master/CONTRIBUTING.md) for detailed information on how you can lend a hand.
