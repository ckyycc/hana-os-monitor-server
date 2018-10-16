const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const expressWinston = require('express-winston');
const moment = require('moment');

const __LOG_LEVEL_HTTP = 'info';
const __LOG_LEVEL = 'debug';
const __LOGGER_FILE_HTTP = './trace/http.%DATE%.log';
const __LOGGER_FILE_HTTP_ERROR = './trace/http.error.log';
const __LOGGER_FILE = './trace/hana_os_monitor_server.%DATE%.log';

const __dailyRotateFile = new DailyRotateFile({
    filename: __LOGGER_FILE,
    datePattern: 'YYYYMMDD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '60d',
    json: false,
    colorize: false,
    timestamp: () => {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS')
    },
});

const __dailyRotateFileHTTP = new DailyRotateFile({
    filename: __LOGGER_FILE_HTTP,
    datePattern: 'YYYYMMDD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '60d',
    json: false,
    colorize: false,
    timestamp: () => {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS')
    },
});

winston.configure({
    level: __LOG_LEVEL,
    transports: [
        __dailyRotateFile,
    ],
    exitOnError: false
});

const config = {};

config.httpLogger = expressWinston.logger({
    transports: [
        __dailyRotateFileHTTP
    ],
    level: __LOG_LEVEL_HTTP,
    statusLevels: true,
    expressFormat: true,
});
config.httpErrorLogger = expressWinston.errorLogger({
    transports: [
        new winston.transports.File({
            filename: __LOGGER_FILE_HTTP_ERROR,
            json: false,
            colorize: false,
            timestamp: ()=>{ return moment().format('YYYY-MM-DD hh:mm:ss.SSS') },
        })
    ]
});
config.logger = winston;

config.NODE_ENV = process.env.NODE_ENV || 'development';
config.ORIGIN_SERVER = 'xxx.xxx.xxx.xxx';
config.ORIGIN_IP = 'xxx.xxx.xxx.xxx';
config.HANA_SERVER = {
    host: 'xxx.xxx.xxx.xxx',
    port: 30615,
    user: 'HANA_OS_MONITOR_WEB',
    password: 'xxxxx'
};

config.ACAO = ['*'];

/**
 * Access-Control-Allow-Methods
 */
config.ACAM = 'GET,PUT,POST,DELETE,OPTIONS';

/**
 * Access-Control-Allow-Headers
 */
config.ACAH = 'Content-Type';

exports = module.exports = config;

