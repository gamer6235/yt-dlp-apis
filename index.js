const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ status: "success", message: "YouTube Downloader API is active!" });
});

app.get('/api/download', (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ status: "error", message: "YouTube URL parameter required." });
    }

    // Android client & user-agent bypass
    const command = `yt-dlp -J --extractor-args "youtube:player_client=android,web" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${videoUrl}"`;

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ status: "error", message: "Failed to process video", details: stderr || error.message });
        }

        try {
            const output = JSON.parse(stdout);
            
            const formats = (output.formats || []).map(f => ({
                format_id: f.format_id,
                ext: f.ext,
                resolution: f.resolution || `${f.width || ''}x${f.height || ''}`,
                filesize_mb: f.filesize ? parseFloat((f.filesize / (1024 * 1024)).toFixed(2)) : null,
                has_audio: f.acodec !== 'none',
                has_video: f.vcodec !== 'none',
                download_url: f.url
            }));

            res.json({
                status: "success",
                title: output.title,
                duration: output.duration,
                thumbnail: output.thumbnail,
                uploader: output.uploader,
                formats: formats
            });
        } catch (parseError) {
            res.status(500).json({ status: "error", message: "Error parsing video info" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
