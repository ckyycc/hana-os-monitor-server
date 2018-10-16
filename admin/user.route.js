const express = require('express');
const router = express.Router('user');
const userService = require('./user.service');
const config = require('../config/default');

router.get('/', function (req, res) {
    userService.getUsers((err, users) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getUsers failed at: ${err}`);
        } else {
            res.json(users);
        }
    });
});

router.post('/', function (req, res) {
    let user = req.body;
    userService.insertUser(req.loginUserId, user.employeeId, user.employeeName, user.email, user.isAdmin, user.isSuperAdmin,
        (err, affectedRows) => {
            if (err) {
                res.status(500).send(err);
                config.logger.error(`insertUser failed at: ${err}`);
            } else {
                res.json(`Create done! ${affectedRows} updated!`);
            }
        });
});

router.put('/', function (req, res) {
    let user = req.body;
    userService.updateUser(req.loginUserId, user.employeeId, user.employeeName, user.email, user.isAdmin, user.isSuperAdmin,
        (err, affectedRows) => {
            if (err) {
                res.status(500).send(err);
                config.logger.error(`updateUser failed at: ${err}`);
            } else {
                res.json(`Update done! ${affectedRows} updated!`);
            }
        });
});

router.delete('/:userId', function (req, res) {
    let userId = req.params.userId;

    userService.deleteUser(req.loginUserId, userId, (err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`deleteUser failed at: ${err}`);
        } else {
            res.json(`Delete done! ${affectedRows} deleted!`);
        }
    });
});

router.get('/currentUser', (req, res) => {
    userService.getUser(req.loginUserId, (err, user) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getUser failed at: ${err}`);
        } else {
            // user = {userId: userId, userName: "Cheng, Kuang", role:"admin", locIDs:[1, 2, 3, 4]};
            res.json(user);
        }
    });
});

router.get('/locations', function (req, res) {
    userService.getUserLocations((err, users) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`getUserLocations failed at: ${err}`);
        } else {
            res.json(users);
        }
    });
});

router.post('/locations', function (req, res) {
    let user = req.body;
    userService.insertUserLocation(user.employeeId, user.locationName, user.isAdmin, (err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`insertUserLocation failed at: ${err}`);
        } else {
            res.json(`Create done! ${affectedRows} updated!`);
        }
    });
});

router.put('/locations', function (req, res) {
    let user = req.body;

    userService.updateUserLocation(user.employeeId, user.locationName, user.oldLocationName,
        (err, affectedRows) => {
            if (err) {
                res.status(500).send(err);
                config.logger.error(`updateUserLocation failed at: ${err}`);
            } else {
                res.json(`Update done! ${affectedRows} updated!`);
            }
        });
});

router.delete('/locations/:userId,:locationName', function (req, res) {
    let userId = req.params.userId;
    let locationName = req.params.locationName;

    userService.deleteUserLocation(userId, locationName, (err, affectedRows) => {
        if (err) {
            res.status(500).send(err);
            config.logger.error(`deleteUserLocation failed at: ${err}`);
        } else {
            res.json(`Delete done! ${affectedRows} deleted!`);
        }
    });
});

exports = module.exports = router;