const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// remove the bad style tag from the end
html = html.replace('<style> *:focus { outline: none !important; } </style>', '');

// add it before the closing </style> tag in the head
html = html.replace('</style>', '    *:focus { outline: none !important; }\n    </style>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed index.html focus outlines');
