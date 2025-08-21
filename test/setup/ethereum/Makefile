SHELL=/bin/bash -o pipefail
GIT_ROOT_DIR=$(shell git rev-parse --show-toplevel)

.PHONY: provision
provision:
	@rm -rf ${GIT_ROOT_DIR}/test/setup/ethereum/signare/tokens
	@cp -r ${GIT_ROOT_DIR}/test/setup/ethereum/signare/softhsm/tokens ${GIT_ROOT_DIR}/test/setup/ethereum/signare
	docker compose up -d

.PHONY: deprovision
deprovision:
	docker compose down -v --remove-orphans
	@rm -rf ./besu/nodes/node_1/database
	@rm -rf ./besu/nodes/node_1/caches
	@rm -rf ${GIT_ROOT_DIR}/test/setup/ethereum/signare/tokens
