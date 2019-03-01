'use strict';

const config      = require('../config/default');
const Pool = require('hdb-pool');

const opts = {
    min: 2,
    max: 25,
    maxWaitingRequests: 25,
    checkInterval: 50000,
    idleTimeout: 30000,
    requestTimeout: 2000,
    debug: false
};

const pool = Pool.createPool(config.HANA_SERVER, opts);


exports = module.exports = pool;
