const express        = require('express');
const bodyParser     = require('body-parser');
const compression    = require('compression');
const config         = require('./config/default');
const serverRoute    = require('./server/server.route');
const instanceRoute  = require('./instance/instance.route');
const userRoute      = require('./admin/user.route');
const sidRoute       = require('./admin/sid.route');
const configRoute    = require('./admin/config.route');
const https          = require('https');
const http           = require('http');
const fs             = require('fs');

const app = express();
app.use( compression() );
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded({ extended: true }) ); // to support URL-encoded bodies

const privateKey  = fs.readFileSync('sslcert/server.key');
const certificate = fs.readFileSync('sslcert/server.crt');
const caCertificate = fs.readFileSync('sslcert/sso_ca.crt');

const credentials = {
    key: privateKey, cert: certificate, ca: caCertificate, requestCert: true, rejectUnauthorized: false
};

const httpsServer = https.createServer(credentials, app);
const listener = httpsServer.listen(4433, '0.0.0.0', function () {
    console.info(`Express HTTPS server listening on port ${listener.address().port}`);
    config.logger.info(`Express HTTPS server listening on port ${listener.address().port}`);
});

http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'].split(":")[0] + ":4433"+req.url });
    res.end();
}).listen(8080);

app.use(function (req, res, next) {
    if (!req.client.authorized) {
        let ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress);

        config.logger.info(`User from ${ip} is not authorized!`);
        return res.status(401).send('Sorry, only SAP employee is authorized!');
    }
    // examine the cert itself, and even validate based on that!
    let cert = req.socket.getPeerCertificate();

    if (cert.subject) {
        req.loginUserId = cert.subject.CN;
        config.logger.debug(`User:${cert.subject.CN} is trying to logon.`)
    } else {
        config.logger.info("Need certificate!")
    }

    if (req.url && req.url.startsWith('/api')) {
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

        if (config.NODE_ENV === 'production') {
            //only check this in production
            if (!(req.headers.referer || "").toUpperCase().includes(config.ORIGIN_SERVER.toUpperCase()) &&
                !(req.headers.referer || "").toUpperCase().includes(config.ORIGIN_IP.toUpperCase())) {
                let ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                config.logger.info(`User ${req.loginUserId} from ${ip} tried to access ${fullUrl} directly.`);
                return res.status(401).send(`You cannot access this URL directly!`);
            }
        }
    }

    res.append('Access-Control-Allow-Origin', config.ACAO);
    res.append('Access-Control-Allow-Methods',config.ACAM);
    res.append('Access-Control-Allow-Headers', config.ACAH);
    next();
});

// express-winston logger makes sense BEFORE the router
app.use(config.httpLogger);
app.use(express.static(__dirname + '/client'));


app.use('/api/servers', serverRoute);
app.use('/api/users', userRoute);
app.use('/api/sids', sidRoute);
app.use ('/api/configurations', configRoute);
app.use('/api/instances', instanceRoute);

app.all('*', function(req,res){
    res.status(200).sendFile(__dirname + '/client/index.html');
});

// express-winston errorLogger makes sense AFTER the router.
app.use(config.httpErrorLogger);

module.exports = app;
