import mqtt from 'mqtt'
import fs from 'fs'

const options: mqtt.IClientOptions = {
  protocolVersion: 5,
  autoUseTopicAlias: true,
  autoAssignTopicAlias: true,
  ca: fs.readFileSync('./rootCA.pem'),
  cert: fs.readFileSync('./client.crt'),
  key: fs.readFileSync('./client.key'),
}

const client = mqtt.connect("mqtts://127.0.0.1:8883", options)

client.subscribe('location/gps/vehicle1')

// Publish a message and assign an alias to the topic
const pubOps: mqtt.IClientPublishOptions = {
  retain: true,
  properties: {
    topicAlias: 1
  }
}
client.publish('location/gps/vehicle1', 'Hello MQTT', pubOps)

// On the next publish, the topic alias value will be used (insted of the entire topic string) when communicating with the broker
client.publish('location/gps/vehicle1', 'Still here')

client.on("message", function (topic, message) {
  console.log("Received message on topic " + topic + ": " + message)
})

client.on("offline", function () {
  console.log("Client is offline")
})

client.on("reconnect", function () {
  console.log("Reconnecting to MQTT broker")
})

client.on("end", function () {
  console.log("Connection to MQTT broker ended")
})