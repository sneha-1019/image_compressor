const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'))
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
    destination: 'uploads',
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + file.originalname); // Ensure the original extension is preserved
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('user_img'), async function (req, res) {
    const filePath = req.file.path;
    try {
        const imagemin = (await import('imagemin')).default;
        const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;
        const imageminPngquant = (await import('imagemin-pngquant')).default;

        const ext = path.extname(filePath).toLowerCase();
        const allowedTypes = ['.jpg', '.jpeg', '.png'];

        if (!allowedTypes.includes(ext)) {
            return res.status(400).send('Only .png, .jpg and .jpeg formats allowed!');
        }

        const compressedFiles = await imagemin([filePath], {
            destination: 'uploads',
            plugins: [
                imageminMozjpeg({ quality: 30 }),
                imageminPngquant({ quality: [0.6, 0.8] })
            ]
        });

        const compressedFilePath = compressedFiles[0].destinationPath;
      
        res.render('index', { compressedFilePath: compressedFilePath});
    } catch (error) {
        console.error('Error during image upload and compression:', error);
        res.status(500).send('Error during image upload and compression');
    }
});

app.get('/', function (req, res) {
    res.render('index', { compressedFilePath: null });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});