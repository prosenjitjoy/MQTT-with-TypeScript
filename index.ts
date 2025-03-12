import mqtt from 'mqtt'
import fs from 'fs'

const options: mqtt.IClientOptions = {
  protocolVersion: 5,
  reconnectPeriod: 3000,
  ca: fs.readFileSync('./rootCA.pem'),
  cert: fs.readFileSync('./client.crt'),
  key: fs.readFileSync('./client.key'),
  will: {
    topic: 'lastwill',
    payload: 'Goodbye',
    qos: 1,
    retain: true
  }
}

const client = mqtt.connect("mqtts://127.0.0.1:8883", options)

client.on("connect", function (conack) {
  console.log("connection successful")
  // console.log(conack)

  const subOps: mqtt.IClientSubscribeOptions = {
    nl: false,
    qos: 1,
    rap: false,
    rh: 0,
    properties: {
      subscriptionIdentifier: 42,
      userProperties: {
        name: "joy",
        age: "28",
      },
    }
  }
  client.subscribe("presence", subOps, function (err, granted) {
    if (err) {
      console.error(err)
      return
    }
    if (granted) {
      console.log(granted)
    }

    const pubOps: mqtt.IClientPublishOptions = {
      retain: false,
      dup: false,
      qos: 2,
      properties: {
        userProperties: {
          sensorID: "fasdf"
        },
      },
    }
    client.publish("presence", "Hello mqttfasdfss", pubOps, function (err, packet) {
      if (err) {
        console.error("Failed to publish message", err)
        return
      }
      console.log('Message published with retain flag set to true')
      if (packet) {
        console.log(packet)
      }
    })
  })

  client.subscribe('lastwill', function (err) {
    if (err) {
      return
    }
  })
})

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

// client.end({
//   reasonCode: 0x04,
//   properties: {
//     reasonString: 'Closing connection with Will Message'
//   }
// })