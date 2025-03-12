package main

import (
	"crypto/tls"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	mqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/hooks/auth"
	"github.com/mochi-mqtt/server/v2/listeners"
)

func main() {
	certFile := flag.String("cert", "server.crt", "TLS certificate file")
	keyFile := flag.String("key", "server.key", "TLS key file")
	flag.Parse()

	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		done <- true
	}()

	cert, err := tls.LoadX509KeyPair(*certFile, *keyFile)
	if err != nil {
		log.Fatal(err)
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
	}

	server := mqtt.New(nil)
	err = server.AddHook(new(auth.AllowHook), nil)
	if err != nil {
		log.Fatal(err)
	}

	tcp := listeners.NewTCP(listeners.Config{
		ID:        "tls",
		Address:   ":8883",
		TLSConfig: tlsConfig,
	})

	err = server.AddListener(tcp)
	if err != nil {
		log.Fatal(err)
	}

	ws := listeners.NewWebsocket(listeners.Config{
		ID:        "ws",
		Address:   ":8884",
		TLSConfig: tlsConfig,
	})

	err = server.AddListener(ws)
	if err != nil {
		log.Fatal(err)
	}

	hc := listeners.NewHTTPHealthCheck(listeners.Config{
		ID:        "hc",
		Address:   ":8080",
		TLSConfig: tlsConfig,
	})

	err = server.AddListener(hc)
	if err != nil {
		log.Fatal(err)
	}

	stats := listeners.NewHTTPStats(
		listeners.Config{
			ID:        "stats",
			Address:   ":8081",
			TLSConfig: tlsConfig,
		},
		server.Info,
	)

	err = server.AddListener(stats)
	if err != nil {
		log.Fatal(err)
	}

	go func() {
		err = server.Serve()
		if err != nil {
			log.Fatal(err)
		}
	}()

	<-done
	server.Log.Warn("caught signal, stopping...")
	err = server.Close()
	if err != nil {
		log.Fatal(err)
	}
	server.Log.Info("main.go finished")
}
