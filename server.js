const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const AWARDS_FILE = path.join(__dirname, 'data', 'awards.json');
const LINKS_FILE = path.join(__dirname, 'data', 'links.json');

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

const adminUser = { username: 'admin', password: 'admin123' };

const isAuthenticated = (req, res, next) => {
    if (req.cookies.auth_token === 'valid_user') return next();
    res.status(401).json({ error: 'Unauthorized' });
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminUser.username && password === adminUser.password) {
        res.cookie('auth_token', 'valid_user', { httpOnly: true }); 
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
});

const handleUpdate = (file, res, operation) => {
    fs.readFile(file, 'utf8', (err, data) => {
        let items = err ? [] : JSON.parse(data);
        operation(items);
        fs.writeFile(file, JSON.stringify(items, null, 2), () => res.json({ success: true }));
    });
};

app.get('/api/:type', (req, res) => {
    const file = req.params.type === 'awards' ? AWARDS_FILE : LINKS_FILE;
    fs.readFile(file, 'utf8', (err, data) => res.json(err ? [] : JSON.parse(data)));
});

app.post('/api/:type', isAuthenticated, (req, res) => {
    const file = req.params.type === 'awards' ? AWARDS_FILE : LINKS_FILE;
    handleUpdate(file, res, (items) => items.push({ ...req.body, id: Date.now() }));
});

app.put('/api/:type/:id', isAuthenticated, (req, res) => {
    const file = req.params.type === 'awards' ? AWARDS_FILE : LINKS_FILE;
    const id = parseInt(req.params.id);
    handleUpdate(file, res, (items) => {
        const idx = items.findIndex(i => i.id === id);
        if (idx !== -1) items[idx] = { ...req.body, id: id };
    });
});

app.delete('/api/:type/:id', isAuthenticated, (req, res) => {
    const file = req.params.type === 'awards' ? AWARDS_FILE : LINKS_FILE;
    const id = parseInt(req.params.id);
    handleUpdate(file, res, (items) => {
        const idx = items.findIndex(i => i.id === id);
        if (idx !== -1) items.splice(idx, 1);
    });
});

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));