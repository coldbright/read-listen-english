const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

require('dotenv').config();

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const loginRoutes = require('./config/login');
// app.use('/', loginRoutes); // 또는 app.use('/api', loginRoutes); 로도 가능


const encoder = bodyParser.urlencoded();

const connection = require('./config/db');
require('dotenv').config();

//로그인 API - JWT 발급
app.post('/login', encoder, (req, res) => {
        const { username, password } = req.body;
        console.log(username, password)

        connection.query("SELECT * FROM read_listen_english_db.user_accounts WHERE username = ?", [username], async (error, results) => {
                if (error) return res.status(500).json({ message: "서버 오류 발생" });

                if (results.length === 0) return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });

                console.log(results)
                const user = results[0];
                const match = await bcrypt.compare(password, user.password);

                if (!match) return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });

                // JWT 생성
                const token = jwt.sign(
                    { id: user.id, username: user.username, email: user.email },
                    process.env.SECRET_KEY,
                    { expiresIn: '30m' }
                );

                console.log("Login success");
                res.status(200).json({ message: "로그인 성공!", token, redirectUrl: "/main" });
        });
});


app.post("/register", async (req, res) => {
        const { username, password, password_confirm } = req.body;

        if (password !== password_confirm) {
                return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        connection.query("SELECT * FROM read_listen_english_db.user_accounts WHERE username = ?", [username], async (error, results) => {
                if (error) return res.status(500).json({ message: "서버 오류 발생" });

                if (results.length > 0) return res.status(409).json({ message: "이미 존재하는 이메일입니다." });

                try {
                        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
                        connection.query(
                            "INSERT INTO user_accounts (username, password) VALUES (?, ?)",
                            [username, hashedPassword],
                            (error) => {
                                    if (error) return res.status(500).json({ message: "회원가입 실패" });
                                    res.status(200).json({ message: "회원가입 성공", redirectUrl: "/login" });
                            }
                        );
                } catch (hashError) {
                        res.status(500).json({ message: "비밀번호 해싱 실패" });
                }
        });
});


app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

app.get('/main', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'main.html'));
})

app.get("/register", (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'register.html'));
})


server.listen(port, () => {
        console.log(`the server is runing on http://localhost:${port}`)
})