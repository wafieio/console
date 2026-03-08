REGISTRY ?= docker.io/wafieio

image:
	docker buildx build \
	--platform linux/arm64,linux/amd64 \
	--push \
	-t $(REGISTRY)/wafie-console:latest .