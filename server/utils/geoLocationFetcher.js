const NodeGeocoder = require('node-geocoder');
const axios = require('axios');
const { translate } = require('@vitalets/google-translate-api');


// Set up geocoder options (example using OpenStreetMap)
const options = {
    provider: 'openstreetmap'
};

// Create a geocoder instance
const geocoder = NodeGeocoder(options);

// Function to fetch country from coordinates
export const getCountryFromCoordinates = async function (latitude, longitude) {
    try {
        // Perform reverse geocoding to obtain address information
        const result = await geocoder.reverse({ lat: latitude, lon: longitude });
        // Extract the country from the address components
        const fetchedCountry = result[0].country;
        // Perform translation to English
        const translatedData = await translate(fetchedCountry, { to: 'en' });
        // Extract the translated text
        const country = translatedData.text;
        return country;
    } catch (error) {
        console.error('Error fetching country from coordinates:', error);
        throw error;
    }
}

// Function to fetch coordinates from an IP address
export const getCoordinatesFromIP = async function (ipAddress) {
    try {
        // Make HTTP GET request to ipinfo.io API
        const response = await axios.get(`https://ipinfo.io/${ipAddress}/json`);
        // Extract latitude and longitude from the response data
        const { loc } = response.data;
        console.log("wrsf", response.data)
        const [latitude, longitude] = loc.split(',').map(parseFloat);
        return { latitude, longitude };
    } catch (error) {
        console.error('Error fetching coordinates from IP address:', error);
        throw error;
    }
}