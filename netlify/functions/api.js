// netlify/functions/api.js
import express from 'express';
import serverless from 'serverless-http';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize the express app for serverless function
const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configure WhatsApp client (simplified for Netlify function)
const { Client, LocalAuth } = pkg;
const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
  },
  authStrategy: new LocalAuth()
});

// Status variable
let isReady = false;

// API Routes
// Status endpoint
app.get('/status', (req, res) => {
  res.status(200).json({
    status: isReady,
    message: isReady ? 'WhatsApp is ready' : 'WhatsApp is not ready'
  });
});

// Send message endpoint
app.post('/send-message', async (req, res) => {
  const { number, message } = req.body;
  
  if (!number || !message) {
    return res.status(400).json({
      status: false,
      message: 'Number and message are required!'
    });
  }
  
  if (!isReady) {
    return res.status(400).json({
      status: false,
      message: 'WhatsApp is not ready!'
    });
  }
  
  try {
    // Format the phone number
    let formattedNumber = number.replace(/\D/g, '');
    
    if (!formattedNumber.startsWith('62')) {
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '62' + formattedNumber.substring(1);
      } else {
        formattedNumber = '62' + formattedNumber;
      }
    }
    
    const chatId = `${formattedNumber}@c.us`;
    
    // Send the message
    const sendResult = await client.sendMessage(chatId, message);
    
    res.status(200).json({
      status: true,
      message: 'Message sent successfully',
      data: {
        to: number,
        formattedNumber: formattedNumber,
        messageId: sendResult.id.id
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      status: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

// Root route with message about serverless limitations
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'WhatsApp API Service - Serverless Version',
    note: 'This serverless version has limitations. For full functionality, consider deploying to a VPS or similar platform.',
    endpoints: [
      {
        path: '/status',
        method: 'GET',
        description: 'Check WhatsApp connection status'
      },
      {
        path: '/send-message',
        method: 'POST',
        description: 'Send a WhatsApp message',
        body: {
          number: 'Phone number with or without country code',
          message: 'Message content'
        }
      }
    ]
  });
});

// Initialize WhatsApp client
client.initialize();

// Set up event listeners
client.on('ready', () => {
  isReady = true;
  console.log('WhatsApp is ready!');
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED');
});

client.on('auth_failure', function() {
  isReady = false;
  console.log('Auth failure, restarting...');
});

client.on('disconnected', function() {
  isReady = false;
  console.log('WhatsApp is disconnected!');
  client.destroy();
  client.initialize();
});

// Serverless handler
const handler = serverless(app);
export { handler };
