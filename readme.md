# NGINX on Docker for Web Developers

When you start building a modern Javascript powered web app (i.e. React, Vue,
Angular and friends), the scaffolding that sets up the initial project also
creates a development server that that is started with `npm start` or `yarn start`,
and listens on port 3000. That development server is great for creating a
standalone web site, but most web sites also have a backend server that
you'll need to reach out to at some point using an AJAX request.

When coding up an AJAX request, the best practice is to use relative URLs which
exclude host such as `/api/create-user`, because it makes your code portable
across the development, testing, and production environments. However,
this means that the server hosting your web site also needs to host the
backend API, because requests to relative url will be made to the host where
the webpage was loaded to begin with. Therefor in each environment where your
web app is served (dev, test, prod, etc.) you need to integrate the backend
with the web app.

You could go down the road of serving the web-app from your api, but that can
get a bit messy as every time someone needs to update the web app, they also
need to cobble together at least a shell of the back end on their local
machine, which can be a pain to set up and even more painful to maintain as
backend servers evolve over time.

A better solution is to have a dedicated proxy which listens for requests and
routes requests for the backend to a backend server, and routes requests for
other app resources to the development server or to static files compiled by
the development scaffolding (typically the [webpack
DevServer](https://webpack.js.org/configuration/dev-server/)).

In addition, modern frameworks use live updating to reflect your code changes
immediately in the browser with out having to refresh the page. This feature
is enabled via a web-socket connection between the browser and the local
development server, and the proxy will need to allow for that connection in
order to maintain a sensible development environment

NGINX (pronounced "engine-X") is a super fast and battle tested
reverse-proxy, which can easily handle these requirements with just a little
configuration. In addition, a pre-compiled Docker image makes it possible to
spin up an NGINX proxy on your dev machine with a single command, which can
seamlessly enable any combination of the following:

* Using a modern web-development servers with live updates provided by a web-socket
* Hosting the front end from pre-built static files, for example when working on updates to a backend API
* Hosting back end servers on your local machine on a remote server via http or https

## Goals

Both Docker and NGINX are deep topics and I'm only going to scratch the
surface. However, for the present task, you don't need deep knowledge of
either and hopefully with a few minutes investment, you'll know enough to set
up your dev environment with to easily start working with a backend server
hosted locally on your dev machine or on a remote server (possibly the
production server).

## Why docker?

Docker lets you run containers, which you should think of as applications
that are completely isolated from the rest of the world by default, unless
you tell docker exactly how to want them to connect to them from the outside
world.

We'll use this to spin up a pre-built NGNIX reverse proxy with a single line
of code, without having to go through the hassle of compiling NGINX from
scratch.

## Why NGINX?

NGINX is a super fast and battle tested reverse proxy which will do the job
we need with minimal configuration.

## The Demo Web-App

In the `/my-app` folder, there is a demo React app. Using NGINX in docker will work
work with almost any development framework especially those that use the [webpack
DevServer](https://webpack.js.org/configuration/dev-server/).

The demo React dev server  can be started with

```sh
cd ./my-app
yarn
yarn start
```

and will listen on port 3000 when started.

## Running the demo backend server locally

The React web app makes calls to '/api/echo' which need to be routed to the a
container running the `jmalloc/echo-server` docker image. The `echo-server`
server listens on port 8080 in the running container, and returns (echos) the
contents of each request it receives. If you already have docker installed
this can be run locally.

```sh
docker run --rm -d -p 8080:8080 jmalloc/echo-server
```

To break this command down, we're telling `docker` to `run` a container based
on the `jmalloc/echo-serve` image, and that:

* `--rm` -- the running container should be removed after it stops
* `-d` -- it should run in the background (i.e. in  detached mode)
* `-p 8080:8080` -- port 8080 of this computer (i.e. the 'host' machine) should be mapped to port `8080` of the running container

Once this starts. calling `docker container ls` should include something like
the following:

```sh
CONTAINER ID   IMAGE                COMMAND             CREATED        STATUS        PORTS                  NAMES
37ddbabf9324   jmalloc/echo-server  "/bin/echo-server"  29 hours ago   Up 1 Minutes  0.0.0.0:8080->8080/tcp condescending_carson
```

With this running, you can visit `localhost:8080` in your browser to view the
request that is sent and echo'd by the running `echo-server`. Finally, this
container can be stopped by calling `docker container stop 37dd` where `37dd`
are the first few characters of the container ID

## Running the demo backend server on a remote server

For these demo's, I ran the same echo server on Azure App Service, which is a
PaaS Offering that is capable of hosting docker containers. The demo app was
hosted at `https://echo-explorer.azurewebsites.net`. It may not be running by
the time you read this app, but what matters is that it is a placeholder for
your backend server in the demo configuration files.

### Starting NGINX on Docker

Like the echo-server above, an NGINX proxy can be started with a simple `docker
run` command. The biggest change here is that a config file is being mapped
from the local machine into the running container to configure the NGINX
instance using the `-v` option in the `docker run` command. Note that to map
a file from the host machine into the docker image, you need to provide an
absolute path which I've provided here using the `$PWD` environment variable
provided by bash in unix like systems:

```sh
docker run --rm -it -p 5000:80 -v $PWD/nginx-dev-server-dev-api.conf:/etc/nginx/nginx.conf nginx
```

and here using `%CD%` in windows terminal:

```bat
docker run --rm -it -p 5000:80 -v %CD%/nginx-dev-server-dev-api.conf:/etc/nginx/nginx.conf nginx
```

Note also that the `-it` flag causes the output from NGINX to be piped to the
terminal, which can be handy for debugging. With this flag set, the NGINX
container can also be stopped using `control+C`, which is handy too.  

Note also that the NGINX image is listening to port 80 inside the docker container, but port 80 in the container is mapped to port 5000 on the local machine with the `-p 5000:80` so you can connect to the running NGINX proxy by visiting `http:/localhost:5000/` in the browser.

## NGINX configuration files

A handful of configuration files are provided in this repo. While I won't go
in depth on NGINX config files, I hope that a few examples will be enough to
get you going with minimal effort.  

When you open the `nginx-dev-server-dev-api.conf` file, the first three lines
and the events block (`events {...}`) are essentially boiler plate code, that
sets up some useful defaults. The http block (`http {...}`) is where the real
action happens as this is where the rules that send some requests to the
backend api, others to the web development server, and others to static
files.

The `upstream` blocks define a logical group of servers that NGINX can load
balance requests between. In the included configuration files each upstream
only includes a single server, so NGINX won't be doing load balancing.
Instead, this is just a convenient place where we can put the address of a
an upstream server without having to repeat it throughout the configuration.
Note that `host.docker.internal` refers to `localhost` on your machine since
NGINX is running inside a docker container. Hence requests routed to
`host.docker.internal:3000` in the docker container will be forwarded to the
development server listening at `localhost:3000`.

Next the `server {...}` block is where the routing rules are defined and the
`listen 80;` command tells NGNINX to listen on port 80 (in the docker
container). The first location location block in the server sets the `react_dev_server`
upstream as default for requests that don't match any other block:

```conf
location / {
    proxy_pass http://react_dev_server;
}
```

and the following location block tells NGINX to route requests that begin
with `/api` (such as '/api/create-user`) to the api upstream server:

```conf
location /api {
    proxy_pass http://api;
}
```

In these location blocks use prefix matching so `/api` block will handle
requests that start with `/api`, and although the default route (`/`) also
matches requests that start with `/api`, when two location blocks of this
type match the same request, the longest prefix wins, so the `/api` location
block will handle requests for `/api/create-user`

The final location block (`location /sockjs-node { ... }`) handles the web-socket
connection made at `localhost:3000/sockjs-node` between the browser and the
[webpack DevServer](https://webpack.js.org/configuration/dev-server/), which
is used by several modern JS frameworks, such as React, Vue, and Angular.

The last option that I'll cover here is serving static content. Frameworks
like React let you build your application code into a set of static files
that you can serve without the need for a dedicated server. NGINX can serve
these files with the use of the `try_files` command, illustrated in the
`nginx-static-app-dev-api.conf` example. The important parts of this example are:

* `root /www/data;` tells NGINX to serve static files from the `/www/data` folder
* `try_files $uri /index.html;` tells NGINX to try to find a file with the
    matching URI, otherwise serve the `/index.html` file. This is the default
    common to single page applications
* `index index.html index.htm;` tells NGINX to serve the `index.html` page when
    users visit the root path (`/`)
* `include mime.types;` tells NGINX include the standard mime type headers
  defined in `/etc/nginx/mime.types` of the NGINX image

### Proxying a remote backend API

In the `nginx-dev-server-remote-api.conf` file, there are two
changes from the local-api config file. First, I've replaced the `location /api {..}`
block with a literal reference to the remote server, and I've removed the
`upstream api` block as follows:

```conf
location /api {
    proxy_pass http://echo-explorer.azurewebsites.net;
}
```

The reason for this is that when using the `upstream` NGINX sets the `Host`
header to the name of the upstream block (`api` in the local dev server example). This
was incompatible with the PaaS offering that hosted the remote server and
resulted in a `404` from the app service. Using the actual server name in the
location block fixed that.

### Proxying a backend server over https

If the backend server requires a secure (https) connection, NGINX can easily
handle this requirement, and an example is provided in the
`nginx-dev-server-remote-api-ssl.conf` config file. This is accomplished by
setting the protocol in the `proxy_pass` directive to `https` and adding the
`proxy_ssl_server_name on;` directive to the location context like this:

```conf
location /api {
    proxy_pass https://echo-explorer.azurewebsites.net;
    proxy_ssl_server_name on;
}
```

Lastly, I've read that with this simple configuration NGINX does not validate the SSL
certificate, so this is not a solution you want to use on an untrusted
network such as an aiport or coffeshop. NGINX can be [configured to validate upstream
certificates](https://docs.nginx.com/nginx/admin-guide/security-controls/securing-http-traffic-upstream/#configuring-upstream-servers),
though a bit more effort is required.

### Included config files

* `nginx-dev-server-dev-api.conf` proxies the (React) development server
    listening on `localhost:3000` and an api server listening on `localhost:8080`
* `nginx-dev-server-remote-api.conf` proxies the (React) development server
    listening on `localhost:3000` and a remote api hosted at
    `http://echo-explorer.azurewebsites.net`
* `nginx-dev-server-remote-api-ssl.conf` proxies the (React) development server
    listening on `localhost:3000` and a remote api hosted at
    `https://echo-explorer.azurewebsites.net` over https
* `nginx-static-app-dev-api.conf` serves the static files build using `yarn build`
     and proxies an api server listening on `localhost:8080`

## Putting it all together

When setting up your development environment, you'll aways begin by starting
up your applications dev server. In this demo, we start a React dev server
with these three lines:

```sh
cd ./my-app
yarn
yarn start
```

### Scenario 1: Building a web-app and it's API

Next, you need to decide if you want to run the backend api locally or
remotely. To run the demo api locally, use the following to start the
`echo-server` listening on port 8080

```sh
docker run --rm -d -p 8080:8080 jmalloc/echo-server
```

and lastly you can start up the NGINX proxy like so:

```sh
docker run --rm -it -p 5000:80 -v $PWD/nginx-dev-server-dev-api.conf:/etc/nginx/nginx.conf nginx
```

Or using `%CD%` in place of `$PWD` if you are using a windows machine. With
all that in place, you can open your browser to `localhost:5000` and start
developing your web app to your heart's content.

### Scenario 2: Building a web-app with an existing (remote) API

Often times you will be making changes to a Web App using a backend API
hosted on a remote server -- possibly even the production backend. In this
case, you just need to update the `remote-api` or `remote-api-ssl` config
files to point to your app's API server and start the proxy like so:

```sh
docker run --rm -it -p 5000:80 -v $PWD/nginx-dev-server-remote-api.conf:/etc/nginx/nginx.conf nginx
```

Or using `%CD%` in place of `$PWD` if you are using a windows machine. With
all that in place, you can open your browser to `localhost:5000` and start
developing your web app to your heart's content.

### Scenario 3: Working on a backend API for an existing web app

When making changes to a backend API code, you may wish to ensure that you don't
break an existing web app. In this scenario you may wish to use `yarn build`
to create a set of static files that contain the application code in the
`./build` folder and have NGINX serve the the web app along side the local
dev server you are working on.

In this case you'll begin by starting up your dev API (e.g. `nodemon
index.js` in the case of a Python or Node server), and then serve the
pre-built web-app along with the local development backend API using:

```sh
docker run --rm -it -p 5000:80 -v $PWD/my-app/build:/www/data -v $PWD/nginx-static-app-dev-api.conf:/etc/nginx/nginx.conf nginx
```

Or using `%CD%` in place of `$PWD` if you are using a windows machine. With
all that in place, you can open your browser to `localhost:5000` and start
developing your backend API and view the results in your pre-build web-app in
real time.

Another alternative to this same scenario would be to set the default
location block to proxy an remote web-app with `proxy_pass
http://some-real-site.com;` and proxy api requests to your local backend api
server.

Happy Developing!
