const adminConfigDAL = require('./config.dal');

class AdminConfigService {

    static getConfigurations(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        adminConfigDAL.getConfigurations((err, rows) => {
            if (err) {
                callback(err);
            } else {
                callback(null, rows.map(row => ({
                    component: row.COMPONENT,
                    configuration: row.CONFIGURATION,
                    value: row.VALUE
                })));
            }
        });
    }

    static updateConfiguration(currentUserId, component, configuration, value, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        adminConfigDAL.updateConfiguration(currentUserId, component, configuration, value, callback);
    }
}

exports = module.exports = AdminConfigService;