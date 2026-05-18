import { v2 as cloudinary } from 'cloudinary';

let _configured = false;

const configureCloudinary = () => {
  if (_configured) return;

  if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true);
  } else if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } else {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET in environment variables.',
    );
  }

  const { cloud_name, api_key, api_secret } = cloudinary.config();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Cloudinary config is incomplete. Check your environment variables.',
    );
  }

  console.log(`Cloudinary configured for cloud: ${cloud_name}`);
  _configured = true;
};

// Lazy — called on first upload, after dotenv has loaded
export const getCloudinary = () => {
  configureCloudinary();
  return cloudinary;
};

export default cloudinary;
