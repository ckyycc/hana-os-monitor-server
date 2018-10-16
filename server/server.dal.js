/**
 * server relative DB operations
 */
const hana = require('../database/hana');
const async = require('async');

/**
 * Get the Top 5 CPU consumers by server id
 * @private
 */
function __getCPUConsumers(serverId, callback) {
    if (!callback) {
        console.error('No call back function provided!');
        return;
    }

    let command = `select SERVER_ID,
                        USER_NAME,
                        UPPER(left(USER_NAME,3)) SID ,
                        EMPLOYEE_NAME,
                        USAGE,
                        TO_TIMESTAMP(CHECK_ID, 'YYYYMMDDHH24MISSFF6') CHECK_TIME
                       from HANA_OS_MONITOR.M_TOP5_CPU_CONSUMERS where SERVER_ID = ${serverId}`;
    hana.select(command, (err, rows) => {
        callback(err, rows);
    });
}

/**
 * Get the Top 5 Memory consumers by server id
 * @private
 */
function __getMemConsumers(serverId, callback) {
    if (!callback) {
        console.error('No call back function provided!');
        return;
    }
    let command = `select SERVER_ID,
                        USER_NAME,
                        UPPER(left(USER_NAME,3)) SID ,
                        EMPLOYEE_NAME,
                        USAGE_GB USAGE,
                        TO_TIMESTAMP(CHECK_ID, 'YYYYMMDDHH24MISSFF6') CHECK_TIME
                       from HANA_OS_MONITOR.M_TOP5_MEM_CONSUMERS where SERVER_ID = ${serverId}`;
    hana.select(command, (err, rows) => {
        callback(err, rows);
    });
}

/**
 * Get the Top 5 Disk consumers by server id
 * @private
 */
function __getDiskConsumers(serverId, callback) {
    if (!callback) {
        console.error('No call back function provided!');
        return;
    }
    let command = `select SERVER_ID,
                        USER_NAME,
                        FOLDER ,
                        EMPLOYEE_NAME,
                        USAGE,
                        TO_TIMESTAMP(CHECK_ID, 'YYYYMMDDHH24MISSFF6') CHECK_TIME
                       from HANA_OS_MONITOR.M_TOP5_DISK_CONSUMERS where SERVER_ID = ${serverId}`;
    hana.select(command, (err, rows) => {
        callback(err, rows);
    });
}

/**
 * Get the Top 5 consumers for all resources by server id
 * @private
 */
function __getAllConsumers(serverId, callback) {
    if (!callback) {
        console.error('No call back function provided!');
        return;
    }
    async.parallel([
        async.apply(__getCPUConsumers, serverId),
        async.apply(__getMemConsumers, serverId),
        async.apply(__getDiskConsumers, serverId),
    ], function(err, consumers) {
        if (err) {
            callback(err);
        } else {
            if (!consumers || consumers.length !== 3) {
                callback(`Internal error happened when getting all consumers info for server (${serverId}).`)
            }
            callback(null, {CPU: consumers[0], MEM: consumers[1], DISK: consumers[2]});
        }
    });
}

/**
 * Get current server information by server id.
 * @private
 */
function __getCurrentServersInfo(serverId, callback) {
    let command = `SELECT
                         LOCATION_ID,
                         LOCATION,
                         SERVER_ID,
                         SERVER_NAME,
                         ROUND(DISK_TOTAL/1024/1024, 2) DISK_TOTAL,
                         ROUND((DISK_TOTAL-DISK_FREE)/DISK_TOTAL*100, 2) DISK_USAGE,
                         ROUND(MEM_TOTAL/1024/1024, 2) MEM_TOTAL,
                         ROUND((MEM_TOTAL-MEM_FREE)/MEM_TOTAL*100,2) MEM_USAGE,
                         100 CPU_TOTAL,
                         CPU_UTILIZATION CPU_USAGE,
                         TO_TIMESTAMP(CHECK_ID,
                         'YYYYMMDDHH24MISSFF6') CHECK_TIME 
                    FROM HANA_OS_MONITOR.M_CURRENT_SERVERS_INFO 
                    where SERVER_ID = ${serverId}
                    ORDER BY LOCATION_ID, SERVER_NAME`;
    hana.select(command, function(err, rows_server) {
        if (err) {
            callback(err);
        } else {
            callback(null, rows_server);
        }
    });
}

