Feature: MVP09 — Resilience, Rate Limiting & Health
  As an Andromeda OS operator
  I want the system to handle overload and failures gracefully
  So that it remains stable under stress

  Scenario: Rate limit triggers on excess requests
    Given the rate limit is 10 requests per second
    When I send 11 requests to /v1/agents within 1 second
    Then the 11th response status is 429
    And the response body contains "ThrottlerException"

  Scenario: Circuit breaker opens after repeated provider failures
    Given the LLM provider "openai" is configured
    When the provider returns errors for 5 consecutive calls
    Then the 6th call returns status 503
    And the response body contains "circuit_open"
    And the audit log contains "Circuit OPEN: openai"

  Scenario: Circuit breaker recovers after reset timeout
    Given the circuit is OPEN for "openai"
    When 60 seconds have passed
    And the next call to the provider succeeds
    Then the circuit transitions to CLOSED
    And subsequent calls succeed normally

  Scenario: Health check returns ok when all services are up
    Given all services are running (database, python, bullmq, vault, vector-store)
    When I GET /v1/health
    Then the response status is 200
    And the response body contains "status": "ok"
    And all service statuses are "up"

  Scenario: Health check returns degraded when cognitive-python is down
    Given the cognitive-python service is unavailable
    When I GET /v1/health
    Then the response status is 200
    And the response body contains "status": "degraded"
    And "cognitive-python" status is "down"
    And the system continues operating without Python features

  Scenario: Soft deleted agent does not appear in list
    Given an agent with id "agent-123" exists
    When I DELETE /v1/agents/agent-123 as admin
    And I GET /v1/agents
    Then the response does not contain agent with id "agent-123"

  Scenario: Soft deleted agent still exists in database
    Given I have soft deleted agent "agent-123"
    When I query the database directly
    Then a record exists with id "agent-123" and deletedAt not null

  Scenario: Soft deleted agent can be restored
    Given I have soft deleted agent "agent-123"
    When I POST /v1/agents/agent-123/restore as admin
    Then the response status is 200
    And agent "agent-123" appears in GET /v1/agents again

  Scenario: Failed job appears in DLQ after max retries
    Given a task job that fails on every attempt
    And max retries is configured to 3
    When the job fails 3 times
    Then GET /v1/dlq/jobs returns the failed job
    And the job contains the original error message

  Scenario: DLQ job can be reprocessed
    Given there is a failed job in the DLQ with id "dlq-job-1"
    When I POST /v1/dlq/jobs/dlq-job-1/reprocess as admin
    Then the response status is 200
    And the job is removed from the DLQ
    And a new job is added to the main task queue

  Scenario: Manual backup can be triggered by owner
    Given I am authenticated as owner
    When I POST /v1/backup/trigger
    Then the response status is 200
    And the response contains a filename like "andromeda-*.sql.gz"

  Scenario: Agent loop protection halts task after max iterations
    Given a task is executing with an agent in a loop
    When the task reaches 50 iterations
    Then the task status is set to "failed"
    And the failure reason is "MAX_ITERATIONS_EXCEEDED"
    And no further LLM calls are made
