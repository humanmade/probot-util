const fs = require( 'fs' );
const createProbot = require( 'probot' );

const create = () => {
	// Load .env if not in production
	if ( ! isLambdaEnvironment() ) {
		require( 'dotenv' ).config();
	}

	// Check requirements.
	if ( ! process.env.APP_ID || ! process.env.WEBHOOK_SECRET ) {
		throw new Error( 'Missing APP_ID or WEBHOOK_SECRET' );
	}

	// Adjust path.
	if ( process.env.LAMBDA_TASK_ROOT ) {
		process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'] + '/bin';
	}

	// Set up probot.
	let cert;
	try {
		const certFilename = process.env.CERT_FILENAME || 'private-key.pem';
		cert = fs.readFileSync( certFilename, 'utf8' );
	} catch ( err ) {
		throw new Error( 'Missing or unreadable private key' );
	}

	return createProbot( {
		id: process.env.APP_ID,
		secret: process.env.WEBHOOK_SECRET,
		cert: cert,
		port: 6866, // ASCII "D" + "B",
		webhookProxy: process.env.WEBHOOK_PROXY_URL || null,
	} );
}

const isLambdaEnvironment = () => {
	return process.env.AWS_EXECUTION_ENV || process.env.NODE_ENV === 'production';
};

// Build the handler.
const buildHandler = probot => {
	return function ( event, context, callback ) {
		console.log( JSON.stringify( event, null, 2 ) );
		return;

		// Determine incoming webhook event type
		// Checking for different cases since node's http server is lowercasing everything
		const e = event.headers['x-github-event'] || event.headers['X-GitHub-Event'];

		// Convert the payload to an Object if API Gateway stringifies it
		event.body = (typeof event.body === 'string') ? JSON.parse( event.body ) : event.body;

		try {
			if ( ! e || ! event.body ) {
				throw new Error( 'Payload not present or malformed.' );
			}

			// Do the thing.
			probot.receive( {
				event: e,
				payload: event.body
			} )
				.then( err => {
					const res = {
						statusCode: 200,
						body: JSON.stringify( {
							message: 'Executed'
						} )
					};

					callback( null, res );
				} );

		} catch ( err ) {
			callback( err );
		}
	};
};

module.exports = {
	buildHandler,
	create,
	isLambdaEnvironment,
};
