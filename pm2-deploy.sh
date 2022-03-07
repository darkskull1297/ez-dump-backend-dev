cd ~/software
npm i
pm2 stop ezdump-api
pm2 start ecosystem.config.js
cd /home