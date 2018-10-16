'use strict';

const genericPool = require('generic-pool');
const hdb         = require('hdb');
const config      = require('../config/default');

/**
 * Create pool using a factory object
 */
const factory = {
    create: function() {
        let client = hdb.createClient(config.HANA_SERVER);
        client.hadError = false;
        client.once('error', err => {
            config.logger.error(`Client error:${err}`);
            client.hadError = true;
        });
        client.connect(err => {
            if (err) {
                config.logger.error(`Connection error:${err}`);
            }
        });
        return client;
    },
    destroy: function(client) {
        // client.disconnect();
        if (!client.hadError && client.readyState !== 'closed') {
            let clientId = client.clientId;
            client.end();
            config.logger.debug(`${clientId} is closed.`);
        }
    },
};

const opts = {
    max: 20, // maximum size of the pool
    min: 2, // minimum size of the pool
    numTestsPerEvictionRun: 20,
    evictionRunIntervalMillis: 60000,
    idleTimeoutMillis: 30000
};

const pool = genericPool.createPool(factory, opts);


exports = module.exports = pool;