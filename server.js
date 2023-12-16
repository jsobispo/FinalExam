const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const databaseAndCollection = {db: process.env.MONGO_DB_NAME , collection: process.env.MONGO_COLLECTION};
const uri = `mongodb+srv://zashraf:jKw6vDnqGp1M1m1Z@cluster0.xqlrka0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

app.get('/', (req, res) => {
  res.render('index');
  
});

/*
app.get('/history', (req, res) => {
  res.render('history.ejs');
});
*/



app.post('/submit', async (req, res) => {
  const userInput = req.body.userInput;

  // Call the fetchData function with the user input
  const results = await fetchData(userInput);

  const tableHtml = generateTableHtml(results);
  await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(results);
  // Render the result.ejs file with the dynamic table HTML
  res.render('result', { tableHtml });
});




app.post("/history", async function (request, response) {
  await client.connect();

  let newTable = `<table border="1">
                  <tr>
                      <td><strong>Name</strong></td>
                      <td><strong>Available on</strong></td>
                  </tr>`

  console.log("***** Processing Movie/TV Show History *****");
  const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({});
  
  const result = await cursor.toArray();
  result.forEach(video => {
      newTable += `<tr>
                  <td>${video.name}</td>
                  <td>${video.services}</td>
                </tr>`;
  });
  newTable += `</table>`;
  let variable = {table: newTable}
  response.render("history.ejs", variable);
  
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

const fetchData = async (title) => {
  const url = 'https://streaming-availability.p.rapidapi.com/search/title';
  const params = {
    title: title, // Use the user input as the title
    country: 'us',
    show_type: 'all',
    output_language: 'en'
  };

  const queryString = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${queryString}`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '79973e2001msh607152a9b197f8bp11bad6jsn80152fce46a5',
      'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(fullUrl, options);
    const result = await response.json();

    // Access the streaming service information
    const streamingInfo = result.result[0]?.streamingInfo;
    if (streamingInfo) {
      const usStreamingServices = streamingInfo.us || [];

      // Extract the streaming service names
      const streamingServices = [];
      usStreamingServices.forEach(service => {
        const serviceName = service.service;
        if (!streamingServices.includes(serviceName)) {
          streamingServices.push(serviceName);
        }
      });      console.log('Streaming Services:', streamingServices);

      return { name: title, services: streamingServices }; // Adjust the return value based on the actual structure

    } else {
      console.log('No streaming information available.');
    }
  } catch (error) {
    console.error(error);
  }
};

// Function to generate HTML for the table
function generateTableHtml(results) {
    console.log('Results inside generateTableHtml:', results);
    // Check if results is an object with the expected properties
    if (!results || typeof results !== 'object' || Array.isArray(results) || !results.name || !results.services) {
      return '<p>No results found.</p>';
    }
  
    const tableRow = `
      <tr>
        <td>${results.name}</td>
        <td>${results.services.join(', ')}</td>
      </tr>
    `;
  
    return `
      <table id="result-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Available on</th>
          </tr>
        </thead>
        <tbody>
          ${tableRow}
        </tbody>
      </table>
    `;
  }
  
  
