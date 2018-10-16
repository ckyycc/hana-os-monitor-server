const sidDAL = require('./sid.dal');
const config = require('../config/default');

function __generateSidList(sidStart, sidEnd) {
    let startPart1 = sidStart.part1;
    let startPart2 = sidStart.part2;
    let startType = sidStart.type;
    let endPart2 = sidEnd.part2;
    let endType = sidEnd.type;

    let sidList = [];

    if ((startType === 0 && endType === 0) || (startType === 1 && endType === 1)) {
        //type 0: C01~C88 or type 1: CK1 ~ CK9
        for (let i = startPart2; i <= endPart2; i++) {
            let len = startPart1.length;
            sidList.push((len > 1 && i < 10) || (len === 1 && i >= 10) ? `${startPart1}${i}` : `${startPart1}0${i}`);
        }
    } else if (startType === 2 && endType === 2) {
        //CKA ~ CKZ or C0A ~ C0Y
        for (let i = startPart2.charCodeAt(0); i <= endPart2.charCodeAt(0); i++) {
            sidList.push(`${startPart1}${String.fromCharCode(i)}`);
        }
    }
    return sidList;
}

function __getSidPart1Part2(sid) {
    //Get the part1 and part 2 of the given SID
    if (sid != null && sid.length === 3) {
        sid = sid.toUpperCase();
        //1 char + 2 number
        let re=/[A-Z][0-9][0-9]/;
        if (sid.match(re)) {
            return {type: 0, part1: sid.substr(0,1), part2:Number(sid.substr(1,2))};
        }
        //2 chars + 1 number
        re=/[A-Z][A-Z][0-9]/;
        if (sid.match(re)) {
            return {type: 1, part1: sid.substr(0,2), part2:Number(sid.substr(2,1))};
        }
        //(1 char + 1 number/char) + 1 char
        re=/[A-Z][A-Z0-9][A-Z]/;

        if (sid.match(re)) {
            return {type: 2, part1: sid.substr(0,2), part2:sid.substr(2,1)};
        }
    }
    return null
}

function __validateSidString(start, end) {
    // SID mapping only supports following patterns:
    // [A-Z][A-Z][A-Z] ~ [A-Z][A-Z][A-Z]:first two chars should be identical, eg: CKA ~ CKW
    // [A-Z][0-9][A-Z] ~ [A-Z][0-9][A-Z]:first two chars should be identical, eg: C3A ~ C3W
    // [A-Z][A-Z][0-9] ~ [A-Z][A-Z][0-9]:first two chars should be identical, eg: CK2 ~ CK8
    // [A-Z][0-9][0-9] ~ [A-Z][0-9][0-9]:first char should be identical, eg: C02 ~ C68
    if (!start || !end) {
        return false;
    }
    let sidStartPart1 = start.part1;
    let sidStartPart2 = start.part2;
    let sidStartType = start.type;
    let sidEndPart1 = end.part1;
    let sidEndPart2 = end.part2;
    let sidEndType = end.type;
    if ((sidStartType === 0 && sidEndType === 0) || (sidStartType === 1 && sidEndType === 1)) {
        //type 0: C01~C88 or type 1: CK1 ~ CK9
        return !(sidStartPart1 !== sidEndPart1 || sidStartPart2 > sidEndPart2);
    }

    if (sidStartType === 2 && sidEndType === 2) {
        //CKA ~ CKZ or C0A ~ C0Y
        //type 0: C01~C88 or type 1: CK1 ~ CK9
        return !(sidStartPart1 !== sidEndPart1 || sidStartPart2 > sidEndPart2);
    }

    return false;
}
class SidService {
    static getSidsInfo(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        sidDAL.getSidsInfo((err, rows) => {
            if (err) {
                callback(err);
            } else {
                callback(null, rows.map(row => ({
                    sid: row.SID,
                    serverId: row.SERVER_ID,
                    serverName: row.SERVER_NAME,
                    employeeId: row.EMPLOYEE_ID,
                    employeeName: row.EMPLOYEE_NAME,
                    importantFlag: row.FILTER_FLAG || ' ',
                    comment: row.COMMENT
                })));
            }
        });
    }

    static getSidMappings(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        sidDAL.getSidMappings((err, rows) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null, rows.map(row => ({
                        sidStart: row.SID_START,
                        sidEnd: row.SID_END,
                        employeeId: row.EMPLOYEE_ID,
                        employeeName: row.EMPLOYEE_NAME,
                        locations: row.LOCATIONS
                    })));
                }
            }
        );
    }

    static insertSidMapping(sidStart, sidEnd, employeeId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        sidDAL.insertSidMapping(sidStart, sidEnd, employeeId, callback);
    }

    static updateSidMapping(sidStart, sidEnd, oldSidStart, oldSidEnd, employeeId, oldEmployeeId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        sidDAL.updateSidMapping(sidStart, sidEnd, oldSidStart, oldSidEnd, employeeId, oldEmployeeId, callback);
    }

    static deleteSidMapping(sidStart, sidEnd, employeeId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        sidDAL.deleteSidMapping(sidStart, sidEnd, employeeId, callback);
    }

    static updateSid(oldServerId, serverId, sid, employeeId, flag, comment, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        sidDAL.updateSid(oldServerId, serverId, sid, employeeId, flag, comment, callback);
    }

    static insertSid(serverId, sid, employeeId, flag, comment, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        sidDAL.insertSid(serverId, sid, employeeId, flag, comment, callback);
    }

    static deleteSid(serverId, sid, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        sidDAL.deleteSid(serverId, sid, callback);
    }

    static generateSidsByMapping(callback) {
        // sidStart, sidEnd, serverId, employeeId,
        SidService.getSidMappings((err, mappings) => {
            if (err) {
                callback(err);
            } else {
                let sidList = [];
                if (mappings) {
                    mappings.filter(m => m.sidStart && m.sidEnd && m.employeeId).forEach(mapping => {
                        let sidStartPart1AndPart2 = __getSidPart1Part2(mapping.sidStart);
                        let sidEndPart1AndPart2 = __getSidPart1Part2(mapping.sidEnd);
                        if (!__validateSidString(sidStartPart1AndPart2, sidEndPart1AndPart2)) {
                            //skip
                            config.logger.warn(`SID Mapping (${mapping.sidStart}, ${mapping.sidEnd}) is not correct, skipping it`);
                        } else {
                            sidList = sidList.concat(__generateSidList(sidStartPart1AndPart2, sidEndPart1AndPart2)
                                .map(sid => ({
                                    EMPLOYEE_ID: mapping.employeeId,
                                    SID: sid,
                                    SID_USER: `${sid.toLowerCase()}adm`
                                })));
                        }
                    });
                    if (sidList.length > 0) {
                        sidDAL.generateSids(sidList, callback);
                    } else {
                        config.logger.warn("Do not have any valid SID Mapping.");
                        callback("Do not have any valid SID Mapping.");
                    }
                } else {
                    config.logger.warn("SID Mapping is empty.");
                    callback("SID Mapping is empty.");
                }
            }
        });
    }
}

exports = module.exports = SidService;