const express = require('express');
const http = require("http");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');

const app = express();
const encoder = bodyParser.urlencoded();

const connection = require('./db');
require('dotenv').config();

//로그인 API - JWT 발급
app.post('/login', encoder, (req, res) => {
    const { username, password } = req.body;

    connection.query("SELECT * FROM read_listen_english_db.user_accounts WHERE username = ?", [username], async (error, results) => {
        if (error) return res.status(500).json({ message: "서버 오류 발생" });

        if (results.length === 0) return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });

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
        res.status(200).json({ message: "로그인 성공!", token, redirectUrl: "/" });
    });
});

//회원가입 API
app.post("/register", async (req, res) => {
    const { username, email, password, password_confirm } = req.body;

    if (password !== password_confirm) {
        return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    connection.query("SELECT * FROM user_acount WHERE email = ?", [email], async (error, results) => {
        if (error) return res.status(500).json({ message: "서버 오류 발생" });

        if (results.length > 0) return res.status(409).json({ message: "이미 존재하는 이메일입니다." });

        try {
            const hashedPassword = await bcrypt.hash(password, process.env.SALT_ROUNDS);
            connection.query(
                "INSERT INTO user_acount (username, email, password) VALUES (?, ?, ?)",
                [username, email, hashedPassword],
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