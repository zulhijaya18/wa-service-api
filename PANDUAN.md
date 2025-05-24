# Panduan Penggunaan WhatsApp Service API

Dokumen ini berisi panduan penggunaan layanan API WhatsApp yang bisa di-self-hosted dan digunakan untuk mengirim pesan WhatsApp melalui akun WhatsApp yang telah dihubungkan.

## Fitur Utama

- Menghubungkan ke WhatsApp melalui pemindaian kode QR
- Mengirim pesan WhatsApp melalui API
- Pemantauan status koneksi secara real-time
- Antarmuka web sederhana untuk pemindaian kode QR
- Autentikasi yang persisten (tidak perlu memindai kode QR setiap kali menjalankan)

## Persyaratan Sistem

- Node.js (v14 atau lebih tinggi)
- npm atau yarn
- Smartphone dengan WhatsApp terinstall
- Koneksi internet untuk server dan smartphone

## Cara Instalasi

1. Clone repository ini:
   ```bash
   git clone https://github.com/yourusername/wa-service-api.git
   cd wa-service-api
   ```

2. Install dependensi:
   ```bash
   npm install
   ```
   atau
   ```bash
   yarn install
   ```

3. Buat file `.env` di direktori root (opsional):
   ```
   PORT=3000
   CORS_ORIGIN=*
   ```

## Cara Menjalankan Layanan

Jalankan layanan dengan perintah:

```bash
npm start
```

atau

```bash
node index.js
```

Layanan akan berjalan pada port yang dikonfigurasi (default: 3000). Anda akan melihat kode QR di terminal.

## Cara Menghubungkan Akun WhatsApp

1. Jalankan layanan
2. Setelah layanan berjalan, Anda akan melihat kode QR di terminal
3. Anda juga dapat mengunjungi `http://localhost:3000` di browser untuk melihat kode QR
4. Buka WhatsApp di ponsel Anda
5. Buka Pengaturan > WhatsApp Web/Desktop
6. Pindai kode QR
7. Setelah terhubung, Anda akan melihat pesan "WhatsApp is ready!"

⚠️ **Catatan Penting**: Perangkat yang terhubung (layanan ini) akan memiliki akses ke pesan WhatsApp Anda. Hanya gunakan layanan ini di server yang aman.

## Endpoint API

### Memeriksa Status

```
GET /status
```

Respons:
```json
{
  "status": true,
  "message": "WhatsApp is ready"
}
```

### Mengirim Pesan

```
POST /send-message
Content-Type: application/json

{
  "number": "6281234567890",
  "message": "Halo, ini adalah pesan tes"
}
```

Format `number` dapat berupa:
- Dengan kode negara: `6281234567890`
- Tanpa kode negara: `081234567890` (akan otomatis dikonversi ke format 62)

Respons (sukses):
```json
{
  "status": true,
  "message": "Message sent successfully",
  "data": {
    "to": "6281234567890",
    "formattedNumber": "6281234567890",
    "messageId": "message-id-dari-whatsapp"
  }
}
```

Respons (error):
```json
{
  "status": false,
  "message": "Pesan error"
}
```

## Contoh Penggunaan

### Contoh cURL

```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{"number":"6281234567890","message":"Halo dari WhatsApp API"}'
```

### Contoh JavaScript

```javascript
fetch('http://localhost:3000/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    number: '6281234567890',
    message: 'Halo dari WhatsApp API',
  }),
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Contoh PHP

```php
<?php
$data = array(
    'number' => '6281234567890',
    'message' => 'Halo dari WhatsApp API'
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

## Pemecahan Masalah

1. **Kode QR Tidak Muncul**: Pastikan Anda memiliki izin yang tepat untuk menjalankan aplikasi dan terminal mendukung tampilan kode QR.

2. **Masalah Koneksi**: Jika koneksi ke WhatsApp terus terputus, periksa koneksi internet Anda dan coba pindai ulang kode QR.

3. **Pesan Tidak Terkirim**: Pastikan nomor telepon diformat dengan benar dan akun WhatsApp terhubung.

## Pertimbangan Keamanan

- Layanan ini akan memiliki akses ke akun WhatsApp Anda. Hanya deploy di server yang aman.
- Gunakan variabel lingkungan untuk konfigurasi yang sensitif.
- Pertimbangkan untuk menerapkan autentikasi API jika layanan diekspos ke publik.
