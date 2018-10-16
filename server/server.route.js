const express = require('express');
const router = express.Router('server');
const serverService = require('./server.service');
const config = require('../config/default');

router.get('/', (req, res) => {
    serverService.getServers(req.loginUserId, (err, servers) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getServers failed at: ${err}`);
        } else {
            res.json(servers);
        }
    });
});

router.get('/:serverId', (req, res) => {
    serverService.getServer(req.params.serverId, (err, server) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getServer failed at: ${err}`);
        } else {
            res.json(server);
        }
    });
});

router.get('/histories/:serverId', (req, res) => {
    serverService.getServerHistories(req.params.serverId, (err, histories)=> {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getServerHistories failed at: ${err}`);
        } else {
            res.json(histories);
        }
    });
});
module.exports = router;