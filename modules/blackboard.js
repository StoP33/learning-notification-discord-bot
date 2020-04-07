const request = require('request-promise');
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

                name.length ? resolve(true) : reject(false);
            }
            catch(error) {
                reject(error);
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
                reject({success: false, data: error + ''});
            }
        });
    }
}

module.exports = Blackboard;