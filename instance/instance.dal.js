/**
 * server relative DB operations
 */
const hana = require('../database/hana');

/**
 * Get information for all the instances
 */
exports.getInstances = function(userId, callback) {
    if (!callback) {
        console.error('No call back function provided!');
        return;
    }

    let command = ` SELECT
                         SERVER_NAME,
                         SID,
                         EMPLOYEE_NAME,
                         REVISION,
                         RELEASE_SP,
                         MEM_USAGE_GB,
                         MEM_USAGE_RANK,
                         DISK_USAGE_GB,
                         DISK_USAGE_RANK,
                         CPU_USAGE_PCT,
                         CPU_USAGE_RANK,
                         OS,
                         CHECK_TIME
                    FROM HANA_OS_MONITOR.M_SID_DETAIL_INFO 
                    WHERE LOCATION_ID IN (
					              SELECT LOCATION_ID FROM HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO WHERE EMPLOYEE_ID = '${userId}') 
                    ORDER BY LOCATION_ID desc, SERVER_NAME, SID`;
    hana.select(command, function(err, instances) {
        if (err) {
            callback(err);
        } else {
            callback(null, instances);
        }
    });
};
