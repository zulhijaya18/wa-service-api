# WhatsApp Service API

A self-hosted service API that allows you to send WhatsApp messages programmatically through a REST API. This service uses the WhatsApp Web interface to connect to your WhatsApp account.

## Features

- Connect to WhatsApp via QR code scanning
- Send WhatsApp messages via API
- Real-time connection status monitoring
- Simple web interface for QR code scanning
- Persistent authentication (no need to scan QR code every time)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A smartphone with WhatsApp installed
- Internet connection for both server and smartphone

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/zulhijaya18/wa-service-api.git
   cd wa-service-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. Create a `.env` file in the root directory (optional):
   ```
   PORT=3000
   CORS_ORIGIN=*
   ```

## Running the Service

Start the service:

```bash
npm start
```

or

```bash
node index.js
```

The service will start on the configured port (default: 3000). You'll see a QR code in the terminal.

## Linking Your WhatsApp Account

1. Start the service
2. Once the service is running, you'll see a QR code in the terminal
3. You can also visit `http://localhost:3000` in your browser to see the QR code
4. Open WhatsApp on your phone
5. Go to Settings > WhatsApp Web/Desktop
6. Scan the QR code
7. Once connected, you'll see a "WhatsApp is ready!" message

⚠️ **Important Note**: The linked device (this service) will have access to your WhatsApp messages. Only use this service on a secure server.

## API Endpoints

### Check Status

```
GET /status
```

Response:
```json
{
  "status": true,
  "message": "WhatsApp is ready"
}
```

### Send Message

```
POST /send-message
Content-Type: application/json

{
  "number": "6281234567890",
  "message": "Hello, this is a test message"
}
```

The `number` can be in any of these formats:
- With country code: `6281234567890`
- Without country code: `081234567890` (will be automatically converted to 62 format)

Response (success):
```json
{
  "status": true,
  "message": "Message sent successfully",
  "data": {
    "to": "6281234567890",
    "formattedNumber": "6281234567890",
    "messageId": "message-id-from-whatsapp"
  }
}
```

Response (error):
```json
{
  "status": false,
  "message": "Error message"
}
```

## Examples

### cURL Example

```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{"number":"6281234567890","message":"Hello from WhatsApp API"}'
```

### JavaScript Example

```javascript
fetch('http://localhost:3000/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    number: '6281234567890',
    message: 'Hello from WhatsApp API',
  }),
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### PHP Example

```php
<?php
$data = array(
    'number' => '6281234567890',
    'message' => 'Hello from WhatsApp API'
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    )
);

$context  = stream_context_create($options);
$result = file_get_contents('http://localhost:3000/send-message', false, $context);

echo $result;
?>
```

## Troubleshooting

1. **QR Code Not Showing**: Make sure you have the correct permissions to run the application and the terminal supports QR code display.

2. **Connection Issues**: If the connection to WhatsApp keeps disconnecting, check your internet connection and try re-scanning the QR code.

3. **Message Not Sent**: Ensure that the phone number is correctly formatted and the WhatsApp account is connected.

## Security Considerations

- This service will have access to your WhatsApp account. Only deploy it on secure servers.
- Use environment variables for sensitive configuration.
- Consider implementing API authentication if exposing the service to the public.

## Deployment

### Deployment Considerations

⚠️ **IMPORTANT WARNING** ⚠️

This WhatsApp API service **CANNOT** be deployed on serverless platforms like Netlify, Vercel, or standard AWS Lambda due to the following limitations:

1. **Size Limitations**: The application depends on puppeteer and Chromium, exceeding serverless platforms' size limits (e.g., Netlify's 250MB limit)
2. **Persistent Connection**: The service requires a persistent WebSocket connection to WhatsApp
3. **Local Storage**: The authentication data needs persistent local storage between application runs
4. **Long-Running Process**: The WhatsApp client needs to run continuously, which conflicts with serverless architecture

### Recommended Deployment Options

For proper functionality, we recommend deploying to:

1. **VPS** (DigitalOcean, Linode, AWS EC2)
2. **Container Platforms** (Docker with Kubernetes/Docker Compose)
3. **PaaS with Always-On Options**:
   - Railway.app
   - Heroku (with paid dynos to prevent sleep)
   - Google Cloud Run (with min instances set to 1)
   - Azure Container Apps

### Setting Up on a VPS (Recommended)

### Deploying to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Create a `vercel.json` configuration file in your project root:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "index.js"
       }
     ]
   }
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy the project:
   ```bash
   vercel
   ```

5. For production deployment:
   ```bash
   vercel --prod
   ```

### Deploying to Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Create a `netlify.toml` file in your project root:
   ```toml
   [build]
     command = "# no build command"
     publish = "."
     functions = "netlify/functions"

   [functions]
     node_bundler = "esbuild"

   [[redirects]]
     from = "/*"
     to = "/.netlify/functions/api"
     status = 200
   ```

3. Create a Netlify function file at `netlify/functions/api.js`:
   ```javascript
   // netlify/functions/api.js
   const express = require('express');
   const serverless = require('serverless-http');
   const app = express();
   
   // Import your main app
   const mainApp = require('../../index.js');
   
   // Use your main app as middleware
   app.use('/.netlify/functions/api', mainApp);
   
   // Export the serverless function
   exports.handler = serverless(app);
   ```

4. Login to Netlify:
   ```bash
   netlify login
   ```

5. Deploy the site:
   ```bash
   netlify deploy
   ```

6. For production deployment:
   ```bash
   netlify deploy --prod
   ```

### Important Note on Cloud Deployments

When deploying to serverless platforms:

1. **Authentication Storage**: The service uses LocalAuth strategy which stores credentials locally. You'll need to configure persistent storage for these platforms.

2. **WebSocket Limitations**: Some platforms have limitations on WebSocket connections or require special configurations.

3. **Always-On Connection**: This service needs to stay connected to WhatsApp. Serverless platforms may spin down your service during inactivity.

4. **Better Alternatives**: Consider using:
   - Railway.app
   - Heroku
   - Digital Ocean
   - AWS EC2
   - Google Cloud Run with always-on configuration

These platforms are better suited for services that require persistent connections.

## License

[MIT License](LICENSE)
