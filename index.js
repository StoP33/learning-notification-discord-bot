const Discord = require('discord.js');
const notification = require('./modules/notification');

const username = process.env.ID;
const password = process.env.PASSWORD;
const token = process.env.TOKEN;

const client = new Discord.Client();

client.on('ready', () => {
    console.log('Ok i\'m ready!');
    client.channels.cache.find(x => x.name === 'blackboard').send('Ok i\'m ready!');
    setInterval(async () => {
        let notices = await notification.getNotification(username, password);

        if (notices.success) {
            Object.keys(notices.data).forEach(function (key) {
                const embed = new Discord.MessageEmbed()
                    .setTitle(notices.data[key].title)
                    .setURL(notices.data[key].link)
                    .setAuthor(notices.data[key].author)
                    .setDescription(notices.data[key].description)
                    .setTimestamp()
                    .setColor(notices.data[key].color);
                client.channels.cache.find(x => x.name === 'blackboard').send(embed);
            });
        }
        else {
            //client.channels.cache.find(x => x.name === 'blackboard').send(notices.data);
            console.log('hihi');
        }
    }, 300000);
});

client.on('message', async (message) => {
    if (message.content === '!die') {
        message.channel.send('I still live');
    }
})

client.login(token);
