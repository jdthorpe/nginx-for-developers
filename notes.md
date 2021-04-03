# notes

## local setup

### run NGINX

```
docker run --rm -it -p 80:80 -v $PWD/nginx-dev-server-dev-api.conf:/etc/nginx/nginx.conf nginx
```

### Start the dev (react) server

```sh
cd ./my-app
yarn 
yarn start
```

### start the echo server (a trivial backend)

```sh
docker run --rm -d -p 8080:8080 jmalloc/echo-server
```

check that it's working: 

docker run --rm -d -p 8080:8080 jmalloc/echo-server

## remote api setup

### run NGINX

```
docker run --rm -it -p 80:80 -v $PWD/nginx-dev-server-remote-api.conf:/etc/nginx/nginx.conf nginx
```

### Start the dev (react) server

```sh
cd ./my-app
yarn 
yarn start
```

### start the echo server (a trivial backend)

```sh
docker run --rm -d -p 8080:8080 jmalloc/echo-server
```

check that it's working: 

docker run --rm -d -p 8080:8080 jmalloc/echo-server


### About the remote NGINX files

Note that in the remote example config, an `upstream` block is used for the local development server, but not the remote server.  The reason is that the `upstream` block is a convenient place to put a parameter -- the name and port of the development server, but there is a catch.  The Server can't expect to care about the `Host` header in the http request (or at least not care very much).  This is because by default the host header is set to the name of the upstream block, i.e. `react_dev_server`.  Many production servers will care about this (including the Azure PAAS server I was using in the demo) and will reject requests without a matching Host header with a `404` response.

This *could* be fixed by setting the host header manually, as in the following example, but this defeats the purpose of using the upstream as a convenient place to put a the backend host name as a parameter:

```conf
upstream backend {
    server echo-explorer.azurewebsites.net:80;
}

location /api {
    proxy_pass http://backend;
    /proxy_set_header Host "echo-explorer.azurewebsites.net";
}
```