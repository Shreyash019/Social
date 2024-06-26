function convertStringToDateTime(providedDate, timeString) {
    try {
        // Extract date components (month, day, year) and time components (hour, minute, meridian)
        const [month, day, year] = providedDate.split('/');
        const [hour, minute, meridian] = timeString.split(':');

        // Parse date and time components
        const parsedMonth = parseInt(month, 10) - 1; // Adjust month index (0-based)
        const parsedDay = parseInt(day, 10);
        const parsedYear = parseInt(year, 10);
        const parsedHour = parseInt(hour, 10);
        const parsedMinute = parseInt(minute, 10);

        // Validate date and time components
        if (isNaN(parsedMonth) || isNaN(parsedDay) || isNaN(parsedYear) || isNaN(parsedHour) || isNaN(parsedMinute)) {
            throw new Error("Invalid date or time format. Please use MM/DD/YYYY and HH:MM[AM|PM].");
        }

        // Adjust hour for 12-hour format and validate meridian
        let adjustedHour = parsedHour;
        if (meridian.toUpperCase() === 'PM' && adjustedHour !== 12) {
            adjustedHour += 12;
        } else if (meridian.toUpperCase() === 'AM' && adjustedHour === 12) {
            adjustedHour = 0;
        } else if (meridian.toUpperCase() !== 'AM' && meridian.toUpperCase() !== 'PM') {
            throw new Error("Invalid meridian. Please use AM or PM.");
        }

        // Create a JavaScript Date object
        return new Date(parsedYear, parsedMonth, parsedDay, adjustedHour, parsedMinute);
    } catch (error) {
        throw error; // Re-throw the error for handling in the calling code
    }
}


function generateEventUniqueID(userType) {

    // Checking User Type
    let user = 'USER';
    if (userType === "customer") {
        user = 'USER';
    } else if (userType === 'business') {
        user = 'EVENT';
    }
    // Event Unique ID Creation
    const currentTime = new Date();
    const currentYear = currentTime.getFullYear();
    const currentMonth = currentTime.getMonth();
    const currentDate = currentTime.getDate();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentSecond = currentTime.getSeconds();
    const eventUniqueID = user + currentYear + currentMonth + currentDate + currentHour + currentMinute + currentSecond;
    return eventUniqueID;
}


module.exports = {
    convertStringToDateTime,
    generateEventUniqueID
}