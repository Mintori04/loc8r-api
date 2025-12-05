const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

const register = async (req, res) => {
    if (!req.body.name || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.setPassword(req.body.password);
    try {
        await user.save();
        const token = user.generateJwt();
        res.status(200).json({ token });
    } catch (err) {
        res.status(404).json(err);
    }
};

const login = (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    passport.authenticate('local', (err, user, info) => {
        let token;
        if (err) {
            return res.status(404).json(err);
        }
        if (user) {
            token = user.generateJwt();
            res.status(200).json({ token });
        } else {
            res.status(401).json(info);
        }
    })(req, res);
};

module.exports = {
    register,
    login
};