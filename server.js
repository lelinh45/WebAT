const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

// ========================================================
// ⚠️ CẤU HÌNH TELEGRAM (ĐÃ ĐIỀN SẴN) ⚠️
const TELEGRAM_TOKEN = '8435558992:AAHbAxlrftjQKePRCcfQ14QnBIP6NI_3Fmw';
const CHAT_ID = '6439033859';
// ========================================================

const app = express();
const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'auth.log');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- HÀM GỬI CẢNH BÁO TELEGRAM ---
async function sendTelegramAlert(ip, count) {
    console.log(`>>> 🚀 Đang gửi cảnh báo tới ID: ${CHAT_ID}...`);
    
    const message = `🚨 **CẢNH BÁO BẢO MẬT** 🚨\n\n⚠️ IP: ${ip}\n👊 Hành vi: Tấn công Brute-force\n🔢 Số lần sai: ${count}\n\n🛡️ Hệ thống đã chặn IP này 1 phút.`;
    
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log('>>> ✅ GỬI THÀNH CÔNG! Hãy kiểm tra tin nhắn Telegram.');
    } catch (error) {
        console.error('>>> ❌ Lỗi gửi:', error.message);
    }
}

function logFailure(ip) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [FAILED_LOGIN] IP: ${ip}\n`;
    fs.appendFile(LOG_FILE, logMessage, (err) => {});
}

const rateLimit = {};
const LIMIT_COUNT = 5;      
const LIMIT_TIME = 60 * 1000; 

const rateLimiterMiddleware = (req, res, next) => {
    const ip = req.ip;
    if (!rateLimit[ip]) rateLimit[ip] = { count: 0, startTime: Date.now() };
    if (Date.now() - rateLimit[ip].startTime > LIMIT_TIME) {
        rateLimit[ip] = { count: 0, startTime: Date.now() };
    }

    if (rateLimit[ip].count >= LIMIT_COUNT) {
        // Gửi tin nhắn khi vừa chạm ngưỡng
        if (rateLimit[ip].count === LIMIT_COUNT) {
            sendTelegramAlert(ip, rateLimit[ip].count);
        }
        return res.status(429).send('QUÁ NHIỀU LẦN THỬ! Vui lòng chờ 1 phút.');
    }
    next();
};

app.post('/login-vulnerable', (req, res) => {
    logFailure(req.ip);
    res.status(401).send('Sai mật khẩu!');
});

app.post('/login-secure', rateLimiterMiddleware, (req, res) => {
    const { username, password } = req.body;
    const userIp = req.ip;
    if (username === 'admin' && password === 'secure123') {
        if(rateLimit[userIp]) rateLimit[userIp].count = 0;
        res.send('Đăng nhập thành công!');
    } else {
        if(rateLimit[userIp]) rateLimit[userIp].count++;
        console.log(`Sai lần ${rateLimit[userIp].count}`);
        res.status(401).send(`Sai mật khẩu!`);
    }
});

app.listen(PORT, () => {
    console.log(`Server Telegram đang chạy tại: http://localhost:${PORT}`);
});
