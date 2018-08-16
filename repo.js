const fs = require( 'fs' );
const path = require( 'path' );
const tar = require( 'tar' );

const {
	DOWNLOAD_DIR,
	ensureDirectory,
	saveDownloadedFile,
} = require( './file' );

const download = async ( extractDir, pushConfig, github ) => {
	const { commit, owner, repo } = pushConfig;

	console.log( 'Downloading archive to', extractDir );

	const filename = `${owner}-${repo}-${commit}.tar.gz`;
	const archive = await github.repos.getArchiveLink( {
		owner,
		repo,
		archive_format: 'tarball',
		ref:            commit,
	});

	// Ensure the download directory exists before using it.
	await ensureDirectory( DOWNLOAD_DIR );
	const tarball = await saveDownloadedFile( archive.data, filename );

	await ensureDirectory( extractDir );

	console.log( 'Extracting archive to dir' );
	const extracted = await tar.extract( {
		cwd:   extractDir,
		file:  tarball,
		strip: 1,
		filter: path => ! path.match( /\.(jpg|jpeg|png|gif|woff|swf|flv|fla|woff|svg|otf||ttf|eot|swc|xap)$/ ),
	} );
	console.log( 'Completed extraction.' );

	// Delete the now-unneeded tarball.
	fs.unlink( tarball, () => {} );
};

module.exports = {
	download,
};
