import { NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { UserRole } from '@subflow/shared';

export function assertCustomerOwnsResource(
  user: AuthenticatedUser,
  resource: { customerId?: string } | null | undefined,
  resourceName: string,
): void {
  if (
    user.role === UserRole.CUSTOMER &&
    (!resource || resource.customerId !== user.uid)
  ) {
    throw new NotFoundException(`${resourceName} not found`);
  }
}
