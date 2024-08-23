const { SlashCommandBuilder } = require("discord.js");
const { request } = require("undici");
const dotenv = require('dotenv');

dotenv.config();

///Helper for converting minutes to hours
const hours = (time) => (time / 60).toFixed(1);
const playerchoices = [
  { name: "Boyd", value: "76561197962852172" },
  { name: "Brilson", value: "76561197989520008" },
  { name: "Chrig", value: "76561197985040795" },
  { name: "Coach", value: "76561198127934838" },
  { name: "flipmechips", value: "76561198056045860" },
  { name: "Kage", value: "76561197986241297" },
  { name: "Mattiatus", value: "76561198069137067" },
  { name: "Slappa", value: "76561198006727160" },
  { name: "tallperry", value: "76561198033193162" },
  { name: "TeddyRolls", value: "76561197980973928" },
];

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("games")
    .setDescription("Shows mutually owned games.")
    .addStringOption((option) =>
      option
        .setName("user1")
        .setDescription("The username of the user you want to lookup")
        .setRequired(true)
        .addChoices(
          { name: "Boyd", value: "76561197962852172" },
          { name: "Brilson", value: "76561197989520008" },
          { name: "Chrig", value: "76561197985040795" },
          { name: "Coach", value: "76561198127934838" },
          { name: "flipmechips", value: "76561198056045860" },
          { name: "Kage", value: "76561197986241297" },
          { name: "Mattiatus", value: "76561198069137067" },
          { name: "slappa", value: "76561198006727160" },
          { name: "tallperry", value: "76561198033193162" },
          { name: "TeddyRolls", value: "76561197980973928" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("user2")
        .setDescription("The username of the user you want to lookup")
        .setRequired(true)
        .addChoices(playerchoices),
    )
    .addStringOption((option) =>
      option
        .setName("user3")
        .setDescription("The username of the user you want to lookup")
        .setRequired(false)
        .addChoices(playerchoices),
    )
    .addStringOption((option) =>
      option
        .setName("user4")
        .setDescription("The username of the user you want to lookup")
        .setRequired(false)
        .addChoices(playerchoices),
    )
    .addStringOption((option) =>
      option
        .setName("user5")
        .setDescription("The username of the user you want to lookup")
        .setRequired(false)
        .addChoices(playerchoices),
    ),

  async execute(interaction) {
    const users = [];
    for (let i = 0; i < 5; i++) {
      if (interaction.options.getString(`user${i}`) != null) {
        users.push(interaction.options.getString(`user${i}`));
      }
    }
    const token = process.env.STEAM_TOKEN;
    const container = [];
    await interaction.deferReply(); // Defer the reply to give more time for processing

    ///API request for the users all-time stats
    for (let i = 0; i < users.length; i++) {
      const data = await request(
        `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${token}&steamid=${users[i]}&format=json&include_appinfo=true&include_played_free_games=true`,
      );
      const { response } = await data.body.json();
      ///Create an array of the games the user owns
      const player = [];
      for (let j = 0; j < response.games.length; j++) {
        if (response.games[j].playtime_forever > 0) {
          player.push({
            name: response.games[j].name,
            time: response.games[j].playtime_forever,
          });
        }
      }
      container.push(player);
    }

    ///Map the names of the games
    allGames = [];
    const games1 = container[0].map((game) => game.name);

    for (let i = 0; i < users.length; i++) {
      const games = container[i].map((game) => game.name);
      allGames.push(games);
    }

    ///Filter for common games
    const commonGames = games1.filter((game) =>
      allGames.every((games) => games.includes(game)),
    );
    ///Alphabetize the list of common games
    commonGames.sort();

    ///Create the embed template
    const embed = {
      color: 47103,
      title: `**Shared Games Checker**`,
      fields: [
        {
          name: `**__Games Shared (${commonGames.length} Total)__**`,
          value: ``,
          inline: true,
        },
        {
          name: `**__Users__**`,
          value: ``,
          inline: true,
        },
      ],
    };

    ///List the top 5 most played games of the last 2 weeks for the user
    const loopCount = Math.min(commonGames.length, 50);
    for (let i = 0; i < loopCount; i++) {
      if (!commonGames) {
        embed.fields[0].value = `(No shared games)`;
      } else {
        embed.fields[0].value += `${commonGames[i]}\n`;
      }
    }

    for (let i = 0; i < users.length; i++) {
      embed.fields[1].value += `- ${getKeyByValue(accounts, users[i])}\n`;
    }

    /// Return the completed embed
    await interaction.editReply({ embeds: [embed] });
  },
};
