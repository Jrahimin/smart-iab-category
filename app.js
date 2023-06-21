const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors'); // Require cors module
const app = express();

// Enable All CORS Requests
app.use(cors());

app.use(express.json());

app.post('/fetch-url', async (req, res) => {
    const url = req.body.url;
    console.log('in fetch url: ', url);

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const text = $('p').text();
        res.send(text);
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('An error occurred while fetching the URL.');
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
