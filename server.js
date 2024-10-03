const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const path = require("path");

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lance le serveur sur le port 3000
app.listen(PORT, () => {
  console.log(`Server is running : http://localhost:${PORT}`);
});
