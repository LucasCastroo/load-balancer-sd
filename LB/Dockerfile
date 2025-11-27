FROM nginx:alpine

# copia sua config personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Railway uses PORT env var
# We use sed to replace the hardcoded port 8880 with the $PORT environment variable provided by Railway
CMD ["/bin/sh", "-c", "sed -i 's/listen 8880;/listen '\"$PORT\"';/g' /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
