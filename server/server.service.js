const serverDAL = require('./server.dal');
const configService = require('../config/config.service');
const async = require('async');

function __getStatus(value, type, threshold) {
    value = Number.parseFloat(value);
    let thresholdValuesAccent = Number.parseFloat(threshold[type].accent);
    let thresholdValuesWarn = Number.parseFloat(threshold[type].warn);

    if (value < thresholdValuesAccent) {
        return 0; //PRIMARY
    } else if (value >= thresholdValuesAccent && value <= thresholdValuesWarn) {
        return 1; //ACCENT
    } else if (value > thresholdValuesWarn) {
        return 2; //WARN
    } else {
        return 3; //ERROR
    }
}

function __getFinalStatus(cpuUsage, memUsage, diskUsage, threshold) {
    let statusCPU = __getStatus(Number.parseFloat(cpuUsage).toFixed(2), 'CPU', threshold);
    let statusMEM = __getStatus(Number.parseFloat(memUsage).toFixed(2), 'MEM', threshold);
    let statusDisk = __getStatus(Number.parseFloat(diskUsage).toFixed(2), 'DISK', threshold);

    let statusMax = Math.max(statusCPU, statusMEM, statusDisk);
    let statusMin = Math.min(statusCPU, statusMEM, statusDisk);
    if (statusMax < 3) {
        //No error
        return statusMax;
    } else if (statusMin < 3) {
        //at least 1 resource not failed, means server could logon
        return 2; //WARN
    } else {
        //all resources are failed, server is dead
        return 3; //ERROR
    }
}

function __getConsumers(id, consumers) {
    let consumers4server = consumers.filter(consumer => consumer.SERVER_ID === id);
    if (consumers4server) {
        return consumers4server.map(consumer => ({
            userName: consumer.USER_NAME,
            sid: consumer.SID,
            folder: consumer.FOLDER,
            owner: consumer.EMPLOYEE_NAME,
            consuming: Number.parseFloat(consumer.USAGE).toFixed(2),
            checkTime: consumer.CHECK_TIME
        }));
    }
}

class ServerService {
    static getServer(id, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        serverDAL.getServer(id, (err, server_consumers) => {
            if (err) {
                callback(err);
            } else {
                let server = server_consumers.server;
                let consumers = server_consumers.consumers;
                if (server && server.length === 1) {
                    callback(null, server.map(server => ({
                        location: {locationId: server.LOCATION_ID, location: server.LOCATION},
                        id: server.SERVER_ID,
                        name: server.SERVER_NAME,
                        resources: [
                            {
                                type: 'CPU',
                                value: Number.parseFloat(server.CPU_USAGE).toFixed(2),
                                total: Number.parseFloat(server.CPU_TOTAL).toFixed(2),
                                checkTime: server.CHECK_TIME,
                                consumers: __getConsumers(server.SERVER_ID, consumers.CPU)
                            }, {
                                type: 'MEM',
                                value: Number.parseFloat(server.MEM_USAGE).toFixed(2),
                                total: Number.parseFloat(server.MEM_TOTAL).toFixed(2),
                                checkTime: server.CHECK_TIME,
                                consumers: __getConsumers(server.SERVER_ID, consumers.MEM)
                            }, {
                                type: 'DISK',
                                value: Number.parseFloat(server.DISK_USAGE).toFixed(2),
                                total: Number.parseFloat(server.DISK_TOTAL).toFixed(2),
                                checkTime: server.CHECK_TIME,
                                consumers: __getConsumers(server.SERVER_ID, consumers.DISK)
                            }]
                    }))[0]);
                }
            }
        });
    }

    static getServers(userId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        async.waterfall([
            configService.getThresholds,
            function(thresholds, cb){
                serverDAL.getServers(userId, (err, servers) =>{
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, servers.map(server => ({
                                location: {locationId: server.LOCATION_ID, location: server.LOCATION},
                                id: server.SERVER_ID,
                                name: server.SERVER_NAME,
                                status: __getFinalStatus(server.CPU_USAGE, server.MEM_USAGE, server.DISK_USAGE, thresholds),

                                resources: [
                                    {
                                        type: 'CPU',
                                        value: Number.parseFloat(server.CPU_USAGE).toFixed(2),
                                        total: Number.parseFloat(server.CPU_TOTAL).toFixed(2),
                                        status: __getStatus(server.CPU_USAGE, 'CPU', thresholds),
                                        checkTime: server.CHECK_TIME,
                                    }, {
                                        type: 'MEM',
                                        value: Number.parseFloat(server.MEM_USAGE).toFixed(2),
                                        total: Number.parseFloat(server.MEM_TOTAL).toFixed(2),
                                        status: __getStatus(server.MEM_USAGE, 'MEM', thresholds),
                                        checkTime: server.CHECK_TIME,
                                    }, {
                                        type: 'DISK',
                                        value: Number.parseFloat(server.DISK_USAGE).toFixed(2),
                                        total: Number.parseFloat(server.DISK_TOTAL).toFixed(2),
                                        status: __getStatus(server.DISK_USAGE, 'DISK', thresholds),
                                        checkTime: server.CHECK_TIME,
                                    }]
                            }))
                        );
                    }
                });
            }
        ], function(err, servers) {
           if (err) {
               callback(err);
           }  else {
               callback(null, servers);
           }
        });
    }

    static getServerHistories(id, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        serverDAL.getServerHistories(id, callback);
    }
}
module.exports = ServerService;
