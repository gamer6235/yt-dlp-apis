const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Download cheytha files store cheyyan 'downloads' folder undakkunnu
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

// Download cheytha files public aayi access cheyyan static folder aakkunnu
app.use('/files', express.static(DOWNLOAD_DIR));

app.get('/', (req, res) => {
    res.json({ status: "success", message: "YouTube Downloader API is active!" });
});

// Main Endpoint: FFmpeg vech 1080p Merge cheyth Direct File URL tharunnu
app.get('/api/download', (req, res) => {
    const videoUrl = req.query.url;
    const quality = req.query.quality || '1080'; // Default 1080p

    if (!videoUrl) {
        return res.status(400).json({ status: "error", message: "YouTube URL parameter required." });
    }

    // Uniq File Name undakkunnu
    const filename = `video_${Date.now()}.mp4`;
    const outputPath = path.join(DOWNLOAD_DIR, filename);

    // yt-dlp command: Best Video (Up to requested quality) + Best Audio merged using FFmpeg
    const command = `yt-dlp -f "bestvideo[height<=${quality}]+bestaudio/best" --merge-output-format mp4 -o "${outputPath}" --extractor-args "youtube:player_client=android,web" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "${videoUrl}"`;

    console.log("Processing video download...");

    exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error) {
            console.error("yt-dlp error:", stderr);
            return res.status(500).json({ 
                status: "error", 
                message: "Failed to process and merge video", 
                details: stderr || error.message 
            });
        }

        // Host domain undakkunnu
        const protocol = req.protocol;
        const host = req.get('host');
        const directDownloadUrl = `${protocol}://${host}/files/${filename}`;

        res.json({
            status: "success",
            message: "Video merged successfully with FFmpeg!",
            quality: `${quality}p`,
            download_url: directDownloadUrl
        });

        // Railway storage niranju pokathirikkan 30 minute kazhiyumbol file auto-delete aakkunnu
        setTimeout(() => {
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
                console.log(`Deleted temporary file: ${filename}`);
            }
        }, 30 * 60 * 1000); 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
