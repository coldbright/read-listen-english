const express = require('express');
const http = require("http");
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// 정적 파일 서비스
app.use(express.static(path.join(__dirname, 'public')));

// JSON 및 URL-encoded 파서
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 인증 라우트 불러오기
const authRoutes = require('./config/authRoutes');
app.use('/', authRoutes);

// JWT 인증 미들웨어
function authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ message: "로그인이 필요합니다." });

        jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
                if (err) return res.status(403).json({ message: "토큰이 유효하지 않습니다." });
                req.user = user;
                next();
        });
}

// 관리자 권한 미들웨어
function authorizeAdmin(req, res, next) {
        if (req.user.username !== 'admin') {
                return res.status(403).json({ message: "관리자 권한이 필요합니다." });
        }
        next();
}



// ‼️ 중요 ‼️ 정적 HTML 서빙 시 JWT 미들웨어 제거 (권한 검증은 API 요청 레벨에서 처리)
// 정적 페이지는 모두 인증 없이 열리도록 설정
app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/student', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

// 로그인 및 회원가입 페이지
app.get(['/', '/login'], (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// 인증 + 권한 검사용 API 예시
app.get('/api/check-admin', authenticateToken, authorizeAdmin, (req, res) => {
        res.json({ ok: true, username: req.user.username });
});

app.get('/api/check-student', authenticateToken, (req, res) => {
        res.json({ ok: true, username: req.user.username });
});


server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
});
