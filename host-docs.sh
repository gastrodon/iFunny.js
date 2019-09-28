#! /bin/bash

mkdir -pv ~/ifunnyjs-docs/docs/
./node_modules/.bin/jsdoc -c jsdoc.json
cp -r ./out ~/ifunnyjs-docs/docs/
npm run clean