/**
 * Get server together with resource information by server id
 */
exports.getServer = function(serverId, callback) {
    if (!callback) {
        console.error('No call back function provided!');
        return;
    }
    if (!serverId) {
        callback("serverId can not be empty!");
        return;
    }
    async.parallel([
        async.apply(__getCurrentServersInfo, serverId),
        async.apply(__getAllConsumers, serverId),
    ], function(err, info) {
        if (err) {
            callback(err);
        } else {
            if (!info || info.length !== 2) {
                callback(`Internal error happened when getting info of server (${serverId}).`)
            }
            callback(null, {server: info[0], consumers: info[1]});
        }
    });
};

/**
 * Get resource consuming histories by server id.
 */
exports.getServerHistories = function(serverId, callback) {
    if (!callback) {
        console.error('No call back function provided!');
        return;
    }
    if (!serverId) {
        callback("serverId can not be empty!");
        return;
    }
    let command = `
            SELECT "SERVER_ID", 
                   "SERVER_FULL_NAME", 
                   "DISK_USAGE", 
                   "MEM_USAGE", 
                   "CPU_USAGE", 
                   TO_TIMESTAMP(CHECK_ID, 'YYYYMMDDHH24MISSFF6') CHECK_TIME 
            FROM "HANA_OS_MONITOR"."M_RESOURCE_HISTORY"
            WHERE "SERVER_ID" = ${serverId} AND 
                  ("DISK_USAGE" IS NOT NULL OR "MEM_USAGE" IS NOT NULL OR "CPU_USAGE" IS NOT NULL)`;
    // console.log(command);
    hana.select(command, function(err, rows) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                id: Number(serverId),
                histories: rows.map(row => ({
                    diskUsage: Number.parseFloat(row.DISK_USAGE).toFixed(2),
                    memUsage: Number.parseFloat(row.MEM_USAGE).toFixed(2),
                    cpuUsage: Number.parseFloat(row.CPU_USAGE).toFixed(2),
                    checkTime: row.CHECK_TIME
                }))
            });
        }
    });

};


/**
 * Get current information for all the servers
 */
exports.getServers = function(userId, callback) {
    if (!callback) {
        console.error('No call back function provided!');
        return;
    }

    let command = ` SELECT
                         LOCATION_ID,
                         LOCATION,
                         SERVER_ID,
                         SERVER_NAME,
                         ROUND(DISK_TOTAL/1024/1024, 2) DISK_TOTAL,
                         ROUND((DISK_TOTAL-DISK_FREE)/DISK_TOTAL*100, 2) DISK_USAGE,
                         ROUND(MEM_TOTAL/1024/1024, 2) MEM_TOTAL,
                         ROUND((MEM_TOTAL-MEM_FREE)/MEM_TOTAL*100,2) MEM_USAGE,
                         100 CPU_TOTAL,
                         CPU_UTILIZATION CPU_USAGE,
                         TO_TIMESTAMP(CHECK_ID,
                         'YYYYMMDDHH24MISSFF6') CHECK_TIME 
                    FROM HANA_OS_MONITOR.M_CURRENT_SERVERS_INFO 
                    WHERE LOCATION_ID IN (
					    SELECT LOCATION_ID FROM HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO WHERE EMPLOYEE_ID = '${userId}'
					) 
                    ORDER BY LOCATION_ID, SERVER_NAME`;
    hana.select(command, function(err, servers) {
        if (err) {
            callback(err);
        } else {
            callback(null, servers);
        }
    });
};
