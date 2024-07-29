const axios = require("axios").default;
const { akamaiSensorUrl } = require("../constants");

const generateAkamaiSensor = async () => {
    let data = {
        "app": "in.goindigo.android",
        "lang": "en",
        "version": "3.3.0",
        "challenge": false
    }

    const sensorResponse = await axios.post(akamaiSensorUrl, data);

    return sensorResponse.data;
}

module.exports = generateAkamaiSensor;