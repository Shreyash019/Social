const redis = require('redis');

// Function to update cached data
async function updateCachedData(dataType) {
  try {
    // Update cached data logic here based on data type
    console.log(`Updating cached ${dataType} data...`);
  } catch (error) {
    console.error(`Error updating cached ${dataType} data:`, error);
  }
}

// Middleware function to trigger updateCachedData after response is sent for user posts
function updateUserPostCachedDataMiddleware(req, res, next) {
  res.on('finish', () => {
    updateCachedData('userPost');
  });
  next();
}

// Middleware function to trigger updateCachedData after response is sent for business posts
function updateBusinessPostCachedDataMiddleware(req, res, next) {
  res.on('finish', () => {
    updateCachedData('businessPost');
  });
  next();
}

// Export the middleware functions
module.exports = { updateUserPostCachedDataMiddleware, updateBusinessPostCachedDataMiddleware };
