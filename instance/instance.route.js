const express = require('express');
const router = express.Router('instance');
const instanceService = require('./instance.service');
const config = require('../config/default');

router.get('/', (req, res) => {
    instanceService.getInstances(req.loginUserId, (err, instances) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getServers failed at: ${err}`);
        } else {
            res.json(instances);
        }
    });
});
module.exports = router;
