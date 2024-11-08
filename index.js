const express = require('express');
const { Client } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// Debug logging
console.log('Environment PORT:', process.env.PORT);
console.log('Using port:', port);

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database configuration
const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:AFCcwrdBsoRrHXODQLhDrcCTQslOyYpg@junction.proxy.rlwy.net:24384/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

let server; // Declare server variable

// Connect to database when server starts
client.connect()
    .then(() => {
        console.log("Connected successfully to database");
        // Start server only if not already running
        if (!server) {
            server = app.listen(port, '0.0.0.0', () => {
                console.log(`Server running on host: 0.0.0.0, port: ${port}`);
            });

            // Handle server errors
            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`Port ${port} is already in use`);
                    process.exit(1);
                } else {
                    console.error('Server error:', error);
                    process.exit(1);
                }
            });
        }
    })
    .catch(e => {
        console.error("Database connection error:", e);
        process.exit(1);
    });

// Your routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/submit-post', async (req, res) => {
    const { neighbourhood, name, post } = req.body;
    
    try {
        await client.query(
            "INSERT INTO posts VALUES ($1, $2, $3)",
            [neighbourhood, name, post]
        );
        res.send('Post submitted successfully!');
    } catch (error) {
        console.error('Error submitting post:', error);
        res.status(500).send('Error submitting post');
    }
});

// Enhanced shutdown handlers
process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    if (server) {
        server.close(() => {
            console.log('Server closed');
            client.end().then(() => {
                console.log('Database connection closed');
                process.exit(0);
            });
        });
    } else {
        await client.end();
        process.exit(0);
    }
});

process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (server) {
        server.close(() => {
            console.log('Server closed');
            client.end().then(() => {
                console.log('Database connection closed');
                process.exit(0);
            });
        });
    } else {
        await client.end();
        process.exit(0);
    }
});