const https = require('https');

const API_KEY = process.env.VITE_COHERE_API_KEY || "cohere_tBuW6iXIihn6DftUUILHfpl3nI4UCgjmuAtcS1Pp2zx0ty";

const payload = JSON.stringify({
  model: "command-a-vision-07-2025",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Describe this image." },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=" } }
      ]
    }
  ]
});

const req = https.request({
  hostname: 'api.cohere.com',
  path: '/v2/chat',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});
req.on('error', console.error);
req.write(payload);
req.end();
