import { favicons } from 'favicons';

export async function GET() {
	const response = await favicons('./public/favicon.svg', {
		path: '/', // Path for overriding default icons path
		icons: {
			android: false,
			appleIcon: false,
			appleStartup: false,
			favicons: true,
			windows: false,
			yandex: false,
		},
	});

	const faviconObject = response.images.find((i) => i.name === 'favicon.ico');
	if (!faviconObject) throw new Error('Not found favicon');

	return new Response(faviconObject.contents);
}
