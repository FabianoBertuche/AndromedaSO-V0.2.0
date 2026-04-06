Feature: MVP09 — IAM Authentication & Authorization
  As an Andromeda OS user
  I want proper authentication and role-based access
  So that only authorized users can access the system

  Background:
    Given the system has the following users:
      | email                    | role     | tenantId        |
      | owner@andromeda.local    | owner    | default-tenant  |
      | admin@andromeda.local    | admin    | default-tenant  |
      | operator@andromeda.local | operator | default-tenant  |
      | viewer@andromeda.local   | viewer   | default-tenant  |

  Scenario: Successful login returns JWT tokens
    When I POST /v1/auth/login with:
      | email    | owner@andromeda.local |
      | password | correct-password      |
    Then the response status is 200
    And the response body contains "accessToken"
    And the response body contains "refreshToken"
    And the response body contains "role": "owner"

  Scenario: Invalid credentials return 401
    When I POST /v1/auth/login with:
      | email    | owner@andromeda.local |
      | password | wrong-password        |
    Then the response status is 401
    And the response body contains "Invalid credentials"

  Scenario: Request without token returns 401
    When I GET /v1/agents without Authorization header
    Then the response status is 401

  Scenario: Viewer cannot delete agents
    Given I am authenticated as "viewer@andromeda.local"
    When I DELETE /v1/agents/any-agent-id
    Then the response status is 403

  Scenario: Owner can access all endpoints
    Given I am authenticated as "owner@andromeda.local"
    When I GET /v1/agents
    Then the response status is 200

  Scenario: Admin can create agents
    Given I am authenticated as "admin@andromeda.local"
    When I POST /v1/agents with valid agent payload
    Then the response status is 201

  Scenario: Operator cannot delete agents
    Given I am authenticated as "operator@andromeda.local"
    When I DELETE /v1/agents/any-agent-id
    Then the response status is 403

  Scenario: Refresh token generates new access token
    Given I have a valid refresh token
    When I POST /v1/auth/refresh with the refresh token
    Then the response status is 200
    And the response body contains a new "accessToken"

  Scenario: Revoked refresh token returns 401
    Given I have a refresh token
    And I have already logged out (token revoked)
    When I POST /v1/auth/refresh with the revoked token
    Then the response status is 401

  Scenario: API Key authentication works
    Given I have a valid API Key
    When I GET /v1/agents with header "X-Api-Key: <valid-key>"
    Then the response status is 200

  Scenario: Tenant isolation — user cannot see other tenant data
    Given "user-a@tenant-a.com" has tasks in "tenant-a"
    And "user-b@tenant-b.com" has tasks in "tenant-b"
    When I GET /v1/tasks as "user-b@tenant-b.com"
    Then the response does not contain tasks from "tenant-a"
