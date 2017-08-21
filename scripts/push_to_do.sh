# This script deploy the app to Digital Ocean server

# Do not forget to push
git push

ssh kiko@ubkif <<EOI
  cd /home/kiko/subcity
  git pull
  npm install
  npm run build
  pm2 restart subcity
EOI
