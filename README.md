# E_Vidyalaya_MicroServices
E_Vidyalaya_MicroServices code base
# start consule Consul server
docker run -d \
--name consul \
-p 9096:8500 \
-p 8600:8600/udp \
hashicorp/consul:1.21 \
agent -dev -client=0.0.0.0


# to check running container
docker ps
# to check running Consul server  on browser
http://localhost:9096/