const axios = require("axios");
const fakevCard = require('../lib/fakevcard');

module.exports = {
  pattern: "ytmp4",
  desc: "Download YouTube video in MP4 format using David Cyril API",
  react: "🎬",
  category: "downloader",
  filename: __filename,

  execute: async (conn, mek, m, { from, q, reply }) => {
    // Helper function to send messages with contextInfo
    const sendMessageWithContext = async (text, quoted = mek) => {
      return await conn.sendMessage(from, {
        text: text,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363402507750390@newsletter",
            newsletterName: "ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ🪀",
            serverMessageId: 200
          }
        }
      }, { quoted: fakevCard });
    };

    try {
      if (!q) return await sendMessageWithContext("❌ Please provide a YouTube video link.");

      // React 🎬
      if (module.exports.react) {
        await conn.sendMessage(from, { react: { text: module.exports.react, key: mek.key } });
      }

      await sendMessageWithContext("⏳ Downloading YouTube video, please wait...");

      // API call
      const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(q)}&apikey=`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.result || !data.result.download_url) {
        return await sendMessageWithContext("❌ Failed to fetch YouTube video from the API.");
      }

      const { download_url, title, thumbnail, quality, duration } = data.result;

      const caption = `🎬 *YouTube Video*\n\n` +
                      `📖 *Title:* ${title || "Unknown"}\n` +
                      `🎚️ *Quality:* ${quality || "Unknown"}\n` +
                      `⏱️ *Duration:* ${duration ? duration + "s" : "Unknown"}\n\n` +
                      `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ʟɪᴛᴇ`;

      // Prepare thumbnail buffer if exists
      let thumbBuffer;
      if (thumbnail) {
        try {
          const res = await axios.get(thumbnail, { responseType: "arraybuffer" });
          thumbBuffer = Buffer.from(res.data);
        } catch {}
      }

      // Send the video with contextInfo
      await conn.sendMessage(from, {
        video: { url: download_url },
        caption: caption,
        jpegThumbnail: thumbBuffer,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363402507750390@newsletter",
            newsletterName: "ᴍᴀʟᴠɪɴ ᴛᴇᴄʜ🪀",
            serverMessageId: 200
          }
        }
      }, { quoted: fakevCard });

    } catch (error) {
      console.error("❌ YouTube Downloader Error:", error);
      await sendMessageWithContext(`⚠️ Error downloading YouTube video: ${error.message}`);
    }
  }
};const axios = require('axios');
const fakevCard = require('../lib/fakevCard');

module.exports = {
    pattern: "ytplay",
    desc: "Play YouTube audio",  // Added desc property
    react: '🎵', 
    category: "downloader",
    filename: __filename,
    
    execute: async (conn, mek, m, { from, args, q, reply }) => {
        try {
            const query = q || args.join(' ').trim();
            if (!query) {
                return await conn.sendMessage(from, { 
                    text: "❌ Please provide a song name!\n\nExample: .ytplay faded" 
                }, { quoted: mek });
            }

            // React 🎵
            await conn.sendMessage(from, { react: { text: "🎵", key: mek.key } });

            await conn.sendMessage(from, { text: "🔍 Searching for audio..." }, { quoted: mek });

            const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?query=${encodeURIComponent(query)}`;
            const { data } = await axios.get(apiUrl, { timeout: 30000 });

            if (!data || !data.result || !data.result.download_url) {
                return await conn.sendMessage(from, { 
                    text: "❌ No audio found for that search." 
                }, { quoted: mek });
            }

            const { download_url, title, quality, duration } = data.result;

            const caption = `🎵 *Song Found!*\n\n` +
                            `📌 *Title:* ${title || 'Unknown'}\n` +
                            `⏳ *Duration:* ${duration || 'Unknown'}\n` +
                            `🎶 *Quality:* ${quality || 'Unknown'}\n\n` +
                            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ʟɪᴛᴇ`;

            await conn.sendMessage(from, {
                audio: { url: download_url },
                mimetype: 'audio/mp4', 
                fileName: `${(title || 'audio').replace(/[^\w\s]/gi, '')}.mp3`,
                caption: caption
            }, { quoted: fakevCard });

        } catch (error) {
            console.error('YTPLAY ERROR:', error);
            await conn.sendMessage(from, { 
                text: "❌ Failed to fetch audio. Please try again later." 
            }, { quoted: mek });
        }
    }
};