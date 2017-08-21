ssh kiko@ubkif <<EOI
  cd /home/kiko/subcity
  git pull
  npm install
  npm run build
  pm2 restart subcity
EOI

#
# ssh -t kiko@ubkif "pm2 stop subcity"
#
# # Cleanup
# ssh -t root@ubkif "rm -rf ${proj_dir}/public/html"
# ssh -t root@ubkif "rm -rf ${proj_dir}/public/dist"
# ssh -t root@ubkif "rm -rf ${proj_dir}/server"
# ssh -t root@ubkif "rm ${proj_dir}/package.json"
#
# # ssh -t root@ubkif "mkdir ${proj_dir}"
#
# # Copy assets
# scp -r ${project}/public/html kiko@ubkif:${proj_dir}/public
# scp -r ${project}/public/dist kiko@ubkif:${proj_dir}/public
# scp -r ${project}/server kiko@ubkif:${proj_dir}
# scp ${project}/package.json kiko@ubkif:${proj_dir}
#
# # Install npm dependencies
# # ssh -t kiko@ubkif "cd ${proj_dir} && npm install --production"
#
# # Set permissions
# ssh -t root@ubkif "chmod -R 755 ${proj_dir}"
# ssh -t root@ubkif "chown -R kiko ${proj_dir}"
#
# ssh -t kiko@ubkif "pm2 start subcity"
