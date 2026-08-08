const express = require('express');
const cors = require('cors');
const exec = require('yt-dlp-exec');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Home route
app.get('/', (req, res) => {
    res.json({ 
        status: "success",
        message: "YouTube Downloader API is active!" 
    });
});

// Download API Endpoint
app.get('/api/download', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ 
            status: "error", 
            message: "YouTube URL parameter required. Example: /api/download?url=YOUR_URL" 
        });
    }

    try {
        // yt-dlp ഉപയോഗിച്ച് വീഡിയോ വിവരങ്ങൾ എടുക്കുന്നു
        const output = await exec(videoUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
        });

        // വീഡിയോ ഫോർമാറ്റുകളും Direct ഡൗൺലോഡ് ലിങ്കുകളും ഫിൽട്ടർ ചെയ്യുന്നു
        const formats = output.formats.map(f => ({
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

    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Failed to process the YouTube video", 
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
