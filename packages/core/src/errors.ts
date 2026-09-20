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

export class DuplicateWordError extends DomainError {
  constructor(word: string) {
    super(`Word already exists in this language's vocabulary: ${word}`, "DUPLICATE_WORD");
  }
}

export class DuplicateLanguageError extends DomainError {
  constructor(name: string, languageCode: string) {
    super(`Language already exists: ${name} (${languageCode})`, "DUPLICATE_LANGUAGE");
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
