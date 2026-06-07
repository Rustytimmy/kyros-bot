const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const TOKEN = 'MTUxMjM0MjAxODM5ODA5MzM4Mg.GdDzW7.YNY1xfCxFplDzYYCf5XL4moN0Gb8H45mEEq9ks';
const GUILD_ID = '1260115078246567936';
const DAYS = 30;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);
  const members = await guild.members.fetch();
  const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  const channels = guild.channels.cache.filter(c => c.isTextBased());

  // Collect last message time per user across all channels
  const lastSeen = new Map();

  for (const [, channel] of channels) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      for (const [, msg] of messages) {
        if (msg.author.bot) continue;
        const prev = lastSeen.get(msg.author.id) || 0;
        if (msg.createdTimestamp > prev) {
          lastSeen.set(msg.author.id, msg.createdTimestamp);
        }
      }
    } catch {}
  }

  // Kick anyone not seen in 30 days
  let kicked = 0;
  for (const [id, member] of members) {
    if (member.user.bot) continue;
    const seen = lastSeen.get(id) || 0;
    if (seen < cutoff) {
      try {
        await member.kick(`Inactive for ${DAYS}+ days`);
        console.log(`Kicked: ${member.user.tag}`);
        kicked++;
      } catch (e) {
        console.log(`Skipped ${member.user.tag}: ${e.message}`);
      }
    }
  }

  console.log(`Done. Kicked ${kicked} members.`);
  client.destroy();
});

client.login(TOKEN);
client.login(TOKEN).catch(console.error);