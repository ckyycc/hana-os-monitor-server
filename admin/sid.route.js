const express = require('express');
const router = express.Router('sid');
const sidService = require('./sid.service');

router.get('/', function (req, res) {
    sidService.getSidsInfo((err, sidInfos) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getSidsInfo failed at: ${err}`);
        } else {
            res.json(sidInfos);
        }
    });
});


router.put('/', function (req, res) {
    let sid = req.body;
    sidService.updateSid(sid.oldServerId, sid.serverId, sid.sid, sid.employeeId, sid.importantFlag, sid.comment, (err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`updateSid failed at: ${err}`);
        } else {
            res.json(`Update done! ${affectedRows} updated!`);
        }
    });
});

router.post('/', function (req, res) {
    let sid = req.body;
    sidService.insertSid(sid.serverId, sid.sid, sid.employeeId, sid.importantFlag, sid.comment, (err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`addSid failed at: ${err}`);
        } else {
            res.json(`Insert done! ${affectedRows} inserted!`);
        }
    });
});

router.delete('/:serverId,:sid', function (req, res) {
    let serverId = req.params.serverId;
    let sid = req.params.sid;

    sidService.deleteSid(serverId, sid, (err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`deleteSid failed at: ${err}`);
        } else {
            res.json(`Delete done! ${affectedRows} deleted!`);
        }
    });
});

router.get('/mappings', function (req, res) {
    sidService.getSidMappings((err, sidMappings) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getSidMappings failed at: ${err}`);
        } else {
            res.json(sidMappings);
        }
    });
});

router.post('/mappings', function (req, res) {
    let mapping = req.body;
    //TODO implement the location!
    sidService.insertSidMapping(mapping.sidStart, mapping.sidEnd, mapping.employeeId, (err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`insertSidMapping failed at: ${err}`);
        } else {
            res.json(`Insert done! ${affectedRows} inserted!`);
        }
    });
});

router.put('/mappings', function (req, res) {
    let mapping = req.body;

    sidService.updateSidMapping(mapping.sidStart, mapping.sidEnd, mapping.oldSidStart, mapping.oldSidEnd,
        mapping.employeeId, mapping.oldEmployeeId, (err, affectedRows) => {
            if (err) {
                res.status(500).send(err);
                config.logger.error(`updateSidMapping failed at: ${err}`);
            } else {
                res.json(`Update done! ${affectedRows} updated!`);
            }
        });
});

router.put('/mappings/generate', function (req,res) {
    sidService.generateSidsByMapping((err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`generateSidsByMapping failed at: ${err}`);
        } else {
            res.json(`SIDs generation done! ${affectedRows} updated!`);
        }
    });
});

router.delete('/mappings/:userId,:sidStart,:sidEnd', function (req, res) {
    let userId = req.params.userId;
    let sidStart = req.params.sidStart;
    let sidEnd = req.params.sidEnd;

    sidService.deleteSidMapping(sidStart, sidEnd, userId, (err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`deleteSidMapping failed at: ${err}`);
        } else {
            res.json(`Delete done! ${affectedRows} deleted!`);
        }
    });
});


exports = module.exports = router;