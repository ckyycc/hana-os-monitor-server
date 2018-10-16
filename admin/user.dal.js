const hana = require('../database/hana');

class UserDAL {

    /**
     * get user with location id info by user id
     */
    static getUser(userId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        let command = `select A.EMPLOYEE_ID,
                               A.EMPLOYEE_NAME,
                               A.EMAIL,
                               A.SUPER_ADMIN,
                               A.ADMIN,
                               B.LOCATION_ID
                        from HANA_OS_MONITOR.EMPLOYEE_INFO A
                        left join HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO B on A.EMPLOYEE_ID = B.EMPLOYEE_ID
                        where A.EMPLOYEE_ID = '${userId}'`;
        hana.select(command, function(err, user) {
            if (err) {
                callback(err);
            } else {
                if (user && user.length > 0) {
                    callback(null, user);
                } else {
                    callback(`User ${userId} does not exist in the system.`);
                }
            }
        });
    }

    static getUsers(callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        let command = `select EMPLOYEE_ID,
                        EMPLOYEE_NAME,
                        EMAIL ,
                        EMPLOYEE_NAME,
                        SUPER_ADMIN,
                        ADMIN
                       from HANA_OS_MONITOR.EMPLOYEE_INFO`;
        hana.select(command, callback);
    }

    static insertUser(currentUserId, userId, userName, userEmail, isAdmin, isSuperAdmin, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!userId || !userName || !userEmail) {
            callback("userId, userName or userEmail can not be empty!");
            return;
        }

        // Modified at 07/29/2018 for bug #25 admin can only set user as admin not super admin. Normal user can't
        // delete/edit/create user
        let command = `INSERT INTO HANA_OS_MONITOR.EMPLOYEE_INFO (EMPLOYEE_ID, EMPLOYEE_NAME, EMAIL, ADMIN, SUPER_ADMIN) 
	                     SELECT * FROM (
                           SELECT '${userId}' EMPLOYEE_ID,'${userName}' EMPLOYEE_NAME,'${userEmail}' EMAIL,
                                  UPPER('${isAdmin}') ADMIN, UPPER('${isSuperAdmin}') SUPER_ADMIN FROM DUMMY) A 
                           WHERE EXISTS
                             (SELECT 1 FROM HANA_OS_MONITOR.EMPLOYEE_INFO B 
                              WHERE EMPLOYEE_ID = UPPER('${currentUserId}') AND 
                                (B.SUPER_ADMIN = 'X' OR (B.ADMIN='X' AND A.SUPER_ADMIN != 'X')))`;

