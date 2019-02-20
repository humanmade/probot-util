const fs = require( 'fs' );
const path = require( 'path' );

const DOWNLOAD_DIR = '/tmp/downloads';

const saveDownloadedFile = ( buffer, filename ) => {
	const downloadPath = path.join( DOWNLOAD_DIR, filename );

	// Ensure the download directory exists before using it.
	return ensureDirectory( DOWNLOAD_DIR )
		.then( () => new Promise( ( resolve, reject ) => {
			const handle = fs.createWriteStream( downloadPath );
			handle.end( buffer, () => {
				handle.close( () => resolve( downloadPath ) );
			} );
		} ) );
};

const ensuring = {};
const ensureDirectory = function ( directory ) {
	if ( directory in ensuring ) {
		return ensuring[ directory ];
	}

	ensuring[ directory ] = new Promise( ( resolve, reject ) => {
		fs.stat( directory, ( err, stats ) => {
			if ( ! err ) {
				if ( ! stats.isDirectory() ) {
					return reject( new Error( 'File exists, but is not a directory' ) );
				}

				return resolve( false );
			}

			if ( err.code !== 'ENOENT' ) {
				return reject( err );
			}

			// Directory doesn't exist, so create it.
			fs.mkdir( directory, err => {
				if ( err ) {
					return reject( err );
				}

				resolve( true );
			} );
		} );
	} );

	// Clear cache after complete.
	ensuring[ directory ].finally( () => {
		delete ensuring[ directory ];
	} );

	return ensuring[ directory ];
};

module.exports = {
	DOWNLOAD_DIR,
	ensureDirectory,
	saveDownloadedFile,
};
