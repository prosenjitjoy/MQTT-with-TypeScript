keypair:
	mkcert -cert-file client.crt -key-file client.key localhost 127.0.0.1 ::1

rootca:
	$(eval path := $(shell mkcert -CAROOT))
	cp $(path)/rootCA.pem .