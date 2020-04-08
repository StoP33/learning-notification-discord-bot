require('dotenv').config();
const Discord = require('discord.js');
const IU = require('./modules/iu');

const username = process.env.ID;
const password = process.env.PASSWORD;
const token = process.env.TOKEN;
const cycle = process.env.CYCLE;

const client = new Discord.Client();
const iu = new IU();

var blacklist = [];

client.on('ready', () => {
    setInterval(async () => {
        iu.handleBlackboardNotification(username, password, async (notification) => {
            try {
                if(!blacklist.includes(notification.data.id)) {
                    blacklist.push(notification.data.id);
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
                }
            } catch(error) {
                client.channels.cache.find(x => x === 'errors').send(error + '');
            }
        });
    }, cycle*1000);
});

client.on('message', async (message) => {
    if (message.content === '!die') {
        message.channel.send('I still live');
    }
});

client.login(token);