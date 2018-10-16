const configDAL = require('./config.dal');
const async = require('async');

let __cpuUsageAccentThreshold;
let __cpuUsageWarnThreshold;
let __diskUsageAccentThreshold;
let __diskUsageWarnThreshold;
let __memUsageAccentThreshold;
let __memUsageWarnThreshold;

function __getCPUUsageAccentThreshold(callback) {
    if (__cpuUsageAccentThreshold >= 0) {
        callback(null, __cpuUsageAccentThreshold)
    } else {
        configDAL.getConfiguration("THRESHOLD_CPU_USAGE_ACCENT_INT", (err, configuration) => {
            if (err) {
                callback(err);
            } else {
                __cpuUsageAccentThreshold = configuration[0].VALUE;
                callback(null, __cpuUsageAccentThreshold);
            }
        });
    }
}

function __getCPUUsageWarnThreshold(callback) {
    if (__cpuUsageWarnThreshold >= 0) {
        callback(null, __cpuUsageWarnThreshold)
    } else {
        configDAL.getConfiguration("THRESHOLD_CPU_USAGE_WARN_INT", (err, configuration) => {
            if (err) {
                callback(err);
            } else {
                __cpuUsageWarnThreshold = configuration[0].VALUE;
                callback(null, __cpuUsageWarnThreshold);
            }
        });
    }
}


function __getMEMUsageAccentThreshold(callback) {
    if (__memUsageAccentThreshold >= 0) {
        callback(null, __memUsageAccentThreshold)
    } else {
        configDAL.getConfiguration("THRESHOLD_MEM_USAGE_ACCENT_INT", (err, configuration) => {
            if (err) {
                callback(err);
            } else {
                __memUsageAccentThreshold = configuration[0].VALUE;
                callback(null, __memUsageAccentThreshold);
            }
        });
    }
}

function __getMEMUsageWarnThreshold(callback) {
    if (__memUsageWarnThreshold >= 0) {
        callback(null, __memUsageWarnThreshold)
    } else {
        configDAL.getConfiguration("THRESHOLD_MEM_USAGE_WARN_INT", (err, configuration) => {
            if (err) {
                callback(err);
            } else {
                __memUsageWarnThreshold = configuration[0].VALUE;
                callback(null, __memUsageWarnThreshold);
            }
        });
    }
}

function __getDISKUsageAccentThreshold(callback) {
    if (__diskUsageAccentThreshold >= 0) {
        callback(null, __diskUsageAccentThreshold)
    } else {
        configDAL.getConfiguration("THRESHOLD_DISK_USAGE_ACCENT_INT", (err, configuration) => {
            if (err) {
                callback(err);
            } else {
                __diskUsageAccentThreshold = configuration[0].VALUE;
                callback(null, __diskUsageAccentThreshold);
            }
        });
    }
}

function __getDISKUsageWarnThreshold(callback) {
    if (__diskUsageWarnThreshold >= 0) {
        callback(null, __diskUsageWarnThreshold)
    } else {
        configDAL.getConfiguration("THRESHOLD_DISK_USAGE_WARN_INT", (err, configuration) => {
            if (err) {
                callback(err);
            } else {
                __diskUsageWarnThreshold = configuration[0].VALUE;
                callback(null, __diskUsageWarnThreshold);
            }
        });
    }
}

class ConfigService {
    /**
     * Get the thresholds information from the MONITOR_CONFIGURATION
     * @param callback
     */
    static getThresholds(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }

        async.parallel([
            __getCPUUsageAccentThreshold,
            __getCPUUsageWarnThreshold,
            __getDISKUsageAccentThreshold,
            __getDISKUsageWarnThreshold,
            __getMEMUsageAccentThreshold,
            __getMEMUsageWarnThreshold
        ], function(err, thresholds) {
            if (err) {
                callback(err);
            } else {
                if (!thresholds || thresholds.length !== 6) {
                    callback('Internal error happened when getting all thresholds info.')
                }
                callback(null, {
                    CPU:  {accent: thresholds[0], warn: thresholds[1]},
                    DISK: {accent: thresholds[2], warn: thresholds[3]},
                    MEM:  {accent: thresholds[4], warn: thresholds[5]}
                });
            }
        });
    }
}
exports = module.exports = ConfigService;
