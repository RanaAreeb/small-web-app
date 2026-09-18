import { Module } from '@nestjs/common';
import { IsZzAddressConstraint } from './is-zz-address.decorator';

@Module({
  providers: [IsZzAddressConstraint],
  exports: [IsZzAddressConstraint],
})
export class CommonModule {}
