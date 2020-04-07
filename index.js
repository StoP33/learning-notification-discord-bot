require('dotenv').config();
const Discord = require('discord.js');
const notification = require('./modules/notification');

const username = process.env.ID;
const password = process.env.PASSWORD;
const token = process.env.TOKEN;

const client = new Discord.Client();

client.on('ready', () => {
    console.log('Oke! Code was updated :D');
    client.channels.cache.find(x => x.name === 'blackboard-notification').send('Oke! Code was updated :D');

    let successCounter = 0;
    let errorCounter = 0;
    let blacklist = [];
    setInterval(async () => {
        let notify = new notification(username, password);
        let notices = await notify.getNotSeenNotification();

        if (notices.success) {
            Object.keys(notices.data).forEach(async function (key) {
                if (!blacklist.includes(notices.data[key].id)) {
                    const embed = new Discord.MessageEmbed()
                    .setTitle(notices.data[key].title)
                    .setURL(notices.data[key].url)
                    .setAuthor('From: ' + notices.data[key].author)
                    .setDescription(notices.data[key].description)
                    .addFields(notices.data[key].fields)
                    .setTimestamp()
                    .setColor(notices.data[key].color);
                    let msg = await client.channels.cache.find(x => x.name === 'blackboard-notification').send(embed);
                    msg.pin();
                    blacklist.push(notices.data[key].id);
                }
            });
            successCounter++;
        }
        else {
            client.channels.cache.find(x => x.name === 'errors').send(notices.data);
            errorCounter++;
        }
        client.user.setActivity(`e: ${errorCounter} - s: ${successCounter}`, { type: 'WATCHING' });
    }, 240000);
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