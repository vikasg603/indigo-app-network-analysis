require("dotenv").config();
const fetchFlights = require("./modules/fetchFlights");
const fastify = require("fastify");
const fastifyCompress = require("@fastify/compress");

(async () => {

	// Create fastify app
	const app = fastify();

	// use gzip compression
	app.register(fastifyCompress, { global: true });

	// Define a route
	app.post(
		"/fetchFlights",
		async (req, res) => {
			try {
				const response = await fetchFlights(req.body);

				if (!Array.isArray(response)) {
					res.status(404);
				}

				if (response.error) {
					return response;
				}

				return response;
			} catch (error) {
				console.log(error);
				return { error: true, msg: "Internal Server Error" };
			}
		}
	);

	// Start the server
	await app.listen({ port: 3000 });

	console.log("Server started at http://localhost:3000");
})();
