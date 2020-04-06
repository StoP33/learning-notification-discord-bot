const Blackboard = require('./blackboard');
const cheerio = require('cheerio');
const h2p = require('html2plaintext');

class Notification
{
    constructor(username, password, host = 'https://blackboard.hcmiu.edu.vn')
    {
        this.host = host;
        this.bb = new Blackboard(username, password, host);
        this.loggedIn = false;
    }

    async getNotification()
    {
        try {
            this.loggedIn = await this.bb.login();
            let updates = await this.bb.getUpdates();
            let notices = [];

            if (this.loggedIn) {
                return new Promise(async (resolve, reject) => {
                    let lastKey = Object.keys(updates.data).length;
                    Object.keys(updates.data).forEach(async (key) => {
                        if (updates.data[key].itemSpecificData.notificationDetails.seen === false) {
                            let body = await this.bb.sendRequest({},
                                `${updates.data[key].se_itemUri || '#'}`);
                            let fields = this.getLink(body);

                            notices.push({
                                title:
                                    `${updates.data[key].itemSpecificData.title || 'Unavailable title'} - ${updates.data[key].itemSpecificData.notificationDetails.announcementTitle || 'Unavailable title'}`,
                                description:
                                    `${h2p(updates.data[key].itemSpecificData.contentExtract) || 'Unavailable content'}`,
                                url:
                                    `${process.env.HOST}${updates.data[key].se_itemUri || '#'}`,
                                author:
                                    `${updates.data[key].itemSpecificData.notificationDetails.announcementLastName || 'Anonymous'} ${updates.data[key].itemSpecificData.notificationDetails.announcementFirstName || 'Anonymous'}`,
                                fields: fields,
                                color: '#f50057'
                            });
                        }
                        key >= (lastKey -1) ? resolve({ success: true, data: notices }) : '';
                    });
                });
            }
            return { success: false, data: 'login failed' };
        }
        catch(error) {
            return { success: false, data: error + '' };
        }
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
