const userDAL = require('./user.dal');

function __removeDuplicate(items) {
    return items.filter((item, index, self) =>
        self.findIndex(t => t.EMPLOYEE_ID === item.EMPLOYEE_ID) === index );
}

class UserService {

    /**
     * For authentication of login, get employee name, role and locations info by employee id
     * @param userId employee id
     * @param callback
     */
    static getUser(userId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        userDAL.getUser(userId, (err, rows) => {
            if (err) {
                callback(err);
            } else {
                let user = __removeDuplicate(rows);
                if (user && user.length === 1) {
                    callback(null, {
                        employeeId: user[0].EMPLOYEE_ID,
                        employeeName: user[0].EMPLOYEE_NAME,
                        email: user[0].EMAIL,
                        isAdmin: user[0].ADMIN,
                        isSuperAdmin: user[0].SUPER_ADMIN
                    });
                } else {
                    callback(`Backend error happened with user ${userId}!`);
                }
            }
        })
    }

    static getUsers(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        userDAL.getUsers((err, rows) => {
            if (err) {
                callback(err);
            } else {
                callback(null, rows.map(row => ({
                    employeeId: row.EMPLOYEE_ID,
                    employeeName: row.EMPLOYEE_NAME,
                    email: row.EMAIL,
                    isAdmin: row.ADMIN || ' ',
                    isSuperAdmin: row.SUPER_ADMIN || ' '
                })));
            }
        });
    }

    static insertUser(currentUserId, userId, userName, userEmail, isAdmin, isSuperAdmin, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        userDAL.insertUser(currentUserId, userId, userName, userEmail, isAdmin, isSuperAdmin, callback);
    }

    static updateUser(currentUserId, userId, userName, userEmail, isAdmin, isSuperAdmin, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        userDAL.updateUser(currentUserId, userId, userName, userEmail, isAdmin, isSuperAdmin, callback);
    }

    static deleteUser(currentUserId, userId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        // need to delete all locations for the user first, otherwise will get foreign key error
        userDAL.deleteUserAllLocations(currentUserId, userId, (err, rowNum) => {
            if (err) {
                callback(err);
                //we do not care about the affected row number here, just set it to null.
                rowNum = null;
            } else {
                userDAL.deleteUser(currentUserId, userId, callback);
            }
        });
    }

    static getUserLocations(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        userDAL.getUserLocations((err, rows) => {
            if (err) {
                callback(err);
            } else {
                callback(null, rows.map(row => ({
                    employeeId: row.EMPLOYEE_ID,
                    employeeName: row.EMPLOYEE_NAME,
                    email: row.EMAIL,
                    isAdmin: row.ADMIN || ' ',
                    locationId: row.LOCATION_ID,
                    locationName: row.LOCATION
                })));
            }
        });
    }

    static insertUserLocation(userId, locationName, isAdmin, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        userDAL.insertUserLocation(userId, locationName, isAdmin, callback);
    }

    static updateUserLocation(userId, locationName, oldLocationName, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        userDAL.updateUserLocation(userId, locationName, oldLocationName, callback);
    }

    static deleteUserLocation(userId, locationName, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        userDAL.deleteUserLocation(userId, locationName, callback);
    }
}

exports = module.exports = UserService;