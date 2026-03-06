const express = require('express');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create new user (unverified by default)
        const user = await User.create({
            name,
            email,
            password,
            role,
            verificationToken
        });

        // Create verification URL
        const baseUrl = process.env.BASE_URL || 'http://172.16.40.225:3000';
        const verifyUrl = `${baseUrl}/api/auth/verify/${verificationToken}`;

        // Send email
        const mailOptions = {
            from: `"Gnosis" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Verify your Gnosis Account',
            html: `
        <h1>Welcome to Gnosis, ${user.name}!</h1>
        <p>Thank you for registering. Please click the link below to verify your email address:</p>
        <a href="${verifyUrl}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>Or copy and paste this link into your browser: <br> ${verifyUrl}</p>
      `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
            } else {
                console.log("Verification email sent:", info.response);
            }
        });

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Verify email endpoint
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: #ef4444;">Invalid or expired token!</h1>
            <p>Please try registering again or contact support.</p>
          </body>
        </html>
      `);
        }

        // Verify user and remove token
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // Send a nice success page that redirects to the frontend
        res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1 style="color: #10b981;">Email Verified Successfully! 🎉</h1>
          <p>You can now close this tab and sign in.</p>
          <script>
            setTimeout(() => {
                window.location.href = "/";
            }, 3000);
          </script>
        </body>
      </html>
    `);
    } catch (error) {
        res.status(500).json({ message: 'Error verifying email', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email and explicitly select password (which is hidden by default)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // **NEW:** Check if verified
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email address before logging in.' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Logged in successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Check Role (Used by frontend to dynamic update the login quote based on email)
router.post('/check-role', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ role: null });

        const user = await User.findOne({ email });
        if (user) {
            return res.json({ role: user.role });
        }
        res.json({ role: null });
    } catch (error) {
        res.status(500).json({ role: null });
    }
});

module.exports = router;
