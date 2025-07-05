import { HttpException, HttpStatus } from '@nestjs/common';

export class ProposalNotFoundException extends HttpException {
  constructor(proposalId: string) {
    super(`Proposal with ID ${proposalId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ProposalExpiredException extends HttpException {
  constructor(proposalId: string) {
    super(
      `Proposal ${proposalId} has expired and cannot be voted on`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class DuplicateVoteException extends HttpException {
  constructor(proposalId: string, userId: string) {
    super(
      `User ${userId} has already voted on proposal ${proposalId}`,
      HttpStatus.CONFLICT,
    );
  }
}

export class UnauthorizedVoterException extends HttpException {
  constructor(userId: string) {
    super(
      `User ${userId} is not authorized to vote (not a DAO member)`,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidVoteTypeException extends HttpException {
  constructor(voteType: string) {
    super(
      `Invalid vote type: ${voteType}. Must be 'for', 'against', or 'abstain'`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
