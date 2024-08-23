const { SlashCommandBuilder } = require("discord.js");
const { request } = require("undici");
const dotenv = require('dotenv');

dotenv.config();

///Helper for converting minutes to hours
const hours = (time) => (time / 60).toFixed(1);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shows user's Steam stats.")
    .addStringOption((option) =>
      option
        .setName("user")
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
    ),
  async execute(interaction) {
    const token = process.env.STEAM_TOKEN;
    const user = interaction.options.getString("user");
    ///API request for the users activity over the past 2 weeks
    const data = await request(
      `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${token}&steamid=${user}&format=json`,
    );
    const { response: recentResponse } = await data.body.json();

    ///API request for the users all-time stats
    const alldata = await request(
      `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${token}&steamid=${user}&format=json&include_appinfo=true&include_played_free_games=true`,
    );
    const { response: alltimeResponse } = await alldata.body.json();
    const game = [];
    if (alltimeResponse.game_count > 0) {
      for (let j = 0; j < alltimeResponse.games.length; j++) {
        ///Needs to be improved to only create an array of 5 most played games. Currently puts too many games in
        if (alltimeResponse.games[j].playtime_forever > 60) {
          game.push({
            name: alltimeResponse.games[j].name,
            time: alltimeResponse.games[j].playtime_forever,
          });
        }
      }
    }
    ///API request for the users account details
    const userdata = await request(
      `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${token}&steamids=${user}`,
    );
    const { response: userResponse } = await userdata.body.json();
    const player = userResponse.players[0];

    ///Create the embed template
    const embed = {
      color: 47103,
      title: `${player.personaname}'s Steam Profile`,
      url: player.profileurl,
      thumbnail: {
        url: player.avatarfull,
      },
      fields: [
        {
          name: "Most Played (Last 2 Weeks)",
          value: ``,
          inline: true,
        },
        {
          name: "Most Played (All-time)",
          value: ``,
          inline: true,
        },
      ],
    };

    ///List the top 5 most played games of the last 2 weeks for the user
    for (i = 0; i < 5; i++) {
      if (!recentResponse.games) {
        embed.fields[0].value = `(No games played in the last 2 weeks)`;
      } else if (!recentResponse.games[i]) {
        break;
      } else {
        embed.fields[0].value += `${i}. ${recentResponse.games[i].name} (${hours(recentResponse.games[i].playtime_2weeks)} hrs)\n`;
      }
    }

    ///List the top 5 most played games of the all-time for the user
    game.sort((a, b) => b.time - a.time);
    for (i = 0; i < 5; i++) {
      embed.fields[1].value += `${i}. ${game[i].name} (${hours(game[i].time)} hrs)\n`;
    }

    ///Calculate the users total playtime over the last 2 weeks
    /*
    totalHours = 0;
    for (i = 0; i < recentResponse.games.length; i++) {
      totalHours += recentResponse.games[i].playtime_2weeks;
    }
    embed.fields[2].value = `${hours(totalHours)} hrs`;
    */

    /// Return the completed embed
    await interaction.reply({ embeds: [embed] });
  },
};
