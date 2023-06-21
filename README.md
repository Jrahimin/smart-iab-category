# Smart IAB Category

This project serves as an interface between a user-provided URL and OpenAI's ChatGPT API. The user provides a URL, and our application retrieves the content from that URL. The text content is then sent to the Open AI API, which processes the information and responds with the corresponding Interactive Advertising Bureau (IAB) category. This process enables automatic content classification based on the IAB's taxonomy, aiding in the efficient organization and understanding of online content.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to install:

- [Node.js](https://nodejs.org/en/download/)

- [npm](https://www.npmjs.com/get-npm)

### Setup Process
- Clone the repository to your local machine
- Navigate into the project directory
- npm install 
- create .env from .env.example and put API key in **`GPT_API_KEY`**
- npm start
