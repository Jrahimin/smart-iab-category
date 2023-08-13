const axios = require("axios");

const analysis = async (text, keyword) => {
    const apiKey = process.env.GPT_API_KEY;
    const openAiApiUrl = 'https://api.openai.com/v1/chat/completions';
    const postData = {
        "model": "gpt-3.5-turbo-16k-0613",
        "messages": [
            {
                "role": "system",
                "content": `Act as an Ad-tech expert. read the content and give only yes/no based on keywords. keywords are - ${keyword}. Respond 'yes' if any of that above mentioned keyword is related to that content.`
            },
            {
                "role": "user",
                "content": text,
            }
        ]
    };

    try {
        const response = await axios.post(openAiApiUrl, postData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                maxContentLength: 100000000,
                maxBodyLength: 1000000000
            }
        );

        const data = response.data;
        if (response.status === 200) {
            return (data.choices[0]['message']['content']).split('.')[0];
        } else {
            console.error('Error on else: ', data.error.message);
        }
    } catch (error) {
        console.error(`Error on catch: ${error}`);
    }
}

module.exports = {
    analysis
}