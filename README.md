# Server

## Deploy to Heroku

1. [Install Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)

1. Deploy a Create React App project to Heroku

   ```bash
   heroku create frontend-tricks-web -b https://github.com/mars/create-react-app-buildpack.git

   git remote add heroku https://git.heroku.com/frontend-tricks-web.git

   git push heroku master

   heroku open
   ```

1. Deploy a NodeJS project to Heroku

   ```bash
   heroku create frontend-tricks-server

   git remote add heroku https://git.heroku.com/frontend-tricks-server.git

   git push heroku master

   heroku ps:scale web=1

   heroku open
   ```

1. Generate a self-signed SSL Certificate

   ```bash
   openssl genrsa -des3 -passout pass:123456 -out server.pass.key 2048

   openssl rsa -passin pass:123456 -in server.pass.key -out server.key

   rm server.pass.key

   openssl req -new -key server.key -out server.csr

   openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.key -out server.crt
   ```

## References

1. [[Heroku] Deploying React with Zero Configuration](https://blog.heroku.com/deploying-react-with-zero-configuration)

1. [[GitHub] Heroku Buildpack for create-react-app](https://github.com/mars/create-react-app-buildpack#user-content-requires)

1) [[Create React App] Deployment](https://create-react-app.dev/docs/deployment)

1) [[Heroku] Creating a Self-Signed SSL Certificate](https://devcenter.heroku.com/articles/ssl-certificate-self)

1) [[Heroku] Getting Started on Heroku with Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true)
