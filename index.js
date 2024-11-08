const express = require('express');
const { Client } = require('pg');
const app = express();
const port = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database configuration
const client = new Client({
    connectionString: 'postgresql://postgres:AFCcwrdBsoRrHXODQLhDrcCTQslOyYpg@junction.proxy.rlwy.net:24384/railway',
    ssl: {
        rejectUnauthorized: false // Required for Railway
    }
});

// Connect to database when server starts
client.connect()
    .then(() => {
        console.log("Connected successfully to database");
        // Only start the server after successful DB connection
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch(e => {
        console.error("Database connection error:", e);
        process.exit(1);
    });

// Your existing routes remain unchanged
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

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Handle cleanup on server shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    await client.end();
    process.exit(0);
});

// Also handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await client.end();
    process.exit(0);
});