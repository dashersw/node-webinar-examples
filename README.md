# Scaling node.js apps with microservices

This repository contains the examples that I presented in my webinar
[Scaling and Managing Node.js Applications with Microservices](https://www.youtube.com/watch?v=-JCbjkB4i1c).

The examples show two different ways to implement and scale microservices in Node.js. Both examples
make use of Docker containers, which are the best way to maintain your infrastructure.

The first example is implemented with the de facto solution, [nginx](https://nginx.com).

The second example is implemented using [cote](https://github.com/dashersw/cote),
an auto-discovery mesh network framework for building fault-tolerant and scalable applications,
or simply, microservices.

Have a look at the [e-commerce application case study with microservices](https://github.com/dashersw/cote-workshop)
to get a better grip at implementing and scaling the microservices architecture with Node.js.

## Set up

Run the following commands in your terminal:

```
git clone git@github.com:dashersw/node-webinar-examples.git
cd node-webinar-examples/nginx/payment-service
npm install
cd ../validation-service
npm install
cd ../../cote-example
npm install
cd ../
```

## nginx example

Nginx is one of the best web servers around. With its astonishingly flexible configuration,
it also acts a service discovery layer and a load balancer. To be a care-free scalable
microservices solution, it requires a few more pieces of technology, though.

This example makes use of Consul, Consul Templates, Registrator and DR CoN, and is largely based on this
[great article](http://www.maori.geek.nz/scalable_architecture_dr_con_docker_registrator_consul_nginx/)
by Graham Jenson.

First, make sure you have Docker installed. You need the IP address of your machine running Docker.
If you're using Docker quick start on Mac OS X, you can get the IP address by running
`docker-machine ip default` where `default` is the name of your Docker host.

For practice, the following examples makes use of `$DOCKER_IP`, which you can obtain by running 
``export DOCKER_IP=`docker-machine ip default` ``.

### Run the Consul container in the terminal:

```
docker run -it -h node -p 8500:8500 -p 8600:53/udp progrium/consul -server -bootstrap -advertise $DOCKER_IP -log-level debug
```

### Run Registrator in another terminal:

```
docker run -it -v /var/run/docker.sock:/tmp/docker.sock -h $DOCKER_IP gliderlabs/registrator consul://$DOCKER_IP:8500
```

### Run nginx in DR CoN:

First, build the Docker image from https://github.com/grahamjenson/DR-CoN:
 
```
git clone git@github.com:grahamjenson/DR-CoN.git
cd DR-CoN
docker build -t drcon .;
```

Then run a container from this image:

```
docker run -it -e "CONSUL=$DOCKER_IP:8500" -e "SERVICE=validation-service" -p 80:80 drcon
```

This will make sure that this nginx will serve the validation service and load balance between all
containers that claim this service name.

### Launch microservices

There are two services in this example, one is the payment service, which exposes a REST API to
the world for making payments, and the other one is the validation service, which is an internal,
load-balanced microservice for validating credit card numbers.

#### Run payment service

Run the payment service with the following command. Notice that this example uses [a Docker image
called node-pm2](https://hub.docker.com/r/dashersw/node-pm2/),
which is a thin image for running Node.js apps with PM2, the process manager. 

```
docker run -it -e "APP=index.js" -e "SERVICE_NAME=payment-service" -p 3000:8080 -v `pwd`/nginx/payment-service:/app dashersw/node-pm2
```

You can navigate to `http://$DOCKER_IP:8500` and see that the payment service is registered with
Consul.

You can ensure that the service is up by running `curl $DOCKER_IP:3000/pay/123456`. This should
have validated the card number `123456`, but the validation should be failing with a Bad Gateway
error from nginx. The problem? Validation service is not up yet.

#### Run validation service

This is the most fun part. Running the following command will give you a validation service, and
it will be automatically registered with Consul, which will make it available to other containers
in the system, namely, our payment service.

```
docker run -it -e "APP=index.js" -e "SERVICE_NAME=validation-service" -p 8080 -v `pwd`/nginx/validation-service:/app dashersw/node-pm2
```

Now make that curl request again, and it should complete as expected:

```
curl $DOCKER_IP:3000/pay/123456
"123456 validated"%
```

Since nginx is set up to serve any service called `validation-service`, you can launch as many as you want
and they will all be load-balanced.

Here's the same command, to run a second `validation-service`

```
docker run -it -e "APP=index.js" -e "SERVICE_NAME=validation-service" -p 8080 -v `pwd`/nginx/validation-service:/app dashersw/node-pm2
```

Make a few more curl requests and you will see the validation will be handled by the two daemons
in a round-robin fashion.

### Take away

nginx is great! If you can afford to run a lot of different technologies just to scale your microservices,
this pattern will get you a long way. Of course, it still doesn't address the problem of refactoring
microservices, which I talked about more in the webinar.

## cote.js example

Cote.js is a framework for building zero-configuration, fault-tolerant, scalable applications in Node.js.
Its auto-discovery features and advanced communication patterns in combination with superior load-balancing
features make it a good framework for microservices. Contrary to nginx, when you choose cote.js, you don't
need any other technology **at all** to scale.

Notice that you don't need Docker to run these examples, but it's just a good reflection of
a production system; so it's better to have Docker than not.

### Run payment service

Run the following command in a new terminal:

```
docker run -it -e "APP=payment-service.js" -p 3003:8080 -v `pwd`/cote-example:/app dashersw/node-pm2
```

### Run validation service

Run the following command in a new terminal. You can run it in as many terminals as you want, and
the services will be automatically load-balanced in a round-robin fashion.
```
docker run -it -e "APP=validation-service.js" -v `pwd`/cote-example:/app dashersw/node-pm2
```

### Test

Make a few curl requests with `curl $DOCKER_IP:3003/pay/123456` to see that the requests are
in fact load balanced.

If you shut down all the validation services, the curl requests will just wait until a new
service comes online. This means you won't lose any requests when there's an intermittent connection
between your services. They will just continue to work, whenever there's an established connection.

This makes cote.js extremely resistant to faults.

Note that nginx will just throw a `502 Bad Gateway` error in this scenario.

### Take away

Cote, with its extreme fault-tolerant nature, is the simplest—almost magical—solution
to scale microservices using Node.js. Its zero-conf features make sure you never worry about
where you deploy your containers, and its message based communication enables heavy refactors
when the time for maintenance finally comes.
