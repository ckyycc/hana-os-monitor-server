const hana = require('../database/hana');
const async = require('async');

function __getLocations(callback) {
    let command = 'select LOCATION_ID, LOCATION from HANA_OS_MONITOR.LOCATION_INFO';
    hana.select(command, callback);
}

/**
 * dynamic generate SQL for different locations
 * EG:
 * select	 employee_id,	 IFNULL(B1.location, '') || ',' || IFNULL(B2.location, '') || ',' || IFNULL(B3.location, '') || ',' || IFNULL(B4.location,'') location
 * from ( select employee_id, sum(location1) location1, sum(location2) location2, sum(location3) location3, sum(location4) location4
 * from ( select employee_id, location_id location1, 0 location2, 0 location3, 0 location4 from "HANA_OS_MONITOR"."EMPLOYEE_LOCATION_INFO" where location_id = 1
 * union all
 * select employee_id, 0 location1, location_id location2, 0 location3, 0 location4 from "HANA_OS_MONITOR"."EMPLOYEE_LOCATION_INFO" where location_id = 2
 * union all
 * select employee_id, 0 location1, 0 location2, location_id location3, 0 location4 from "HANA_OS_MONITOR"."EMPLOYEE_LOCATION_INFO" where location_id = 3
 * union all
 * select employee_id, 0 location1, 0 location2, 0 location3, location_id location4 from "HANA_OS_MONITOR"."EMPLOYEE_LOCATION_INFO" where location_id = 4 )
 * group by employee_id) A
 * left join "HANA_OS_MONITOR"."LOCATION_INFO" B1 on A.location1 = B1.location_id
 * left join "HANA_OS_MONITOR"."LOCATION_INFO" B2 on A.location2 = B2.location_id
 * left join "HANA_OS_MONITOR"."LOCATION_INFO" B3 on A.location3 = B3.location_id
 * left join "HANA_OS_MONITOR"."LOCATION_INFO" B4 on A.location4 = B4.location_id;
 * @param locations locations info
 * @param callback
 * @private
 */
function __generateEmployeeLocationSQL(locations, callback){
    if (locations && locations.length > 0) {
        //Using different loop generates different part, for better understanding, do not consolidate them
        let sql = 'SELECT EMPLOYEE_ID, ';
        for (let i = 0; i < locations.length; i++) {
            if (i === locations.length - 1) {
                sql += ` IFNULL(B${i}.LOCATION, '') LOCATIONS`;
            } else {
                sql += ` IFNULL(B${i}.LOCATION, '') || ',' || `;
            }
        }
        sql = sql + " FROM ( SELECT EMPLOYEE_ID, ";
        for (let i = 0; i < locations.length; i++) {
            if (i === locations.length - 1) {
                sql += ` SUM(LOCATION${i}) LOCATION${i} FROM (`;
            } else {
                sql += ` SUM(LOCATION${i}) LOCATION${i}, `;
            }
        }

        for (let i = 0; i < locations.length; i++) {

            let subSQL = "SELECT EMPLOYEE_ID, ";

            for (let j = 0; j < locations.length; j++) {
                let locationId = j === i? "LOCATION_ID" : "0";
                if (j === locations.length -1) {
                    subSQL += `${locationId} LOCATION${j} FROM HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO `;
                } else {
                    subSQL += `${locationId} LOCATION${j}, `;
                }
            }

            subSQL += `WHERE LOCATION_ID = ${locations[i].LOCATION_ID}`;

            if (i === locations.length - 1) {
                sql += subSQL + ") GROUP BY EMPLOYEE_ID) A ";
            } else {
                sql += subSQL + " UNION ALL ";
            }
        }
        for (let i = 0; i < locations.length; i++) {
            sql += ` LEFT JOIN HANA_OS_MONITOR.LOCATION_INFO B${i} ON A.LOCATION${i} = B${i}.LOCATION_ID `;
        }
        callback(null, sql);
    } else {
        callback('No location info found!');
    }
}

function __getSidMappings(sql, callback) {
    let command = `select A.SID_START, A.SID_END, C.EMPLOYEE_ID, C.EMPLOYEE_NAME, B.LOCATIONS
                   from HANA_OS_MONITOR.SID_MAPPING_CFG A
                   left join (${sql}) B ON A.EMPLOYEE_ID = B.EMPLOYEE_ID 
                   right join HANA_OS_MONITOR.EMPLOYEE_INFO C on A.EMPLOYEE_ID = C.EMPLOYEE_ID`;
    hana.select(command, callback);
}

class SIDDAL {

    static getSidsInfo(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        let command = `select A.SID, B.SERVER_ID,B.SERVER_NAME,C.EMPLOYEE_ID, C.EMPLOYEE_NAME, A.FILTER_FLAG, A.COMMENT 
                       from HANA_OS_MONITOR.SID_INFO A
                       right join HANA_OS_MONITOR.SERVER_INFO B on A.SERVER_ID = B.SERVER_ID
                       full join HANA_OS_MONITOR.EMPLOYEE_INFO C on A.EMPLOYEE_ID = C.EMPLOYEE_ID`;
        hana.select(command, callback);
    }


