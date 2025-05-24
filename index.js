import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import express from 'express';
import qrcode from 'qrcode';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

// Get current file's directory path (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Client WhatsApp
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

// Status WhatsApp connection
let isReady = false;

// Socket.io connection
io.on('connection', function(socket) {
  socket.emit('message', 'Connecting to WhatsApp...');
  
  if (isReady) {
    socket.emit('ready', 'WhatsApp is ready!');
    socket.emit('message', 'WhatsApp is ready!');
  } else {
    socket.emit('message', 'WhatsApp is not ready!');
  }
});

// WhatsApp events
client.on('qr', (qr) => {
  console.log('QR RECEIVED');
  
  // Display QR in terminal
  qrcode.toString(qr, { type: 'terminal', small: true }, (err, url) => {
    if (err) {
      console.error('Error generating QR code:', err);
      return;
    }
    console.log(url);
  });
  
  // Also send to web interface
  qrcode.toDataURL(qr, (err, url) => {
    if (err) return;
    io.emit('qr', url);
    io.emit('message', 'QR Code received, scan please!');
  });
});

client.on('ready', () => {
  isReady = true;
  console.log('WhatsApp is ready!');
  io.emit('ready', 'WhatsApp is ready!');
  io.emit('message', 'WhatsApp is ready!');
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED');
  io.emit('authenticated', 'WhatsApp is authenticated!');
  io.emit('message', 'WhatsApp is authenticated!');
});

client.on('auth_failure', function() {
  isReady = false;
  io.emit('message', 'Auth failure, restarting...');
});

client.on('disconnected', function() {
  isReady = false;
  io.emit('message', 'WhatsApp is disconnected!');
  client.destroy();
  client.initialize();
});

// Initialize WhatsApp client
client.initialize();

// API Routes
// Get status
app.get('/status', (req, res) => {
  res.status(200).json({
    status: isReady,
    message: isReady ? 'WhatsApp is ready' : 'WhatsApp is not ready'
  });
});

// Send message
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
    // Remove any non-numeric characters and ensure it starts with proper format
    let formattedNumber = number.replace(/\D/g, '');
    
    // Check if the number already has the country code
    if (!formattedNumber.startsWith('62')) {
      // If the number starts with 0, replace it with 62
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '62' + formattedNumber.substring(1);
      } else {
        // Otherwise, prepend 62
        formattedNumber = '62' + formattedNumber;
      }
    }
    
    // Add @c.us suffix for WhatsApp API
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

// Simple web interface for scanning QR code
app.get('/', async (req, res) => {
  try {
    // Read the HTML file
    const fs = await import('fs/promises');
    let html = await fs.readFile(join(__dirname, 'index.html'), 'utf8');
  
    // Inject the BACKEND_URL environment variable
    const backendUrl = process.env.BACKEND_URL || '';
    html = html.replace('window.BACKEND_URL = null;', `window.BACKEND_URL = "${backendUrl}";`);
  
    // Send the modified HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Error loading the page');
  }
});

server.listen(PORT, function() {
  console.log(`App running on *:${PORT}`);
  console.log('Scan the QR code that will appear in the terminal or visit http://localhost:' + PORT);
});
