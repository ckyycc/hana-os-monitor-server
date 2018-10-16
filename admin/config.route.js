const express = require('express');
const router = express.Router('config');
const adminConfigService = require('./config.service');
const config = require('../config/default');


router.get('/', function (req, res) {
    adminConfigService.getConfigurations((err, configurations) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getConfigurations failed at: ${err}`);
        } else {
            res.json(configurations);
        }
    });
});

router.put('/', function (req, res) {
    let adminConfig = req.body;
    adminConfigService.updateConfiguration(
        req.loginUserId,
        adminConfig.component,
        adminConfig.configuration,
        adminConfig.value,
        (err, affectedRows) => {
            if (err) {
                res.status(500).send(err);
                config.logger.error(`updateConfiguration failed at: ${err}`);
            } else {
                res.json(`Update done! ${affectedRows} updated!`);
            }
        });
});

exports = module.exports = router;