    static getSidMappings(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        async.waterfall([
            __getLocations,
            __generateEmployeeLocationSQL,
            __getSidMappings
        ], function(err, mappings) {
            if (err) {
                callback(err);
            } else {
                callback(null, mappings);
            }
        });
    }

    static insertSidMapping(sidStart, sidEnd, employeeId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!sidStart || !sidEnd || !employeeId) {
            callback("sidStart, sidEnd or employee id can not be empty!");
            return;
        }
        let command = `INSERT INTO HANA_OS_MONITOR.SID_MAPPING_CFG (SID_START, SID_END, EMPLOYEE_ID)
                       VALUES ('${sidStart}', '${sidEnd}', '${employeeId}')`;
        hana.insert(command, callback);
    }

    static updateSidMapping(sidStart, sidEnd, oldSidStart, oldSidEnd, employeeId, oldEmployeeId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!sidStart || !sidEnd || !oldSidEnd || !oldSidStart || !employeeId) {
            callback("sidStart, oldSidStart, sidEnd, oldSidEnd or employee id can not be empty!");
            return;
        }
        let command = `UPDATE HANA_OS_MONITOR.SID_MAPPING_CFG SET SID_START='${sidStart}', 
                       SID_END='${sidEnd}', EMPLOYEE_ID='${employeeId}' 
                       WHERE SID_START='${oldSidStart}' AND SID_END='${oldSidEnd}' AND EMPLOYEE_ID='${oldEmployeeId}'`;
        hana.insert(command, callback);
    }

    static deleteSidMapping(sidStart, sidEnd, employeeId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!sidStart || !sidEnd || !employeeId) {
            callback("sidStart, sidEnd or employee id can not be empty!");
            return;
        }
        let command = `DELETE FROM HANA_OS_MONITOR.SID_MAPPING_CFG WHERE
                       EMPLOYEE_ID = '${employeeId}' AND SID_START = '${sidStart}' AND SID_END = '${sidEnd}'`;
        hana.insert(command, callback);
    }

    static updateSid(oldServerId, serverId, sid, employeeId, flag, comment, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!serverId || !sid) {
            callback("serverId or sid can not be empty!");
            return;
        }
        let command = '';
        if (comment == null) {
            command = `UPDATE HANA_OS_MONITOR.SID_INFO SET FILTER_FLAG='${flag}', COMMENT=${comment}, 
                       SERVER_ID=${serverId}, EMPLOYEE_ID='${employeeId}' 
                       WHERE SERVER_ID=${oldServerId} AND SID='${sid}'`;
        } else {
            command = `UPDATE HANA_OS_MONITOR.SID_INFO SET FILTER_FLAG='${flag}', COMMENT='${comment}', 
                       SERVER_ID=${serverId}, EMPLOYEE_ID='${employeeId}'  
                       WHERE SERVER_ID=${oldServerId} AND SID='${sid}'`;
        }

        hana.update(command, callback);
    }


    static insertSid(serverId, sid, employeeId, flag, comment, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!serverId || !sid) {
            callback("serverId or sid can not be empty!");
            return;
        }
        let sidUser = `${sid.toLowerCase()}adm`;
        let command = '';
        if (comment == null) {
            command = `INSERT INTO HANA_OS_MONITOR.SID_INFO ("SERVER_ID","SID","SID_USER",
                       "EMPLOYEE_ID","FILTER_FLAG","COMMENT") VALUES (${serverId}, '${sid}', '${sidUser}',
                       '${employeeId}', '${flag}', ${comment})`;
        } else {
            command = `INSERT INTO HANA_OS_MONITOR.SID_INFO ("SERVER_ID","SID","SID_USER",
                       "EMPLOYEE_ID","FILTER_FLAG","COMMENT") VALUES (${serverId}, '${sid}', '${sidUser}',
                       '${employeeId}', '${flag}', '${comment}')`;
        }

        hana.insert(command, callback);
    }

    static deleteSid(serverId, sid, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }

        if (!serverId || !sid) {
            callback("serverId or sid can not be empty!");
            return;
        }

        let command = `DELETE FROM HANA_OS_MONITOR.SID_INFO WHERE SERVER_ID=${serverId} AND SID='${sid}'`;

        hana.delete(command, callback);
    }

    static generateSids(sidList, callback) {

        let command = `UPSERT HANA_OS_MONITOR.SID_INFO (SERVER_ID, SID, SID_USER, EMPLOYEE_ID)
                       SELECT SERVER_ID, ?, ?, ? FROM (
                         SELECT SERVER_ID FROM "HANA_OS_MONITOR"."SERVER_INFO" A
                         INNER JOIN "HANA_OS_MONITOR"."LOCATION_INFO" B  ON A.LOCATION_ID = B.LOCATION_ID
                         WHERE A.LOCATION_ID IN (
                          SELECT LOCATION_ID FROM "HANA_OS_MONITOR"."EMPLOYEE_LOCATION_INFO" 
                          WHERE EMPLOYEE_ID = ?))`;
        let values = sidList.map(sid=>[sid.SID, sid.SID_USER, sid.EMPLOYEE_ID, sid.EMPLOYEE_ID]);
        hana.bulkUpsert(command, values, callback);
    }
}

exports = module.exports = SIDDAL;

