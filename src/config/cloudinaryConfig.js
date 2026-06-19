const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setting up storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hirehub_uploads',
        resource_type: 'auto'
    },
});

module.exports = { cloudinary, storage };
