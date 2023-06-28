#!/bin/sh


echo ">>> ss clear"
node ./dist/index.js mongodb://localhost:27017 ss clear


echo ">>> ss eval a1 'b1 * 2 + 3'"
node ./dist/index.js mongodb://localhost:27017 ss eval a1 'b1 * 2 + 3'


echo ">>> ss eval b1 5"
node ./dist/index.js mongodb://localhost:27017 ss eval b1 5

echo ">>> ss copy d3 a1"
node ./dist/index.js mongodb://localhost:27017 ss copy d3 a1

echo ">>> ss eval e3 'e2 * 3'"
node ./dist/index.js mongodb://localhost:27017 ss eval e3 'e2 * 3'

echo ">>> ss eval e2 '4'"
node ./dist/index.js mongodb://localhost:27017 ss eval e2 '4'

echo ">>> ss dump"
node ./dist/index.js mongodb://localhost:27017 ss dump

echo ">>> ss delete e2"
node ./dist/index.js mongodb://localhost:27017 ss delete e2

echo ">>> ss dump"
node ./dist/index.js mongodb://localhost:27017 ss dump

echo ">>> ss eval c1 5"
node ./dist/index.js mongodb://localhost:27017 ss eval c1 5

echo ">>> ss eval d1 'c1 + 2'"
node ./dist/index.js mongodb://localhost:27017 ss eval d1 'c1 + 2'

echo ">>> ss copy c1 a1"
node ./dist/index.js mongodb://localhost:27017 ss copy c1 a1

echo ">>> ss dump > ~/tmp/t.json"
node ./dist/index.js mongodb://localhost:27017 ss dump > ~/tmp/t.json

echo ">>> ss-copy load ~/tmp/t.json"
node ./dist/index.js mongodb://localhost:27017 ss-copy load ~/tmp/t.json

echo ">>> ss-copy dump"
node ./dist/index.js mongodb://localhost:27017 ss-copy dump

echo ">>> ss dump"
node ./dist/index.js mongodb://localhost:27017 ss dump
