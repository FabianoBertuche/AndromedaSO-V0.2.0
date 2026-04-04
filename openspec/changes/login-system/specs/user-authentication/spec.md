## ADDED Requirements

### Requirement: User Can Authenticate With Valid Credentials
The system SHALL authenticate a user when valid credentials are submitted and SHALL create an authenticated session for subsequent protected requests.

#### Scenario: Successful login
- **WHEN** a user submits valid credentials to the login endpoint
- **THEN** the system returns success with authenticated session information

#### Scenario: Invalid credentials
- **WHEN** a user submits invalid credentials to the login endpoint
- **THEN** the system returns an authentication error without creating a session

### Requirement: System Provides Explicit Session State
The system SHALL expose a session status endpoint that indicates whether the current requester is authenticated.

#### Scenario: Authenticated session check
- **WHEN** an authenticated requester calls the session endpoint
- **THEN** the system returns that the requester is authenticated

#### Scenario: Unauthenticated session check
- **WHEN** an unauthenticated requester calls the session endpoint
- **THEN** the system returns that no authenticated session is active

### Requirement: User Can Terminate Session
The system SHALL allow an authenticated user to end their current session via logout.

#### Scenario: Successful logout
- **WHEN** an authenticated user calls the logout endpoint
- **THEN** the system invalidates the active session and returns success

### Requirement: Protected Routes Require Authentication
The system SHALL reject unauthenticated access to protected resources.

#### Scenario: Access protected route without session
- **WHEN** an unauthenticated requester calls a protected endpoint
- **THEN** the system returns an unauthorized response

#### Scenario: Access protected route with session
- **WHEN** an authenticated requester calls a protected endpoint
- **THEN** the system allows access according to endpoint behavior
