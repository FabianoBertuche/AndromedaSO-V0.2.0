const http = require('http');

const data = JSON.stringify({
    channel: "web",
    content: {
        type: "text",
        text: "HTTP Test MVP03"
    },
    session: {
        id: "session-demo-mvp03"
    }
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/gateway/message',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': 'Bearer andromeda-secret-token'
    }
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);
    let responseBody = '';

    res.on('data', d => {
        responseBody += d;
    });

    res.on('end', () => {
        console.log('Response:', responseBody);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
