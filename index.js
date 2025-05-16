const { Client, GatewayIntentBits, Partials, Events, Collection } = require('discord.js');
const express = require('express');
const app = express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const PREFIX = '!';
const levels = new Map();
const questions = [
  { question: "Quanto fa 5 + 7?", answer: "12" },
  { question: "Qual è la capitale d’Italia?", answer: "roma" },
  { question: "Quanti secondi ci sono in un minuto?", answer: "60" },
];

function getRandomQuestion() {
  return questions[Math.floor(Math.random() * questions.length)];
}

client.on(Events.ClientReady, () => {
  console.log(`Dolly è online come ${client.user.tag}`);
  setInterval(() => {
    const channel = client.channels.cache.find(c => c.name === "generale");
    if (channel) {
      const q = getRandomQuestion();
      channel.send("@everyone Minigioco! Rispondi entro 3 minuti:
" + q.question);
      const collector = channel.createMessageCollector({ time: 180000 });
      collector.on('collect', msg => {
        if (msg.content.toLowerCase() === q.answer.toLowerCase()) {
          const xp = Math.floor(Math.random() * 10) + 1;
          const userLevel = levels.get(msg.author.id) || 0;
          levels.set(msg.author.id, userLevel + xp);
          msg.reply(`Corretto! Hai guadagnato ${xp} XP. Ora hai ${levels.get(msg.author.id)} XP.`);
          collector.stop();
        }
      });
    }
  }, 600000); // ogni 10 minuti
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;
  const [cmd, ...args] = message.content.slice(PREFIX.length).split(" ");

  if (cmd === "help") {
    message.reply("**Comandi Admin**:
!pulisci
!ban
!kick
!clear
**Comandi Utente**:
!minigiochi
!livello
!a
!ship @utente1 @utente2");
  }

  if (cmd === "a") {
    message.reply("Sono Dolly! Posso fare tanti giochi e aiutarti nel server 'doll marine'!");
  }

  if (cmd === "pulisci" || cmd === "clear") {
    if (!message.member.permissions.has("ManageMessages")) return message.reply("Non hai i permessi.");
    const messages = await message.channel.messages.fetch({ limit: 100 });
    message.channel.bulkDelete(messages);
    message.channel.send("Messaggi cancellati.").then(m => setTimeout(() => m.delete(), 3000));
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has("BanMembers")) return message.reply("Non hai i permessi.");
    const member = message.mentions.members.first();
    if (member) {
      await member.ban();
      message.channel.send(`${member.user.tag} è stato bannato.`);
    }
  }

  if (cmd === "kick") {
    if (!message.member.permissions.has("KickMembers")) return message.reply("Non hai i permessi.");
    const member = message.mentions.members.first();
    if (member) {
      await member.kick();
      message.channel.send(`${member.user.tag} è stato kickato.`);
    }
  }

  if (cmd === "livello") {
    const xp = levels.get(message.author.id) || 0;
    message.reply(`Hai ${xp} XP.`);
  }

  if (cmd === "ship") {
    const [u1, u2] = args;
    if (!u1 || !u2) return message.reply("Devi menzionare due utenti.");
    const aff = Math.floor(Math.random() * 100);
    message.channel.send(`❤️ La compatibilità tra ${u1} e ${u2} è del ${aff}%!`);
  }

  if (cmd === "minigiochi") {
    const q = getRandomQuestion();
    message.channel.send("Minigioco! Rispondi entro 3 minuti:
" + q.question);
    const collector = message.channel.createMessageCollector({ time: 180000 });
    collector.on('collect', msg => {
      if (msg.content.toLowerCase() === q.answer.toLowerCase()) {
        const xp = Math.floor(Math.random() * 10) + 1;
        const userLevel = levels.get(msg.author.id) || 0;
        levels.set(msg.author.id, userLevel + xp);
        msg.reply(`Corretto! Hai guadagnato ${xp} XP. Ora hai ${levels.get(msg.author.id)} XP.`);
        collector.stop();
      }
    });
  }
});

client.on(Events.GuildMemberAdd, member => {
  const channel = member.guild.systemChannel;
  if (channel) {
    channel.send(`Benvenuto ${member.user.username} in ${member.guild.name}! Usa !help per iniziare.`);
  }
});

client.login(process.env.TOKEN);

app.get("/", (_, res) => res.send("Dolly è attiva"));
app.listen(3000);