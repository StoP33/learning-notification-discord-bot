const Blackboard = require('./blackboard');
const cheerio = require('cheerio');

class IU
{
    constructor(username, password, host = 'https://blackboard.hcmiu.edu.vn')
    {
        this.host = host;
        this.username = username;
        this.password = password;
        this.blackboard = new Blackboard(this.username, this.password, this.host);
    }

    getAllBlackboardNotification()
    {
        return new Promise(async (resolve, reject) => {
            try {
                let loggedIn = await this.blackboard.login();
                if(!loggedIn) resolve({ success: false, data: 'Login failed' });
                let { success, data} =  await this.blackboard.getUpdates();
                if(success && loggedIn) resolve({ success: true, data: data });
            } catch(error) {
                reject({ success: false, data: error });
            }

            reject({ success: false, data: 'Have problems when get all Blackboard notifications' });
        });
    }

    getUnseenBlackboardNotification()
    {
        return new Promise(async (resolve, reject) => {
            try {
                let notifications = await this.getAllBlackboardNotification();
                Object.entries(notifications.data).forEach(([key, value]) => {
                    value.itemSpecificData.notificationDetails.seen ? delete notifications.data[key] : '';
                });
                resolve({ success: true, data: notifications.data });
            } catch(error) {
                reject({ success: false, data: error });
            }
        });
    }

    filterUnseenBlackboardNotification(notification)
    {
        return new Promise(async (resolve, reject) => {
            try {
                let html = await this.blackboard.sendRequest({},
                    `${notification.se_itemUri || '#'}`);
                let links = this.getLink(html);
                resolve({ success: true, data: {
                    id: notification.se_id,
                    title: (notification.itemSpecificData.title || '')
                            + (notification.itemSpecificData.notificationDetails.announcementTitle || ''),
                    description: notification.itemSpecificData.contentExtract || '',
                    url: this.host + notification.se_itemUri,
                    author: (notification.itemSpecificData.notificationDetails.announcementLastName || 'Anonymous')
                            + (notification.itemSpecificData.notificationDetails.announcementFirstName || 'Anonymous'),
                    fields: links,
                    color: '#f50057'
                } });
            } catch(error) {
                reject({ success: false, data: error });
            }
        });
    }

    getLink(html = '<div></div>')
    {
        let links = [];
        let ids = ['#pageList', '#announcementList'];
        let $ = cheerio.load(html);

        ids.forEach((id) => {
            if($(id).text()) {
                $(id).find('a').each((index, element) => {
                    if ($(element).attr('href') != '#contextMenu' && $(element).attr('href') != '#close') {
                        links.push({
                            name: $(element).text(),
                            value: `${$(element).attr('href')[0] === '/' ? this.host + $(element).attr('href') : $(element).attr('href')}`,
                            inline: false
                        });
                    }
                });
            }
        });
        return links.length
            ? links
            : [{ name: 'Unavailable link', value: 'Unavailable link', inline: false }];
    }
}

module.exports = IU;