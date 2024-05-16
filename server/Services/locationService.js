import NodeGeocoder from "node-geocoder";

const options = {
  provider: process.env.MAP_SERVICE_OPTION,
  apiKey: process.env.MAP_SERVICE_API_KEY,
};

const geocoder = NodeGeocoder(options);

export const get_Address_Details = async function getDetails() {

  try {
    const result = await geocoder.geocode({ address: 'Lucknow', country: 'India' });
    // const address = results[0].formattedAddress;
    // const country = results[0].country;
    // const city = results[0].city;

    return result; // Customize based on desired details
  } catch (err) {
    console.error(err);
    throw new Error('Error retrieving location details');
  }
}
export const get_Coordinates_Details = async function getDetails(lati, longi) {

  const locLat = parseFloat(lati);
  const locLong = parseFloat(longi);
  try {
    const results = await geocoder.reverse({ lat: locLat, lon: locLong });
    const address = results[0].formattedAddress;
    const country = results[0].country;
    const city = results[0].city;
    const latitude = results[0].latitude;
    const longitude = results[0].longitude;

    return { address, city, country, latitude, longitude }; // Customize based on desired details
  } catch (err) {
    console.error(err);
    throw new Error('Error retrieving location details');
  }
}