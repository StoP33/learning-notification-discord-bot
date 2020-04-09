const request = require('request-promise');
const h2p = require('html2plaintext');
const cheerio = require('cheerio');

class Blackboard
{
    constructor(username = '', password = '', host = 'https://blackboard.hcmiu.edu.vn')
    {
        this.username = username;
        this.password = password;
        this.host = host;
        this.jar = request.jar();
        this.token = '';
    }

    sendRequest(formData = {}, pathURI = '/', method = 'get')
    {
        return request({
            uri: this.host + pathURI,
            jar: this.jar,
            method: method,
            formData: formData
        });
    }

    async getToken()
    {
        let body = await this.sendRequest();
        let $ = cheerio.load(body);

        return $('input[name="blackboard.platform.security.NonceUtil.nonce"]').attr('value');
    }

    login()
    {
        return new Promise(async (resolve, reject) => {
            try {
                this.token = await this.getToken();
                let body = await this.sendRequest({
                    'user_id': this.username,
                    'password': this.password,
                    'login': 'login',
                    'action': 'login',
                    'new_loc': '',
                    'blackboard.platform.security.NonceUtil.nonce': this.token
                }, '/webapps/login/', 'post');
                let $ = cheerio.load(body);
                let name = $('#global-nav-link').text();

                name.length ? resolve({ success: true }) : reject({ success: false, data: 'Login failed' });
            }
            catch(error) {
                reject({ success: false, data: error });
            }
        });
    }

    getUpdates()
    {
        return new Promise(async (resolve, reject) => {
            try {
                await this.sendRequest({},
                    '/webapps/streamViewer/streamViewer?cmd=view&streamName=alerts&globalNavigation=false');
                await this.sendRequest({},
                    '/webapps/portal/execute/tabs/tabAction?tab_tab_group_id=_1_1');
                let body = await this.sendRequest({},
                    '/webapps/streamViewer/streamViewer?cmd=loadStream&streamName=alerts&providers=%7B%7D&forOverview=false',
                    'post');
                let body2 = await this.sendRequest({},
                    '/webapps/streamViewer/streamViewer?cmd=loadStream&streamName=alerts&providers=%7B%22bb-announcement%22%3A%7B%22sp_provider%22%3A%22bb-announcement%22%2C%22sp_refreshDate%22%3A1540103692737%2C%22sp_oldest%22%3A1539952002560%2C%22sp_newest%22%3A9007199254740992%7D%2C%22bb_deployment%22%3A%7B%22sp_provider%22%3A%22bb_deployment%22%2C%22sp_refreshDate%22%3A9007199254740992%2C%22sp_oldest%22%3A9007199254740992%2C%22sp_newest%22%3A-1%7D%2C%22mbs-announcement%22%3A%7B%22sp_provider%22%3A%22mbs-announcement%22%2C%22sp_refreshDate%22%3A9007199254740992%2C%22sp_oldest%22%3A9007199254740992%2C%22sp_newest%22%3A-1%2C%22sp_flushAll%22%3Atrue%7D%2C%22bb_ach_stream%22%3A%7B%22sp_provider%22%3A%22bb_ach_stream%22%2C%22sp_refreshDate%22%3A0%2C%22sp_oldest%22%3A9007199254740992%2C%22sp_newest%22%3A-1%7D%7D&forOverview=false&retrieveOnly=true',
                    'post');
                let body3 = await this.sendRequest({},
                    '/webapps/streamViewer/streamViewer?cmd=loadStream&streamName=alerts&providers=%7B%22bb-announcement%22%3A%7B%22sp_provider%22%3A%22bb-announcement%22%2C%22sp_refreshDate%22%3A1540103692737%2C%22sp_oldest%22%3A1539952002560%2C%22sp_newest%22%3A9007199254740992%7D%2C%22bb_deployment%22%3A%7B%22sp_provider%22%3A%22bb_deployment%22%2C%22sp_refreshDate%22%3A9007199254740992%2C%22sp_oldest%22%3A9007199254740992%2C%22sp_newest%22%3A-1%7D%2C%22mbs-announcement%22%3A%7B%22sp_provider%22%3A%22mbs-announcement%22%2C%22sp_refreshDate%22%3A9007199254740992%2C%22sp_oldest%22%3A9007199254740992%2C%22sp_newest%22%3A-1%2C%22sp_flushAll%22%3Atrue%7D%2C%22bb_ach_stream%22%3A%7B%22sp_provider%22%3A%22bb_ach_stream%22%2C%22sp_refreshDate%22%3A0%2C%22sp_oldest%22%3A9007199254740992%2C%22sp_newest%22%3A-1%7D%7D&forOverview=false&retrieveOnly=true',
                    'post');
                let data = JSON.parse(body3);

                Object.keys(data).length === 0
                    ? reject({success: false, data: 'Can not get updates'})
                    : resolve({success: true, data: data.sv_streamEntries});
            }
            catch(error) {
                reject({success: false, data: error });
            }
        });
    }

    getAllBlackboardNotification()
    {
        return new Promise(async (resolve, reject) => {
            try {
                let loggedIn = await this.login();
                if(!loggedIn.success) resolve({ success: false, data: 'Login failed' });
                let { success, data} =  await this.getUpdates();
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
                if(!notifications.success) reject({ success: false, data: notifications.data });
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
                let html = await this.sendRequest({},
                    `${notification.se_itemUri || '#'}`);
                let links = this.getLink(html);
                resolve({ success: true, data: {
                    id: notification.se_id,
                    title: (notification.itemSpecificData.title || '')
                            + (notification.itemSpecificData.notificationDetails.announcementTitle || ''),
                    description: h2p(notification.itemSpecificData.contentExtract) || '',
                    url: this.host + notification.se_itemUri,
                    author: (notification.itemSpecificData.notificationDetails.announcementLastName || 'Anonymous - ')
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
                            name: 'Link title: ' + $(element).text(),
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

module.exports = Blackboard;