const NodeGeocoder = require("node-geocoder");

const options = {
  provider: process.env.MAP_SERVICE_OPTION,
  apiKey: process.env.MAP_SERVICE_API_KEY,
};

const geocoder = NodeGeocoder(options);

const https = require('https'); // For making HTTP requests

exports.searchCities = async function searchCities(query, userCountry) {
  try {
    if (!userCountry) {
      throw new Error('User country not found');
    }

    const googleMapsApiKey = options.apiKey;

    // **Geocoding using NodeGeocoder (optional)**
    // Uncomment the following block if you want to keep using NodeGeocoder
    // const results = await geocoder.geocode({
    //   address: query,
    //   country: userCountry, // Filter by user's country (consider limitations)
    // });
    // console.log(results); // For debugging

    // **Google Maps Platform Places API for City List**
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query); // Specify search term (can be adjusted)
    url.searchParams.set('type', 'locality'); // Filter for localities (cities)
    url.searchParams.set('country', userCountry.toLowerCase()); // Filter by user's country
    url.searchParams.set('key', googleMapsApiKey); // Add your API key

    const response = await https.get(url);
    console.log(response)
    // const data = await response.json();

    if (response.statusCode !== 200) {
      throw new Error(`Error fetching cities from Google Maps API:`);
      // throw new Error(`Error fetching cities from Google Maps API: ${data.status}`);
    }

    // Extract city names from response (adjust based on actual response structure)
    // const cities = data.results.map(result => result.name);

    // **Return based on search type**
    // if (query.trim().length >= MIN_QUERY_LENGTH) { // Adjust minimum query length if needed
    //   return cities; // Return list of cities from Google Maps API
    // } else {
    //   // Consider using NodeGeocoder results here if desired (for shorter queries)
    //   // return results.map(result => ({ name: result.formattedAddress })); // Example usage
    //   return []; // Return empty array for very short queries
    // }
    return []
  } catch (err) {
    console.error(err);
    throw new Error('Error searching cities');
  }
};


// exports.searchCities = async function searchCities(query, userCountry = undefined) {
//   try {
//     if (!userCountry) {
//       throw new Error('User country not found');
//     }

//     // const results = await geocoder.geocode({
//     //   address: query,
//     //   country: userCountry, // Filter by user's country
//     // });

//     // console.log(results)

//     // return results.map(result => ({
//     //   name: result.formattedAddress, // Consider using specific fields like city
//     //   // Include other relevant city details if needed (latitude, longitude)
//     // }));

//     // Use `geocode` for fuzzy search and potential multiple results
//     // Construct a regular expression for case-insensitive matching starting with query
//     const regex = new RegExp(`^${query.toLowerCase()}`, 'i');

//     // Use `geocode` for fuzzy search and potential multiple results
//     const allResults = await geocoder.geocode({ address: query }); // Initial search
//     console.log(allResults)

//     // Filter based on user's country and starting character match (case-insensitive)
//     const filteredResults = allResults.filter(
//       (result) =>
//         result.country.toLowerCase() === userCountry.toLowerCase() &&
//         regex.test(result.formattedAddress.toLowerCase())
//     );

//     return filteredResults.map(result => ({
//       name: result.formattedAddress,
//       // Include other relevant city details if needed (latitude, longitude)
//     }));
//   } catch (err) {
//     console.error(err);
//     throw new Error('Error searching cities');
//   }
// };

exports.get_Address_Details = async function getDetails() {

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
exports.get_Coordinates_Details = async function getDetails(lati, longi) {

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