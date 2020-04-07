require('dotenv').config();
const Discord = require('discord.js');
const IU = require('./modules/iu');

const username = process.env.ID;
const password = process.env.PASSWORD;
const token = process.env.TOKEN;
const cycle = process.env.CYCLE;

const client = new Discord.Client();

client.on('ready', () => {
    console.log('Oke! Code was updated :D');
    client.channels.cache.find(x => x.name === 'blackboard-notification').send('Oke! Code was updated :D');

    let successCounter = 0;
    let errorCounter = 0;
    let blacklist = [];
    setInterval(async () => {
        let iu = new IU(username, password);
        let notifcations = await iu.getUnseenBlackboardNotification();

        if (notifcations.success) {
            Object.values(notifcations.data).forEach(async (value) => {
                try {
                    if(!blacklist.includes(value.se_id)) {
                        let notification = await iu.filterUnseenBlackboardNotification(value);
                        const embed = new Discord.MessageEmbed()
                            .setTitle(notification.data.title)
                            .setURL(notification.data.url)
                            .setAuthor('From: ' + notification.data.author)
                            .setDescription(notification.data.description)
                            .addFields(notification.data.fields)
                            .setTimestamp()
                            .setColor(notification.data.color);
                        let msg = await client.channels.cache.find(x => x.name === 'blackboard-notification').send(embed);
                        msg.pin();
                        blacklist.push(notification.data.id);
                    }
                } catch(error) {
                    client.channels.cache.find(x => x.name === 'errors').send(error + '');
                }
            });
            successCounter++;
        } else {
            client.channels.cache.find(x => x.name === 'errors').send(notices.data);
            errorCounter++;
        }
        client.user.setActivity(`e: ${errorCounter} - s: ${successCounter}`, { type: 'WATCHING' });
    }, cycle*1000);
});

client.on('message', async (message) => {
    if (message.content === '!die') {
        message.channel.send('I still live');
    }
    else if (message.content === '!test') {
        message.channel.send('!test con cac');
    }
});

client.login(token);