const Blackboard = require('./blackboard');
const unix = require('./unix');

module.exports.getNotification = async function (username, password) {
    try {
        let notices = [];
        let bb = new Blackboard(username, password);
        let loggedIn = await bb.login();
        let updates = await bb.getUpdates();

        if (loggedIn) {
            Object.keys(updates.data).forEach(function (key) {
                if (updates.data[key].itemSpecificData.notificationDetails.seen === false) {
                    notices.push({
                        title:
                            `${updates.data[key].itemSpecificData.title || 'Unavailable title'}
                             - ${updates.data[key].itemSpecificData.notificationDetails.announcementTitle || 'Unavailable title'}`,
                        description:
                            `${updates.data[key].itemSpecificData.contentExtract || 'Unavailable content'}`,
                        link:
                            `https://blackboard.hcmiu.edu.vn${updates.data[key].se_itemUri || '#'}`,
                        author:
                            `${updates.data[key].itemSpecificData.notificationDetails.announcementLastName || 'Anonymous'}
                             ${updates.data[key].itemSpecificData.notificationDetails.announcementFirstName || 'Anonymous'}`,
                        color: '#f50057'
                    });
                }
            });
            return { success: true, data: notices };
        }
        return { success: false, data: 'login failed' };
    }
    catch (error) {
        return { success: false, data: error + '' };
    }
}
