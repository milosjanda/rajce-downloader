import axios from 'axios';
import { createWriteStream, existsSync, mkdirSync, readFileSync, unlink, writeFileSync } from 'fs';
const request = require('https');

if (!process.argv[3]) {
	console.log('Usage script url user pass');
}

const temporeryFilePage = __dirname + '/../tmp/a.html';

(async() => {
	const url = process.argv[1];
	const user = process.argv[2];
	const pass = process.argv[3]

	const response = await axios({
		method: 'get',
		url: url,
		headers: {
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
		}
	});

	// handle success
	const cookie = response.headers['set-cookie'][0].split(';')[0] + ';';
	console.log(cookie);

	axios({
			method: 'post',
			url: url,
			data: `login=${user}&code=${pass}`,
			headers: {
				"Cookie": cookie.split(';')[0],
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
			}
		}).then(function (response) {
			console.log(response.headers);
			writeFileSync(temporeryFilePage, response.data);
		});


	// Read data
	const data = readFileSync(__dirname + '/../tmp/b.html').toString();

	// Parse storage url
	const regexp = /var\sstorage\s=\s"(.*)";/;
	const storageUrl = data.match(regexp)[1].replace(/\\/g, '');
	console.log(storageUrl);

	// Parse album dir name
	const regexpAlbumServerDir = /var\salbumServerDir\s=\s"(.*)";/;
	const albumDir = data.match(regexpAlbumServerDir)[1];
	console.log(albumDir);
	const dir = __dirname + '/../tmp/' + albumDir
	if (!existsSync(dir)) {
		mkdirSync(__dirname + '/../tmp/' + albumDir)
	}

	// Parse photos json data
	const regexpPhotos = /var\sphotos\s=\s(\[.*]).*/;
	const result = data.match(regexpPhotos);
	const photosData = JSON.parse(result[1]);

	console.log(photosData);


	// download files
	photosData.forEach((photo: any) => {
		const photoUrl = `${storageUrl}images/${photo.fileName}`;
		request
			.get(photoUrl, (res: any) => {
				if (res.statusCode !== 200) {
					// Consume response data to free up memory
					res.resume();
					return;
				}
				res.pipe(createWriteStream(dir + '/' + photo.fileName));
			});
	});

	unlink(temporeryFilePage, () => {});

	//
	// axios({
	// 	url: `${storageUrl}images/${photosData[0].fileName}`,
	// 	method: 'GET',
	// 	headers: {
	// 		// "Cookie": cookie.split(';')[0],
	// 		"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
	// 	}
	// })
	// 	.then((result) => {
	// 		console.log(result);
	// 		writeFileSync(dir + '/' + photosData[0].fileName, result.data, 'utf8');
	// 	}).catch((err) => {
	// 		console.error(err);
	// });
})();
