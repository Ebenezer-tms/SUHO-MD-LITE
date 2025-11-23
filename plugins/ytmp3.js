const axios = require("axios");
const yts = require("yt-search");
const fakevCard = require('../lib/fakevcard');

module.exports = {
    pattern: "play",
    desc: "Search and download Spotify/YouTube tracks as playable audio",
    react: "🎧",
    category: "downloader",
    filename: __filename,

    execute: async (conn, mek, m, { from, args, q, reply }) => {
        try {
            const query = q || args.join(" ");
            if (!query) {
                return await conn.sendMessage(from, { 
                    text: "❎ Please provide a song name or YouTube link.\n\nExample:\n.play faded\n.play https://youtube.com/..." 
                }, { quoted: mek });
            }

            // React 🎧
            await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

            let video;
            let isYouTube = query.includes("youtube.com/") || query.includes("youtu.be/");

            if (isYouTube) {
                // Direct YouTube URL
                await conn.sendMessage(from, { text: "🎵 Processing YouTube link..." }, { quoted: mek });
                video = { url: query };
                
                // Try to get video info
                try {
                    const videoId = extractVideoId(query);
                    if (videoId) {
                        const search = await yts({ videoId: videoId });
                        if (search) {
                            video.title = search.title;
                            video.thumbnail = search.thumbnail;
                            video.timestamp = search.timestamp;
                            video.duration = search.duration;
                        }
                    }
                } catch (e) {
                    console.log("Could not fetch YouTube details:", e.message);
                }
            } else {
                // Search query
                await conn.sendMessage(from, { text: `🔍 Searching for: "${query}"...` }, { quoted: mek });
                const search = await yts(query);
                if (!search || !search.videos.length) {
                    return await conn.sendMessage(from, { text: "❌ No results found." }, { quoted: mek });
                }
                video = search.videos[0];
            }

            // Send track info
            await conn.sendMessage(from, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*\n⏱ ${video.timestamp || video.duration || "Unknown"}\n\n⬇️ Downloading audio...`
            }, { quoted: mek });

            // Try different download APIs
            let audioUrl = null;
            let apiUsed = null;

            // API 1: Izumi
            try {
                const izumiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(video.url)}&format=mp3`;
                const response = await axios.get(izumiUrl, { timeout: 30000 });
                if (response?.data?.result?.download) {
                    audioUrl = response.data.result.download;
                    apiUsed = "Izumi";
                }
            } catch (e) {
                console.log("Izumi API failed:", e.message);
            }

            // API 2: Okatsu
            if (!audioUrl) {
                try {
                    const okatsuUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(okatsuUrl, { timeout: 30000 });
                    if (response?.data?.dl) {
                        audioUrl = response.data.dl;
                        apiUsed = "Okatsu";
                    }
                } catch (e) {
                    console.log("Okatsu API failed:", e.message);
                }
            }

            // API 3: David Cyril
            if (!audioUrl) {
                try {
                    const davidUrl = `https://api.davidcyriltech.my.id/youtube?url=${encodeURIComponent(video.url)}`;
                    const response = await axios.get(davidUrl, { timeout: 30000 });
                    if (response?.data?.downloadUrl) {
                        audioUrl = response.data.downloadUrl;
                        apiUsed = "David Cyril";
                    }
                } catch (e) {
                    console.log("David Cyril API failed:", e.message);
                }
            }

            if (!audioUrl) {
                return await conn.sendMessage(from, { 
                    text: "❌ All download APIs failed. Please try again later." 
                }, { quoted: mek });
            }

            // Download thumbnail
            let thumbBuffer = null;
            try {
                const thumbResponse = await axios.get(video.thumbnail, { 
                    responseType: "arraybuffer", 
                    timeout: 10000 
                });
                thumbBuffer = Buffer.from(thumbResponse.data);
            } catch (e) {
                console.log("Thumbnail download failed:", e.message);
            }

            // Send audio
            await conn.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${video.title.replace(/[^\w\s]/gi, '')}.mp3`,
                ptt: false,
                jpegThumbnail: thumbBuffer
            }, { quoted: fakevCard });

        } catch (error) {
            console.error("Play command error:", error);
            await conn.sendMessage(from, { 
                text: `❌ Error: ${error.message}` 
            }, { quoted: mek });
        }
    }
};

function extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}