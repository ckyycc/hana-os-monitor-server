const instanceDAL = require('./instance.dal');

class InstanceService {

    static getInstances(userId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }

        instanceDAL.getInstances(userId, (err, instances) => {
            if (err) {
                callback(err);
            } else {
                callback(null, instances.map(instance => ({
                    serverName: instance.SERVER_NAME,
                    sid: instance.SID,
                    employeeName: instance.EMPLOYEE_NAME,
                    revision: instance.REVISION,
                    releaseSP: instance.RELEASE_SP,
                    memUsageGB: instance.MEM_USAGE_GB,
                    memUsageRank: instance.MEM_USAGE_RANK,
                    diskUsageGB: instance.DISK_USAGE_GB,
                    diskUsageRank: instance.DISK_USAGE_RANK,
                    cpuUsagePCT: instance.CPU_USAGE_PCT,
                    cpuUsageRank: instance.CPU_USAGE_RANK,
                    os: instance.OS,
                    checkTime: instance.CHECK_TIME
                })));
            }
        });
    }
}
module.exports = InstanceService;
