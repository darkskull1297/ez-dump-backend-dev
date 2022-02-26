import { ApiProperty } from "@nestjs/swagger";

export abstract class SuccessResponse<T> {
  @ApiProperty({ description: 'If the operation was successful', default: true })
  success: boolean;

  abstract data: T;
}

export abstract class FailureResponse<T> {
  @ApiProperty({ description: 'If the operation was successful', default: false })
  success: boolean;

  abstract data: T;
}

export class SuccessStringResponse extends SuccessResponse<string> {
  @ApiProperty({ description: 'Data returned from operation' })
  data: string;
}
export class FailureStringResponse extends FailureResponse<string> {
  @ApiProperty({ description: 'Data returned from operation' })
  data: string;
}