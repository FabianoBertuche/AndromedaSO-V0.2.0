import { GatewayMessageRequestDto } from "../dto/gateway-message.request.dto";

const ALLOWED_CHANNELS = new Set(["web", "telegram", "discord", "cli", "mobile"]);
const ALLOWED_CONTENT_TYPES = new Set(["text", "json", "event", "command"]);
const MAX_TEXT_LENGTH = Number(process.env.GATEWAY_MAX_TEXT_LENGTH || 20000);
const MAX_ID_LENGTH = 128;

export class GatewayValidationError extends Error {
    constructor(message: string, public readonly field: string) {
        super(message);
        this.name = "GatewayValidationError";
    }
}

export function validateGatewayMessageRequest(input: GatewayMessageRequestDto) {
    if (!input || typeof input !== "object") {
        throw new GatewayValidationError("Gateway payload is required", "body");
    }

    if (!input.channel || !ALLOWED_CHANNELS.has(input.channel)) {
        throw new GatewayValidationError("Channel is invalid", "channel");
    }

    if (!input.content || typeof input.content !== "object") {
        throw new GatewayValidationError("Content is required", "content");
    }

    if (!input.content.type || !ALLOWED_CONTENT_TYPES.has(input.content.type)) {
        throw new GatewayValidationError("Content type is invalid", "content.type");
    }

    if (input.content.type === "text") {
        if (typeof input.content.text !== "string" || input.content.text.trim().length === 0) {
            throw new GatewayValidationError("Text content cannot be empty", "content.text");
        }

        if (input.content.text.length > MAX_TEXT_LENGTH) {
            throw new GatewayValidationError(`Text content exceeds ${MAX_TEXT_LENGTH} characters`, "content.text");
        }
    }

    validateOptionalString(input.session?.id, "session.id");
    validateOptionalString(input.metadata?.requestId, "metadata.requestId");
    validateOptionalString(input.metadata?.correlationId, "metadata.correlationId");
    validateOptionalString(input.metadata?.messageIdempotencyKey, "metadata.messageIdempotencyKey");
}

function validateOptionalString(value: string | undefined, field: string) {
    if (value === undefined) {
        return;
    }

    if (typeof value !== "string" || value.trim().length === 0) {
        throw new GatewayValidationError(`${field} must be a non-empty string`, field);
    }

    if (value.length > MAX_ID_LENGTH) {
        throw new GatewayValidationError(`${field} exceeds ${MAX_ID_LENGTH} characters`, field);
    }
}
