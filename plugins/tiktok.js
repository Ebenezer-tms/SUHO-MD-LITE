const axios = require("axios");
const fakevCard = require('../lib/fakevcard');

module.exports = {
  pattern: "tiktok",
  desc: "Download TikTok video without watermark",
  react: "🧑‍💻",
  category: "downloader",
  filename: __filename,
  use: ".tiktok <link>",

  execute: async (conn, mek, m, { from, reply, q }) => {

    const sendMessageWithContext = async (text, quoted = mek) => {
      return await conn.sendMessage(from, {
        text: text,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363420267586200@newsletter",
            newsletterName: "SUHO LITE MD",
            serverMessageId: 200
          }
        }
      }, { quoted: fakevCard });
    };

    try {
      if (!q) return await sendMessageWithContext("⚠️ Please provide a TikTok link.");
      if (!q.includes("tiktok.com")) return await sendMessageWithContext("❌ Invalid TikTok link.");

      if (module.exports.react) {
        await conn.sendMessage(from, { react: { text: module.exports.react, key: mek.key } });
      }

      await sendMessageWithContext("⏳ Downloading TikTok video, please wait...");

      const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(q)}`;
      const { data } = await axios.get(apiUrl);

      if (!data.status || !data.data) return await sendMessageWithContext("❌ Failed to fetch TikTok video.");

      const { title, like, comment, share, author, meta } = data.data;
      const videoUrl = meta.media.find(v => v.type === "video")?.org;

      if (!videoUrl) return await sendMessageWithContext("❌ No video found in the TikTok.");

      const caption =
        `🎵 *TikTok Video* 🎵\n\n` +
        `👤 *User:* ${author.nickname} (@${author.username})\n` +
        `📖 *Title:* ${title}\n` +
        `👍 *Likes:* ${like}\n💬 *Comments:* ${comment}\n🔁 *Shares:* ${share}\n\n` +
        `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ *SUHO LITE MD* ⚡`;

      await conn.sendMessage(from, {
        video: { url: videoUrl },
        caption: caption,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363420267586200@newsletter",
            newsletterName: "SUHO LITE MD",
            serverMessageId: 200
          }
        }
      }, { quoted: fakevCard });

    } catch (error) {
      console.error("❌ TikTok Downloader Error:", error);
      await sendMessageWithContext(`⚠️ Error downloading TikTok video:\n${error.message}`);
    }
  }
};
