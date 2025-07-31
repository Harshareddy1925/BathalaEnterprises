// server.js

// --- 1. SETUP ---
// Import required packages
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Create an Express application
const app = express();
const PORT = 3000;

// --- 2. MIDDLEWARE ---
// Enable Cross-Origin Resource Sharing (CORS) so the frontend can talk to this server
app.use(cors());
// Parse JSON bodies from incoming requests
app.use(express.json());
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. DATABASE SETUP ---
// Path to the simple JSON database file
const DB_PATH = path.join(__dirname, 'db.json');

// Helper function to read data from db.json
const readDB = () => {
    // If the db.json file doesn't exist, create it with a default structure
    if (!fs.existsSync(DB_PATH)) {
        const defaultData = {
            properties: [
                { id: 1, title: "Modern 3BHK Apartment", location: "Koramangala", image: "uploads/default1.jpg" },
                { id: 2, title: "Luxury 2BHK Villa", location: "Whitefield", image: "uploads/default2.jpg" }
            ],
            services: [
                { id: 1, name: "Security Officers", description: "Professional security for all properties." }
            ],
            users: [
                { id: 1, username: "admin", password: "password123" } // IMPORTANT: In a real app, hash passwords!
            ]
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    }
    // Read and parse the database file
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

// Helper function to write data to db.json
const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- 4. FILE UPLOAD (MULTER) SETUP ---
// Configure where to store uploaded files and how to name them
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create the 'uploads' directory if it doesn't exist
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename to avoid conflicts
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// --- 5. API ROUTES ---

// == ADMIN LOGIN ==
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.username === username && u.password === password);

    if (user) {
        // In a real app, you would return a JWT (JSON Web Token) here for secure sessions
        res.status(200).json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

// == PROPERTIES (CRUD) ==
// GET all properties
app.get('/api/properties', (req, res) => {
    const db = readDB();
    res.status(200).json(db.properties);
});

// ADD a new property
app.post('/api/properties', upload.single('image'), (req, res) => {
    const { title, location } = req.body;
    const image = req.file; // Multer adds the file object to the request

    if (!title || !location || !image) {
        return res.status(400).json({ success: false, message: 'Missing title, location, or image.' });
    }
    
    const db = readDB();
    const newProperty = {
        id: db.properties.length > 0 ? Math.max(...db.properties.map(p => p.id)) + 1 : 1,
        title,
        location,
        image: image.path // Store the path to the uploaded image
    };
    
    db.properties.push(newProperty);
    writeDB(db);
    
    res.status(201).json({ success: true, message: 'Property added successfully', property: newProperty });
});

// DELETE a property by ID
app.delete('/api/properties/:id', (req, res) => {
    const propertyId = parseInt(req.params.id, 10);
    const db = readDB();
    const propertyIndex = db.properties.findIndex(p => p.id === propertyId);

    if (propertyIndex !== -1) {
        // Optional: Delete the associated image file from the server
        const property = db.properties[propertyIndex];
        if (fs.existsSync(property.image)) {
            fs.unlinkSync(property.image);
        }
        
        db.properties.splice(propertyIndex, 1);
        writeDB(db);
        res.status(200).json({ success: true, message: 'Property deleted successfully' });
    } else {
        res.status(404).json({ success: false, message: 'Property not found' });
    }
});


// == SERVICES (CRUD) ==
// GET all services
app.get('/api/services', (req, res) => {
    const db = readDB();
    res.status(200).json(db.services);
});

// ADD a new service
app.post('/api/services', (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
        return res.status(400).json({ success: false, message: 'Service name and description are required.' });
    }

    const db = readDB();
    const newService = {
        id: db.services.length > 0 ? Math.max(...db.services.map(s => s.id)) + 1 : 1,
        name,
        description
    };
    
    db.services.push(newService);
    writeDB(db);
    
    res.status(201).json({ success: true, message: 'Service added successfully', service: newService });
});

// DELETE a service by ID
app.delete('/api/services/:id', (req, res) => {
    const serviceId = parseInt(req.params.id, 10);
    const db = readDB();
    const serviceIndex = db.services.findIndex(s => s.id === serviceId);

    if (serviceIndex !== -1) {
        db.services.splice(serviceIndex, 1);
        writeDB(db);
        res.status(200).json({ success: true, message: 'Service deleted successfully' });
    } else {
        res.status(404).json({ success: false, message: 'Service not found' });
    }
});

// == CONTACT FORM ==
app.post('/api/contact', (req, res) => {
    const { name, email, service, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    // In a real application, you would send an email here using a service like Nodemailer.
    // For this example, we'll just log it to the console.
    console.log('--- New Contact Form Submission ---');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Service: ${service}`);
    console.log(`Message: ${message}`);
    console.log('------------------------------------');

    res.status(200).json({ success: true, message: 'Thank you for your message! We will get back to you soon.' });
});

// --- 6. START SERVER ---
app.listen(PORT, () => {
    console.log(`Backend server is running at http://localhost:${PORT}`);
    // Initialize the database on first run
    readDB();
});
