/**
 * server relative DB operations
 */
const hana = require('../database/hana');

class ConfigDAL {
    /**
     * get configuration from db via configuration name
     * @param name the configuration name
     * @param callback
     */
    static  getConfiguration (name, callback) {
        let command = `SELECT VALUE FROM HANA_OS_MONITOR.MONITOR_CONFIGURATION WHERE CONFIGURATION = '${name}'`;
        hana.select(command, function(err, rows_server) {
            if (err) {
                callback(err);
            } else {
                if (rows_server && rows_server.length === 1) {
                    callback(null, rows_server);
                } else {
                    callback(`Configuration ${name} doesn't exist or has duplicate values in DB.`)
                }
            }
        });
    }
}

exports = module.exports = ConfigDAL;


