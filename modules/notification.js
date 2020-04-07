const Blackboard = require('./blackboard');
const cheerio = require('cheerio');
const h2p = require('html2plaintext');

class Notification
{
    constructor(username, password, host = 'https://blackboard.hcmiu.edu.vn')
    {
        this.host = host;
        this.bb = new Blackboard(username, password, host);
    }

    async getAllNotification()
    {
        try {
            let loggedIn = await this.bb.login();
            let { data } = await this.bb.getUpdates();

            if (loggedIn) return { success: true, data: data };
            return { success: false, data: 'login failed' };
        }
        catch(error) {
            return { success: false, data: error + '' };
        }
    }

    async getNotSeenNotification() {
        let { success, data } = await this.getAllNotification();

        if (!success) return { success: false, data: data };

        let notification = [];
        let blacklist = [];
        return new Promise(async (resolve, reject) => {
            Object.keys(data).forEach(async (key) => {
                if (data[key].itemSpecificData.notificationDetails.seen === false) {
                    let body = await this.bb.sendRequest({},
                        `${data[key].se_itemUri || '#'}`);
                    let fields = this.getLink(body);

                    notification.push({
                        id: data[key].se_id,
                        title:
                            `${data[key].itemSpecificData.title || 'Unavailable title'} - ${data[key].itemSpecificData.notificationDetails.announcementTitle || 'Unavailable title'}`,
                        description:
                            `${h2p(data[key].itemSpecificData.contentExtract) || 'Unavailable content'}`,
                        url:
                            `${process.env.HOST}${data[key].se_itemUri || '#'}`,
                        author:
                            `${data[key].itemSpecificData.notificationDetails.announcementLastName || 'Anonymous'} ${data[key].itemSpecificData.notificationDetails.announcementFirstName || 'Anonymous'}`,
                        fields: fields,
                        color: '#f50057'
                    });
                    blacklist.push(data[key].se_id);
                }
            });
            setTimeout(() => {resolve({
                success: true,
                data: notification,
                blacklist: blacklist
            })}, 120000);
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
            : { name: 'Unavailable link', value: 'Unavailable link', inline: false };
    }
}

module.exports = Notification;