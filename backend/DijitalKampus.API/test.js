const http = require('http');

http.get('http://localhost:5181/api/Follow/search?keyword=zaf', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log("RESPONSE:", data); });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
