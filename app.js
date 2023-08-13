require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const multer  = require('multer')
const path = require('path');
const Excel = require('exceljs');
const {analysis} = require('./analysis');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});
const upload = multer({ storage });

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

app.post('/fetch-iab-categories', async (req, res) => {
    const apiKey = process.env.GPT_API_KEY;
    const openAiApiUrl = 'https://api.openai.com/v1/chat/completions';
    const postData = {
        "model": "gpt-3.5-turbo-16k-0613",
        "messages": [
            {
                "role": "system",
                "content": "Act as an Ad-tech expert. read the content and match IAB category or subcategory title for the content. if available, sub-category is preferable. respond only title and code with a specific format. Format Example: IAB17-12: Football; IAB19-18: Internet Technology"
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
                },
                maxContentLength: 100000000,
                maxBodyLength: 1000000000
            }
        );

        const data = response.data;

        if (response.status === 200) {
            const categoryData = extractCategories(data.choices[0]['message']['content']);
            res.send(categoryData);
        } else {
            console.error('Error on else: ', data.error.message);
            res.status(500).send('An error occurred while fetching response from open AI.');
        }
    } catch (error) {
        console.error(`Error on catch: ${error}`);
        res.status(500).send('An error occurred while fetching response from open AI.');
    }
});

app.post('/fetch-keywords', async (req, res) => {
    try {
        const response = await fetchKeywordByGPT(req.body.content)
        res.send(response);
    } catch (e) {
        res.status(500).send('An error occurred while fetching response from open AI.');
    }
});

app.post('/fileupload', upload.single('siteFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: 'No file provided'});
    }

    processExcelFile(req.file.filename).then(() => {
        setTimeout(function () {
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            return res.json({fileUrl});
        }, 10000);
    }).catch(err => {
        return res.status(400).json({error: 'Process Failed'});
    });
});

async function processExcelFile(file) {
    const workbook = new Excel.Workbook();
    workbook.xlsx.readFile('uploads/'+file)
        .then(() => {
            // Get the first worksheet
            const worksheet = workbook.getWorksheet(1);
            const lastColumnIndex = worksheet.getRow(1).cellCount;
            const dobCol = worksheet.getColumn('D');
            dobCol.header = 'Yes/No';

            // Iterate over each row in the worksheet
            worksheet.eachRow(async (row, rowNumber) => {
                if (rowNumber !== 1) {
                    const urlRowData = row.getCell('B').value; // it is the urls
                    const keywordRowData = row.getCell('C').value; // keywords
                    if (urlRowData) {
                        let url = urlRowData.hyperlink
                        try {
                            const response = await axios.get(url);
                            const $ = cheerio.load(response.data);
                            const text = $('p').text();
                            row.getCell('D').value = await analysis(text, keywordRowData);
                            return workbook.xlsx.writeFile('uploads/' + file);
                        } catch (error) {
                            console.error(`Error: ${error}`);
                        }
                    }
                }
            });
        })
        .catch((error) => {
            console.error('Error reading the Excel file:', error.message)
        });
}

function extractCategories(categoryData) {
    return categoryData.split(';').map(item => item.trim()).filter(item => item.length);
}

function extractKeywords(categoryData) {
    return categoryData.split(',').map(item => item.trim()).filter(item => item.length);
}

async function fetchKeywordByGPT(content) {
    const apiKey = process.env.GPT_API_KEY;
    const openAiApiUrl = 'https://api.openai.com/v1/chat/completions';
    const postData = {
        "model": "gpt-3.5-turbo-0301",
        "messages": [
            {
                "role": "system",
                "content": "Give me top 5 keywords from this text, this text has one main topic and few small topics. please consider the main topic only, ignore small ones. example: anti-vaccine views, Turkey, economic policies"
            },
            {
                "role": "user",
                "content": content,
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
            return extractKeywords(data.choices[0]['message']['content']);
        } else {
            console.error('Error:', data.error.message);
            return new Error('An error occurred while fetching response from open AI.');
        }
    } catch (error) {
        throw new Error('An error occurred while fetching response from open AI.');
    }
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(process.env.PORT || 3003, () => console.log('Server running on port 3003'));
