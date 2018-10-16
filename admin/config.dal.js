const hana = require('../database/hana');

class AdminConfigDAL {

    static getConfigurations(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        let command = `SELECT 
                        COMPONENT,
                        CONFIGURATION,
                        VALUE
                       FROM HANA_OS_MONITOR.MONITOR_CONFIGURATION ORDER BY COMPONENT, CONFIGURATION`;
        hana.select(command, callback);
    }

    static updateConfiguration(currentUserId, component, configuration, value, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!component || !configuration || value == null) {
            callback("component, configuration or value can not be empty!");
            return;
        }

        let command = `UPDATE HANA_OS_MONITOR.MONITOR_CONFIGURATION SET 
                                VALUE = '${value}'
                        WHERE UPPER(COMPONENT) = UPPER('${component}') AND 
                              UPPER(CONFIGURATION) = UPPER('${configuration}') AND 
                              EXISTS (
                                SELECT 1 FROM HANA_OS_MONITOR.EMPLOYEE_INFO 
                                WHERE EMPLOYEE_ID = '${currentUserId}' AND SUPER_ADMIN = 'X'
                	           )`;
        hana.update(command, callback);
    }
}

exports = module.exports = AdminConfigDAL;
