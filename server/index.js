import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import server from './app.js';
const port = process.env.USERPORT || 5001;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log(`Database connection successful...`);
    });
  
  server.listen(port, function () {
    console.log(`Listening on port ${port}`);
  });