/**
 * HANA Operation Class (encapsulation)
 */

const config = require('../config/default');
const pool   = require('./pool');

exports.select = function (sql, callback) {
    config.logger.debug(sql);
    pool.getConnection()
        .then(function(client) {
            client.exec(sql, (err, rows) => {
                pool.release(client);
                if (err) {
                    config.logger.error(err);
                    callback(err);
                    // console.error(sql, 'Select error:', err);
                } else {
                    config.logger.debug(`select result:${rows? rows.length: 0}`);
                    callback(null, rows);
                }
            });
        })
        .catch(function(err) {
            config.logger.error(err);
            callback(err);
        });
};

exports.insert = function (sql, callback) {
    config.logger.debug(sql);
    pool.getConnection()
        .then(function(client) {
            client.exec(sql, (err, affectedRows) => {
                pool.release(client);
                if (err) {
                    config.logger.error(err);
                    callback(err);
                    // console.error(sql, 'Insert error:', err);
                } else {
                    config.logger.debug(`insert result:${affectedRows}`);
                    callback(null, affectedRows);
                }
            });
        })
        .catch(function(err) {
            config.logger.error(err);
            callback(err);
        });
};

exports.update = function (sql, callback) {
    config.logger.debug(sql);
    pool.getConnection()
        .then(function(client) {
            client.exec(sql, (err, affectedRows) => {
                pool.release(client);
                if (err) {
                    config.logger.error(err);
                    callback(err);
                    // console.error(sql, 'Update error:', err);
                } else {
                    config.logger.debug(`update result:${affectedRows}`);
                    callback(null, affectedRows);
                }
            });
        })
        .catch(function(err) {
            config.logger.error(err);
            callback(err);
        });
};

exports.delete = function (sql, callback) {
    config.logger.debug(sql);
    pool.getConnection()
        .then(function(client) {
            client.exec(sql, (err, affectedRows) => {
                pool.release(client);
                if (err) {
                    config.logger.error(err);
                    callback(err);
                    // console.error(sql, 'Delete error:', err);
                } else {
                    config.logger.debug(`delete result:${affectedRows}`);
                    callback(null, affectedRows);
                }
            });
        })
        .catch(function(err) {
            config.logger.error(err);
            callback(err);
        });
};

exports.bulkUpsert = function (sql, values, callback) {
    config.logger.debug(sql);
    config.logger.silly(values);
    pool.getConnection()
        .then(function(client) {
            client.prepare(sql, (err, statement) => {
                if (err) {
                    config.logger.error(err);
                    callback(err);
                } else {
                    statement.exec(values, (err, affectedRows) => {
                        if (err) {
                            config.logger.error(err);
                            callback(err);
                        } else {
                            config.logger.debug('Array of affected rows:', affectedRows);
                            callback(null, affectedRows);
                        }
                    });
                }

            });
        })
        .catch(function(err) {
            config.logger.error(err);
            callback(err);
        });
};

