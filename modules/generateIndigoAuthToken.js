const axios = require("axios").default;
const { HttpProxyAgent } = require("http-proxy-agent");
const { HttpsProxyAgent } = require("https-proxy-agent");

const randomString = require('../utils/randomString');

/**
 * 
 * @param {import('../utils/IndigoAppEncryption')} indigoAppEncryption 
 * @returns {string}
 */
const generateSessionRequest = (indigoAppEncryption) => {

    // get current date in 2024-07-26T19:27:12+0000 format
    // Removing .\d\d\dZ from the end of the date and adding +0000
    const currentDateISO = new Date().toISOString().slice(0, 19) + '+0000';

    const random3Chars = randomString(3);

    const plaintext = JSON.stringify({
        isGuestLogin: false,
        IsRefreshSession: false,
        nskTokenRequest: {
            credentials: {
                password: "",
                username: ""
            }
        },
        strToken: "",
        subscriptionKey: `ind${random3Chars}igoApp|${currentDateISO}|AN|false`
    });

    return indigoAppEncryption.encrypt(plaintext);
}

/**
 * 
 * @param {import('../utils/IndigoAppEncryption')} indigoAppEncryption 
 * @param {string} sensor 
 * @param {string} buildId 
 * @param {?string} proxy
 * @returns {Promise<string>}
 */
const generateAuthHeader = async (indigoAppEncryption, sensor, buildId, androidVersion, proxy = null) => {

    const sessionRequest = generateSessionRequest(indigoAppEncryption);

    const responseSession = await axios.post('https://6edigiapps.goindigo.in/custom/indigo/6esessionV2', {
        SessionRequest: sessionRequest,
    }, {
        headers: {
            'X-acf-sensor-data': sensor,
            'content-type': 'application/json',
            authorization: '',
            'user-agent': `IndiGo/6.0.6 (Android ${androidVersion}; Build/${buildId})`,
            targetapiplatform: 'android',
            sourcetype: 'customerApp',
            targetapiversion: '640',
            host: '6edigiapps.goindigo.in',
            connection: 'Keep-Alive',
            'accept-encoding': 'gzip',
        },
        timeout: 10000,
        ...(
            proxy
                ? {
                    httpAgent: new HttpProxyAgent(proxy),
                    httpsAgent: new HttpsProxyAgent(proxy)
                }
                : {}
        )
    });

    const sessionData = responseSession.data.data;

    const token = JSON.parse(indigoAppEncryption.decrypt(sessionData)).token.token;

    // It is important to reset the booking
    await axios.post('https://6edigiapps.goindigo.in/base/api/v2/graph/mobileapp', {
        operationName: 'ResetBooking',
        query: 'mutation reset{ bookingReset }',
        variables: null
    }, {
        headers: {
            authorization: token,
            'user-agent': `IndiGo/6.0.6 (Android 14; Build/${buildId})`,
            targetapiplatform: 'android',
            sourcetype: 'customerApp',
            targetapiversion: '640',
            'content-type': 'application/json',
            host: '6edigiapps.goindigo.in',
            connection: 'Keep-Alive',
            'accept-encoding': 'gzip',
        },
        timeout: 10000,
        ...(
            proxy
                ? {
                    httpAgent: new HttpProxyAgent(proxy),
                    httpsAgent: new HttpsProxyAgent(proxy)
                }
                : {}
        )
    })

    return token;
}

module.exports = generateAuthHeader;