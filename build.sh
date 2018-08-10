#!/bin/sh

# This script requares:

# uglifyjs
# https://www.npmjs.com/package/uglify-es

# minify
# https://github.com/tdewolff/minify

# svgo
# https://www.npmjs.com/package/svgo

# web-ext
# https://www.npmjs.com/package/web-ext

rm -rf ./temp

mkdir ./temp
mkdir ./temp/icons
mkdir ./builds
cp -r ./_locales ./temp/
cp *.html ./temp/
cp ./icons/*.gif ./temp/icons/
cp ./icons/*.png ./temp/icons/
cp LICENSE ./temp/
cp ./*.woff2 ./temp/

jsFiles=$(ls *.js)
i=$(ls *.js | wc -l)
while [ "$i" -gt 0 ]
do
	jsFile=$(echo "$jsFiles" | sed -n ${i}p)
	echo $jsFile
	uglifyjs --ecma 6 -cm -o ./temp/$jsFile $jsFile
	let 'i -= 1'
done

cssFiles=$(ls *.css)
i=$(ls *.css | wc -l)
while [ "$i" -gt 0 ]
do
	cssFile=$(echo "$cssFiles" | sed -n ${i}p)
	echo $cssFile
	minify --mime text/css -o ./temp/$cssFile $cssFile
	let 'i -= 1'
done

cd ./icons
svgFiles=$(ls *.svg)
i=$(ls *.svg | wc -l)
while [ "$i" -gt 0 ]
do
	svgFile=$(echo "$svgFiles" | sed -n ${i}p)
	echo $svgFile
	svgo -p 0 -i $svgFile -o ../temp/icons/$svgFile
	let 'i -= 1'
done

cd ../temp
touch manifest.json
cat ../manifest.json | sed 's/\/\/\ //g' >> manifest.json
web-ext build
cd web-ext-artifacts
extName=$(ls -N *.zip)
cp -f ./"$extName" ../../builds/firefox-"$extName"

cd ../
rm manifest.json
rm -rf ./web-ext-artifacts
touch manifest.json
cat ../manifest.json | sed 's/.*\/\/\ .*//g' >> manifest.json
web-ext build
cd web-ext-artifacts
extName=$(ls -N *.zip)
cp -f ./"$extName" ../../builds/chromium-"$extName"

rm -rf ../../temp