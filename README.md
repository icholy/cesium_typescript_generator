
## This is an ugly hack. 

``` sh
cd cesium
jsdoc -c ./Tools/jsdoc/conf.json -X > docs.json

cd cesium_typescript_generator
node main.js docs.json > cesium.d.ts
```
