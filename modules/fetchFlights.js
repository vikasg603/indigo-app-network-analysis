const axios = require("axios").default;
const { HttpProxyAgent } = require("http-proxy-agent");
const { HttpsProxyAgent } = require("https-proxy-agent");

const { indigoAESIv, indigoAESKey } = require('../constants');
const IndigoAppEncryption = require('../utils/IndigoAppEncryption');
const generateAkamaiSensor = require('./generateAkamaiSensor');
const generateAuthHeader = require('./generateIndigoAuthToken');
const indigoAppEncryption = new IndigoAppEncryption(indigoAESKey, indigoAESIv);

/**
 * 
 * @param {string} token 
 * @param {string} display
 * @param {string} proxy 
 * 
 * @returns {Promise<Map<string, any>>}
 */
const fetchSsrDetails = async (token, display, proxy) => {
	const response = await axios.post('https://6edigiapps.goindigo.in/base/api/v2/graph/mobileapp', {
		operationName: 'ssrDetails',
		query: 'query ssrDetails {\n  resourceSsrs(query: {activeOnly: true}) {\n    values {\n      feeCode\n      name\n      ssrCode\n    }\n  }\n}\n\n',
		variables: null
	}, {
		headers: {
			authorization: token,
			'user-agent': `IndiGo/6.0.6 (Android 14; Build/${display}(EX01))`,
			targetapiplatform: 'android',
			sourcetype: 'customerApp',
			targetapiversion: '640',
			'content-type': 'application/json',
			host: '6edigiapps.goindigo.in',
			connection: 'Keep-Alive',
			'accept-encoding': 'gzip',
		},
		...(
			proxy
				? {
					httpAgent: new HttpProxyAgent(proxy),
					httpsAgent: new HttpsProxyAgent(proxy)
				}
				: {}
		)
	})

	const ssrDetailsMap = new Map();

	for (const ssrDetail of response.data.data.resourceSsrs.values) {
		ssrDetailsMap.set(ssrDetail.ssrCode, ssrDetail);
	}

	return ssrDetailsMap;
}

/**
 *
 * @typedef {{
 * 	origin: string;
 * 	dest: string;
 *	adult: number;
 *  child: number;
 *  infant: number;
 *  dptDate: string;
 * 	rtnDate?: string;
 *  isDom: boolean;
 *  fareClass?: string;
 *  proxy: string;
 * }} Inputs
 *
 *
 * @param {Inputs} inputs
 * @returns
 */

const fetchListOfFlights = async (inputs) => {
	const sensorResponseForSessionRequest = await generateAkamaiSensor();

	const token = await generateAuthHeader(
		indigoAppEncryption,
		sensorResponseForSessionRequest.sensor,
		sensorResponseForSessionRequest.model,
		sensorResponseForSessionRequest.androidVersion,
		inputs.proxy
	);

	const [response, ssrDetailsMap] = await Promise.all([
		axios.post('https://6edigiapps.goindigo.in/custom/indigo/availability/search', {
			captchaToken: '',
			codes: { currency: 'INR' },
			criteria: [
				{
					dates: { beginDate: inputs.dptDate },
					filters: {
						exclusionType: 0,
						filter: 'Default',
						productClasses: ['R', 'N', 'S', 'O', 'B', 'J']
					},
					flightFilters: { type: 'All' },
					ssrCollectionsMode: 'Leg',
					stations: { destinationStationCodes: [inputs.dest], originStationCodes: [inputs.origin] }
				},
				...(inputs.rtnDate ? [{
					dates: { beginDate: inputs.rtnDate },
					filters: {
						exclusionType: 0,
						filter: 'Default',
						productClasses: ['R', 'N', 'S', 'O', 'B', 'J']
					},
					ssrCollectionsMode: 'Leg',
					flightFilters: { type: 'All' },
					stations: { destinationStationCodes: [inputs.origin], originStationCodes: [inputs.dest] }
				}] : [])
			],
			date: new Date().getTime(),
			fareFilters: { types: ['R', 'Z'] },
			infantCount: inputs.infant,
			passengers: {
				residentCountry: '',
				types: [
					{ count: inputs.adult, discountCode: '', type: 'ADT' },
					...(inputs.child ? [{ count: inputs.child, discountCode: '', type: 'CHD' }] : []),
					...(inputs.infant ? [{ count: inputs.infant, discountCode: '', type: 'INF' }] : [])
				]
			},
			primaryKey: '',
			taxesAndFees: 'TaxesAndFees'
		}, {
			headers: {
				authorization: token,
				'x-acf-sensor-data': sensorResponseForSessionRequest.sensor,
				'user-agent': `IndiGo/6.0.6 (Android ${sensorResponseForSessionRequest.androidVersion}; Build/${sensorResponseForSessionRequest.model})`,
				targetapiplatform: 'android',
				sourcetype: 'customerApp',
				targetapiversion: '640',
				'content-type': 'application/json',
				host: '6edigiapps.goindigo.in',
				connection: 'Keep-Alive',
				'accept-encoding': 'gzip',
			},
			...(
				inputs.proxy
					? {
						httpAgent: new HttpProxyAgent(inputs.proxy),
						httpsAgent: new HttpsProxyAgent(inputs.proxy)
					}
					: {}
			)
		}),
		fetchSsrDetails(token, sensorResponseForSessionRequest.display, inputs.proxy)
	]);

	return response.data;
};

module.exports = fetchListOfFlights;
