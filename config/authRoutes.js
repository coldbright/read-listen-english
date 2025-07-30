const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('./db');
require('dotenv').config();

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// 로그인 API - JWT 발급 및 redirectUrl 결정
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    connection.query(
        "SELECT * FROM read_listen_english_db.user_accounts WHERE username = ?",
        [username],
        async (error, results) => {
            if (error) return res.status(500).json({ message: "서버 오류 발생" });
            if (results.length === 0) return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });

            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });

            // JWT 생성 (username 포함)
            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                process.env.SECRET_KEY,
                { expiresIn: '30m' }
            );

            const redirectUrl = (user.username === 'admin') ? '/admin' : '/student';

            console.log("Login success");
            res.status(200).json({ message: "로그인 성공!", token, redirectUrl });
        }
    );
});

// 회원가입 API
router.post('/register', (req, res) => {
    const { username, name, password, password_confirm } = req.body;
    if (password !== password_confirm) {
        return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    connection.query("SELECT * FROM user_accounts WHERE username = ?", [username], async (error, results) => {
        if (error) return res.status(500).json({ message: "서버 오류 발생" });
        if (results.length > 0) return res.status(409).json({ message: "이미 존재하는 아이디입니다." });

        try {
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
            connection.query(
                "INSERT INTO user_accounts (username, password, name) VALUES (?, ?, ?)",
                [username, hashedPassword, name],
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

module.exports = router;


// 학생 검색 API
router.get('/api/search-student', (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).json({ message: "username 쿼리 파라미터가 필요합니다." });
    }

    connection.query(
        "SELECT username FROM user_accounts WHERE name = ?",
        [name],
        (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "서버 오류 발생" });
            }

            if (results.length === 0) {
                console.log("no data")
                return res.status(404).json({ message: "학생을 찾을 수 없습니다." });
            }
            console.log(results[0].username);

            connection.query(
                "SELLECT * FROM reader_table WHERE username = ?",
                [name],
                (error, results) => {
                    if (error) return res.status(500).json({ message: "서버 오류 발생" });

                    if (results.length === 0) {
                        return res.status(404).json({ message: "학생을 찾을 수 없습니다." });
                    }
                    res.json({ username: results[0].username });

                }
            )

        }
    );
});
