// === convert-commands.js ===
const { fetchJson } = require('../lib/functions2');
const { fakevCard } = require('../lib/fakevcard');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');

const API_KEYS = [
  '40dfb24c7b48ba51487a9645abf33148',
  '4a9c3527b0cd8b12dd4d8ab166a0f592',
  '0e2b3697320c339de00589478be70c48',
  '7b46d3cddc9b67ef690ed03dce9cb7d5'
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = [
  {
    pattern: 'url',
    desc: 'Convert an image to a URL using ImgBB',
    category: 'convert',
    react: '🔄',
    filename: __filename,
    use: '.tourl (reply to an image)',
    execute: async (conn, mek, m, { from, args, reply }) => {
      try {
        const quoted = m.quoted || m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime || !mime.startsWith('image')) {
          return reply('❌ Please reply to an image!');
        }

        const buffer = await quoted.download();
        if (!buffer || buffer.length === 0) {
          return reply('❌ Failed to download image or image is empty.');
        }

        const filePath = path.join(os.tmpdir(), `malvin_${Date.now()}.jpg`);
        fs.writeFileSync(filePath, buffer);

        let imageUrl, lastError;
        for (const apiKey of API_KEYS) {
          try {
            const form = new FormData();
            form.append('image', buffer.toString('base64'));
            
            const res = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, null, {
              params: {
                key: apiKey,
                image: buffer.toString('base64')
              },
              timeout: 30000
            });

            if (res.data?.data?.url) {
              imageUrl = res.data.data.url;
              break;
            }
          } catch (err) {
            lastError = err;
            console.error(`ImgBB key failed [${apiKey}]:`, err.message);
            continue;
          }
        }

        // Cleanup temp file
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}

        if (!imageUrl) {
          return reply(`❌ All ImgBB API keys failed. Last error: ${lastError?.message || 'Unknown error'}`);
        }

        await conn.sendMessage(from, {
          text: `
✅ Image Uploaded Successfully!

📂 File Size: ${formatBytes(buffer.length)}
🔗 URL: ${imageUrl}

> © Powered by Malvin Lite
          `.trim()
        }, { quoted: fakevCard });

      } catch (e) {
        console.error('tourl error:', e);
        return reply(`❌ Error: ${e.message || 'Unknown error'}`);
      }
    }
  },
  {
    pattern: 'cuttly2',
    desc: 'Shorten URLs using Cutt.ly service',
    category: 'tools',
    react: '🔗',
    filename: __filename,
    use: '.cuttly2 url',
    execute: async (conn, mek, m, { from, args, reply }) => {
      try {
        if (!args.length) {
          return reply('❌ Please provide a URL. Example: .cuttly2 https://google.com');
        }

        let url = args[0];
        // Ensure URL has protocol
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }

        const apiUrl = `https://api.botcahx.eu.org/api/linkshort/cuttly?link=${encodeURIComponent(url)}&apikey=botcahx`;
        
        const result = await fetchJson(apiUrl);
        
        if (!result?.status || !result?.result) {
          return reply('❌ Failed to shorten URL. Please check your URL and try again.');
        }

        await conn.sendMessage(from, {
          text: `
🔗 URL Shortened!

📌 Original: ${url}
🔗 Shortened: ${result.result}

> Powered by Cutt.ly
          `.trim()
        }, { quoted: fakevCard });

      } catch (e) {
        console.error('cuttly2 error:', e);
        return reply(`❌ Error: ${e.message || 'Failed to shorten URL'}`);
      }
    }
  },
  {
    pattern: 'url2',
    desc: 'Upload media to Catbox and return a direct URL',
    category: 'convert',
    react: '📤',
    filename: __filename,
    use: '.tourl2 (reply to media)',
    execute: async (conn, mek, m, { from, args, reply }) => {
      try {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!mime) {
          return reply('❌ Please reply to an image, audio, or video.');
        }

        const buffer = await q.download();
        if (!buffer || buffer.length === 0) {
          return reply('❌ Failed to download media or media is empty.');
        }

        // Better extension detection
        let extension = '.bin';
        if (mime.includes('image/jpeg') || mime.includes('image/jpg')) extension = '.jpg';
        else if (mime.includes('image/png')) extension = '.png';
        else if (mime.includes('image/gif')) extension = '.gif';
        else if (mime.includes('image/webp')) extension = '.webp';
        else if (mime.includes('video')) extension = '.mp4';
        else if (mime.includes('audio')) {
          // Handle voice notes (usually ogg) and other audio
          if (mime.includes('ogg')) extension = '.ogg';
          else extension = '.mp3';
        }

        const tmpPath = path.join(os.tmpdir(), `catbox_${Date.now()}${extension}`);
        fs.writeFileSync(tmpPath, buffer);

        const form = new FormData();
        form.append('fileToUpload', fs.createReadStream(tmpPath));
        form.append('reqtype', 'fileupload');

        const res = await axios.post('https://catbox.moe/user/api.php', form, {
          headers: form.getHeaders(),
          timeout: 60000
        });

        // Cleanup temp file
        try {
          fs.unlinkSync(tmpPath);
        } catch (e) {}

        if (!res.data || typeof res.data !== 'string') {
          throw new Error('Upload failed - no URL returned from Catbox');
        }

        const type = mime.includes('image') ? 'Image' :
                     mime.includes('video') ? 'Video' :
                     mime.includes('audio') ? 'Audio' : 'File';

        await conn.sendMessage(from, {
          text: `
✅ ${type} Uploaded!

📁 Size: ${formatBytes(buffer.length)}
🔗 URL: ${res.data}

> © Powered by Malvin Lite
          `.trim()
        }, { quoted: fakevCard });

      } catch (e) {
        console.error('tourl2 error:', e);
        // Cleanup on error
        try {
          const tmpPath = path.join(os.tmpdir(), `catbox_${Date.now()}*`);
          // Remove any leftover temp files
          const files = fs.readdirSync(os.tmpdir());
          files.forEach(file => {
            if (file.startsWith('catbox_')) {
              try {
                fs.unlinkSync(path.join(os.tmpdir(), file));
              } catch (e) {}
            }
          });
        } catch (cleanupError) {}
        
        return reply(`❌ Error: ${e.message || 'Failed to upload media'}`);
      }
    }
  },
  {
    pattern: 'docanalyze',
    desc: 'Upload document and ask AI about its contents',
    category: 'convert',
    react: '📄',
    filename: __filename,
    use: '.docanalyze [your question] (reply to doc)',
    execute: async (conn, mek, m, { from, args, reply }) => {
      try {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!mime || !/pdf|word|doc|openxml|text|plain/i.test(mime)) {
          return reply('❌ Please reply to a PDF, Word document, or text file.');
        }

        const question = args.join(' ') || 'Summarize this document';
        const buffer = await q.download();
        
        if (!buffer || buffer.length === 0) {
          return reply('❌ Failed to download document.');
        }

        let extension = '.txt';
        if (mime.includes('pdf')) extension = '.pdf';
        else if (mime.includes('word') || mime.includes('doc')) {
          if (mime.includes('openxml')) extension = '.docx';
          else extension = '.doc';
        }

        const tmpPath = path.join(os.tmpdir(), `doc_${Date.now()}${extension}`);
        fs.writeFileSync(tmpPath, buffer);

        const form = new FormData();
        form.append('fileToUpload', fs.createReadStream(tmpPath));
        form.append('reqtype', 'fileupload');

        const catboxRes = await axios.post('https://catbox.moe/user/api.php', form, {
          headers: form.getHeaders(),
          timeout: 60000
        });

        // Cleanup temp file
        try {
          fs.unlinkSync(tmpPath);
        } catch (e) {}

        if (!catboxRes.data) {
          throw new Error('Failed to upload document to Catbox');
        }

        const docUrl = catboxRes.data;
        const encodedQ = encodeURIComponent(question);
        const encodedUrl = encodeURIComponent(docUrl);
        
        const geminiRes = await fetchJson(`https://bk9.fun/ai/GeminiDocs?q=${encodedQ}&url=${encodedUrl}`);

        const aiResponse = geminiRes?.BK9 || geminiRes?.response || geminiRes?.answer || 'No analysis available.';

        await conn.sendMessage(from, {
          text: `
📄 Document Analysis

❓ Question: ${question}
🔗 Document: ${docUrl}

🧠 AI Response:
${aiResponse}

> © Powered by Malvin Lite
          `.trim()
        }, { quoted: fakevCard });

      } catch (e) {
        console.error('docanalyze error:', e);
        return reply(`❌ Error: ${e.message || 'Failed to analyze document'}`);
      }
    }
  },
  {
    pattern: 'gofile',
    desc: 'Upload files to GoFile.io',
    category: 'convert',
    react: '📤',
    filename: __filename,
    use: '.gofile (reply to file)',
    execute: async (conn, mek, m, { from, args, reply }) => {
      try {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!mime) {
          return reply('❌ Please send or reply to a file to upload!');
        }

        // Check file size (100MB limit)
        const fileLength = q.msg?.fileLength || buffer?.length;
        if (fileLength > 100 * 1024 * 1024) {
          return reply('❌ File size too large! Maximum 100 MB.');
        }

        const buffer = await q.download();
        if (!buffer || buffer.length === 0) {
          return reply('❌ Failed to download file.');
        }

        const fileName = q.msg?.fileName || `file_${Date.now()}.${mime.split('/')[1] || 'bin'}`;
        
        const form = new FormData();
        form.append('file', buffer, {
          filename: fileName,
          contentType: mime
        });

        // First get the server
        const serverRes = await axios.get('https://api.gofile.io/getServer');
        if (serverRes.data.status !== 'ok') {
          throw new Error('Failed to get GoFile server');
        }

        const server = serverRes.data.data.server;
        
        const response = await axios.post(`https://${server}.gofile.io/uploadFile`, form, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...form.getHeaders()
          },
          timeout: 60000
        });

        const result = response.data;

        if (result.status !== 'ok' || !result.data) {
          return reply('❌ Failed to upload to GoFile.io.');
        }

        await conn.sendMessage(from, {
          text: `
📤 File Uploaded to GoFile.io!

📁 File: ${fileName}
🔗 Download: ${result.data.downloadPage}
📊 Size: ${formatBytes(buffer.length)}

💡 Note: Files may be deleted after inactivity.
          `.trim()
        }, { quoted: fakevCard });

      } catch (e) {
        console.error('gofile error:', e);
        return reply(`❌ Error: ${e.message || 'Failed to upload file'}`);
      }
    }
  }
];