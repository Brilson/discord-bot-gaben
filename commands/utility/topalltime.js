const { SlashCommandBuilder } = require("discord.js");
const { request } = require("undici");
const dotenv = require('dotenv');

dotenv.config();

///Helper for converting minutes to hours
const hours = (time) => Number((time / 60).toFixed(0)).toLocaleString();

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
    .setName("topalltime")
    .setDescription("Leaderboards (All-time)"),
  async execute(interaction) {
    const token = process.env.STEAM_TOKEN;
    const stats = [];
    await interaction.deferReply();

    ///API request for the users activity over the past 2 weeks
    for (let i = 0; i < 10; i++) {
      const data = await request(
        `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${token}&steamid=${Object.values(accounts)[i]}&format=json&include_appinfo=true&include_played_free_games=true`,
      );
      const { response } = await data.body.json();
      if (response.game_count > 0) {
        totaltime = 0;
        const game = { name: "", time: 0 };
        for (let j = 0; j < response.games.length; j++) {
          totaltime += response.games[j].playtime_forever;
          if (response.games[j].playtime_forever > game.time) {
            game.name = response.games[j].name;
            game.time = response.games[j].playtime_forever;
          }
        }
        stats.push({
          user: Object.keys(accounts)[i],
          game: game.name,
          time: game.time,
          total: totaltime,
        });
      }
    }

    ///sort the stats array (leaderboard)
    stats.sort((a, b) => b.time - a.time);

    ///Create the embed template
    const embed = {
      color: 47103,
      title: `Leaderboards (All-time)`,
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

    ///List the most played games of each user
    for (i = 0; i < stats.length; i++) {
      embed.fields[0].value += `${i}. **${stats[i].user}** - ${stats[i].game} (${hours(stats[i].time)} hrs)\n`;
    }

    ///List the total playtime of each user
    stats.sort((a, b) => b.total - a.total);
    for (i = 0; i < stats.length; i++) {
      embed.fields[1].value += `${i}. **${stats[i].user}** - ${hours(stats[i].total)} hrs\n`;
    }

    /// Return the completed embed
    await interaction.editReply({ embeds: [embed] });
  },
};
