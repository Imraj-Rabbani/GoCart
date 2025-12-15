import ImageKit from '@imagekit/nodejs';

var imageKit = new ImageKit({
  // privateKey: process.env.IMAGEKIT_PRIVATE_KEY, 
  // publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  // urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
  privateKey: process.env['IMAGEKIT_PRIVATE_KEY'],
});


export default imageKit;

