#! /bin/sh
echo 'start build at ' $(date)
rsync -av $proj/acode/acode-plugin-gitclient ~/projects
cd ~/projects/acode-plugin-gitclient
rm dist.zip
rm -r dist
# rm package-lock.json
# npm install
npm run build-release
cp dist.zip $proj/acode/acode-plugin-gitclient
cd $proj/acode/acode-plugin-gitclient
echo 'build ok at ' $(date)