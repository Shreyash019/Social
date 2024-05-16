// Import necessary packages
const axios = require('axios');

// Middleware function for document verification
const userDocumentVerification = async (req, res, next) => {
  try {
    // Extract document image from the request (assuming it's in req.body)
    const documentImage = req.body.documentImage;

    // Make a request to the persona document verification API
    const response = await axios.post('PERSONA_API_ENDPOINT', {
      documentImage,
      apiKey: process.env.PERSONA_API_KEY,
      // Add any other required parameters
    });

    // Check the response from the API
    if (response.data.success) {
      // Document verification successful
      // Modify the request object if necessary
      req.verifiedDocument = response.data.documentData; // Example: Save document data to the request object
      next(); // Proceed to the next middleware
    } else {
      // Document verification failed
      res.status(403).json({ error: 'Document verification failed' });
    }
  } catch (error) {
    // Handle errors (e.g., network errors, API errors)
    console.error('Error verifying document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export the middleware function
module.exports = userDocumentVerification;
