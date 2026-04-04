/**
 * Global setup for integration tests.
 * Sets DOCKER_HOST to TCP endpoint for testcontainers on Windows.
 * Requires Docker Desktop with "Expose daemon on tcp://localhost:2375" enabled.
 */
process.env['DOCKER_HOST'] = 'tcp://localhost:2375';
