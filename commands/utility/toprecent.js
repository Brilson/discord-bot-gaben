const { SlashCommandBuilder } = require("discord.js");
const { request } = require("undici");
const dotenv = require('dotenv');

dotenv.config();

///Helper for converting minutes to hours
const hours = (time) => (time / 60).toFixed(1);

accounts = {
  Boyd: "76561197962852172",
  Brilson: "76561197989520008",
  Chrig: "76561197985040795",
  Coach: "76561198127934838",
  flipmechips: "76561198056045860",
  Kage: "76561197986241297",
  Mattiatus: "76561198069137067",
  Slappa: "76561198006727160",
  tallperry: "76561198033193162",
  TeddyRolls: "76561197980973928",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("toprecent")
    .setDescription("Leadboards (Previous 2 weeks)"),
  async execute(interaction) {
    const token = process.env.STEAM_TOKEN;
    const stats = [];
    await interaction.deferReply();

    ///API request for the users activity over the past 2 weeks
    for (let i = 0; i < 10; i++) {
      const data = await request(
        `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${token}&steamid=${Object.values(accounts)[i]}&format=json`,
      );
      const { response } = await data.body.json();
      if (response.total_count > 0) {
        ///Calculate the total time played for the user
        total = 0;
        for (let j = 0; j < response.games.length; j++) {
          total += response.games[j].playtime_2weeks;
        }
        //Create a new object in the stats array for the player
        stats.push({
          user: Object.keys(accounts)[i],
          game: response.games[0].name,
          time: response.games[0].playtime_2weeks,
          total: total,
        });
      }
    }

    ///sort the stats array (leaderboard)
    stats.sort((a, b) => b.time - a.time);

    ///Create the embed template
    const embed = {
      color: 47103,
      title: `Leaderboards (Past 2 Weeks)`,
      fields: [
        {
          name: "__Single Game__",
          value: ``,
          inline: true,
        },
        {
          name: "__Total__",
          value: ``,
          inline: true,
        },
      ],
    };

    ///Rank the players by their most played game over the last 2 weeks
    for (i = 0; i < stats.length; i++) {
      embed.fields[0].value += `${i}. **${stats[i].user}** - ${stats[i].game} (${hours(stats[i].time)} hrs)\n`;
    }
    ///Rank the players by total playtime over the last 2 weeks
    stats.sort((a, b) => b.total - a.total);
    for (i = 0; i < stats.length; i++) {
      embed.fields[1].value += `${i}. **${stats[i].user}** - ${hours(stats[i].total)} hrs\n`;
    }

    /// Return the completed embed
    await interaction.editReply({ embeds: [embed] });
  },
};
