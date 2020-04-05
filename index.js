require('dotenv').config();
const Discord = require('discord.js');
const notification = require('./modules/notification');

const username = process.env.ID;
const password = process.env.PASSWORD;
const token = process.env.TOKEN;

const client = new Discord.Client();

client.on('ready', () => {
    console.log('Successful restart :D');
    client.channels.cache.find(x => x.name === 'blackboard-notification').send('Successful restart :D');

    let successCounter = 0;
    let errorCounter = 0;
    setInterval(async () => {
        let notify = new notification(username, password);
        let notices = await notify.getNotification();

        if (notices.success) {
            Object.keys(notices.data).forEach(function (key) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(notices.data[key].title)
                    .setURL(notices.data[key].url)
                    .setAuthor('From: ' + notices.data[key].author)
                    .setDescription(notices.data[key].description)
                    .addFields(notices.data[key].fields)
                    .setTimestamp()
                    .setColor(notices.data[key].color);
                client.channels.cache.find(x => x.name === 'blackboard-notification').send(embed);
            });
            successCounter++;
        }
        else {
            //client.channels.cache.find(x => x.name === 'blackboard-notification').send(notices.data);
            console.log(notices.data);
            errorCounter++;
        }
        client.user.setActivity(`e: ${errorCounter} - s: ${successCounter}`, { type: 'WATCHING' });
    }, 300000);
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