        hana.insert(command, callback);
    }

    static updateUser(currentUserId, userId, userName, userEmail, isAdmin, isSuperAdmin, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!userId || !userName || !userEmail) {
            callback("userId, userName or userEmail can not be empty!");
            return;
        }

        // Modified at 07/29/2018 for bug #25 admin can only set user as admin not super admin. Normal user can't
        // delete/edit/create user
        let command = `UPDATE HANA_OS_MONITOR.EMPLOYEE_INFO SET 
                                EMPLOYEE_NAME = '${userName}',
                                EMAIL = '${userEmail}', 
                                ADMIN = UPPER('${isAdmin}'), 
                                SUPER_ADMIN = UPPER('${isSuperAdmin}')
                        WHERE EMPLOYEE_ID = upper('${userId}') AND exists (
                	        SELECT 1 FROM HANA_OS_MONITOR.EMPLOYEE_INFO 
                	        WHERE EMPLOYEE_ID = '${currentUserId}' AND 
                	              (SUPER_ADMIN = 'X' OR (ADMIN= 'X' AND upper('${isSuperAdmin}') != 'X')))`;
        hana.update(command, callback);

    }
    static deleteUser(currentUserId, userId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!userId) {
            callback("User ID can not be empty!");
            return;
        }
        // Modified at 07/29/2018 for bug #25 admin can not delete super admin. Normal user can't
        // delete/edit/create user
        let command = `DELETE FROM HANA_OS_MONITOR.EMPLOYEE_INFO A WHERE A.EMPLOYEE_ID = '${userId}' AND EXISTS (
                        SELECT 1 FROM HANA_OS_MONITOR.EMPLOYEE_INFO B 
                        WHERE B.EMPLOYEE_ID = '${currentUserId}' AND
                              (B.SUPER_ADMIN = 'X' OR (B.ADMIN = 'X' AND A.SUPER_ADMIN != 'X')))`;
        hana.delete(command, callback);
    }

    static getUserLocations (callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        let command = `select A.EMPLOYEE_ID,
                              A.EMPLOYEE_NAME,
                              A.EMAIL,
                              LEFT(IFNULL(A.ADMIN, '') || IFNULL(A.SUPER_ADMIN, ''), 1) ADMIN,
                              C.LOCATION_ID,
                              C.LOCATION
                        from HANA_OS_MONITOR.EMPLOYEE_INFO A
                        left join HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO B on A.EMPLOYEE_ID = B.EMPLOYEE_ID
                        full join HANA_OS_MONITOR.LOCATION_INFO C on B.LOCATION_ID = C.LOCATION_ID`;
        hana.select(command, callback);
    }

    static insertUserLocation(userId, locationName, isAdmin, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!userId || !locationName) {
            callback("User ID and location name can not be empty!");
            return;
        }
        let command = `INSERT INTO HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO (EMPLOYEE_ID, LOCATION_ID) (
            SELECT '${userId}', LOCATION_ID FROM HANA_OS_MONITOR.LOCATION_INFO WHERE LOCATION = '${locationName}')`;

        hana.insert(command, callback);
    }

    static deleteUserAllLocations(currentUserId, userId, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!userId) {
            callback("User ID can not be empty!");
            return;
        }
        // Modified at 07/29/2018 for bug #25 admin can only set user as admin not super admin. Normal user can't
        // delete/edit/create user
        let command = `DELETE FROM HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO 
                       WHERE EMPLOYEE_ID = '${userId}' AND  EXISTS (
                            SELECT 1 FROM HANA_OS_MONITOR.EMPLOYEE_INFO A WHERE EMPLOYEE_ID = '${userId}' AND EXISTS (            
                                SELECT 1 FROM HANA_OS_MONITOR.EMPLOYEE_INFO B 
                                WHERE B.EMPLOYEE_ID = '${currentUserId}' AND
                                      (B.SUPER_ADMIN = 'X' OR (B.ADMIN = 'X' AND A.SUPER_ADMIN != 'X'))))`;
        hana.delete(command, callback);
    }


    static updateUserLocation(userId, locationName, oldLocationName, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!userId || !locationName || !oldLocationName) {
            callback("User ID, new location name and old location name can not be empty!");
            return;
        }
        let command =
            `UPDATE HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO SET LOCATION_ID = 
            (SELECT LOCATION_ID FROM HANA_OS_MONITOR.LOCATION_INFO WHERE LOCATION = '${locationName}')
                    WHERE EMPLOYEE_ID = '${userId}' and LOCATION_ID = (SELECT LOCATION_ID
                            FROM HANA_OS_MONITOR.LOCATION_INFO WHERE LOCATION = '${oldLocationName}')`;
        hana.update(command, callback);

    }

    static deleteUserLocation(userId, locationName, callback) {
        if (!callback) {
            console.error('No call back function provided!');
            return;
        }
        if (!userId || !locationName) {
            callback("User ID or location name can not be empty!");
            return;
        }
        let command = `DELETE FROM HANA_OS_MONITOR.EMPLOYEE_LOCATION_INFO WHERE 
                   EMPLOYEE_ID = '${userId}' AND LOCATION_ID = 
                   (SELECT LOCATION_ID FROM HANA_OS_MONITOR.LOCATION_INFO WHERE LOCATION = '${locationName}')`;

        hana.delete(command, callback);
    }

}

exports = module.exports = UserDAL;
