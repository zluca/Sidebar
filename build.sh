#!/bin/sh

n=$(ls ./node_modules | wc -l)
if [ "$n" -eq '0' ]
then
	npm i svgo web-ext uglify-es
else
	npm update
fi

rm -rf ./temp

mkdir ./temp
mkdir ./temp/icons
mkdir ./builds
cp -r ./_locales ./temp/
cp *.html ./temp/
cp *.css ./temp/
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
	./node_modules/uglify-es/bin/uglifyjs --ecma 6 -cm -o ./temp/$jsFile $jsFile
	let 'i -= 1'
done

cd ./icons
svgFiles=$(ls *.svg)
i=$(ls *.svg | wc -l)
while [ "$i" -gt 0 ]
do
	svgFile=$(echo "$svgFiles" | sed -n ${i}p)
	echo $svgFile
	../node_modules/svgo/bin/svgo -p 0 -i $svgFile -o ../temp/icons/$svgFile
	let 'i -= 1'
done

cd ../temp
touch manifest.json
cat ../manifest.json | sed 's/\/\/\ //g' >> manifest.json
../node_modules/web-ext/bin/web-ext build
cd web-ext-artifacts
extName=$(ls -N *.zip)
cp -f ./"$extName" ../../builds/firefox-"$extName"

cd ../
rm manifest.json
rm -rf ./web-ext-artifacts
touch manifest.json
cat ../manifest.json | sed 's/.*\/\/\ .*//g' >> manifest.json
../node_modules/web-ext/bin/web-ext build
cd web-ext-artifacts
extName=$(ls -N *.zip)
cp -f ./"$extName" ../../builds/chromium-"$extName"

rm -rf ../../temp
