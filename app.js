require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();

// Enable All CORS Requests
app.use(cors());

app.use(express.json());

app.post('/fetch-url', async (req, res) => {
    const url = req.body.url;
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

app.post('/fetch-gpt-response', async (req, res) => {
    const apiKey = process.env.GPT_API_KEY;
    const openAiApiUrl = 'https://api.openai.com/v1/chat/completions';
    const postData = {
        "model": "gpt-3.5-turbo-0301",
        "messages": [
            {
                "role": "system",
                "content": "Act as an Ad-tech expert. read the content and match IAB category or subcategory title for the content. if available, sub-category is preferable. respond only title. Example: Soccer/Football"
            },
            {
                "role": "user",
                "content": req.body.content,
            }
        ]
    };

    try {
        const response = await axios.post(openAiApiUrl, postData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        const data = response.data;

        if (response.status === 200) {
            const categoryData = extractCategories(data.choices[0]['message']['content']);
            res.send(categoryData);
        } else {
            console.error('Error:', data.error.message);
            res.status(500).send('An error occurred while fetching response from open AI.');
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('An error occurred while fetching response from open AI.');
    }
});

function extractCategories(categoryData) {
    return categoryData;
    // Implement your logic to extract categories from the response text
    // and return them as an array
    // Example:
    return ['Category 1', 'Category 2', 'Category 3'];
}

app.listen(process.env.PORT || 3003, () => console.log('Server running on port 3003'));
