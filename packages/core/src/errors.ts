export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, "NOT_FOUND");
  }
}

export class AlreadyEnrolledError extends DomainError {
  constructor(languageName: string) {
    super(`Already enrolled in ${languageName}`, "ALREADY_ENROLLED");
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly issues?: unknown,
  ) {
    super(message, "VALIDATION_ERROR");
  }
}
