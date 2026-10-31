import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@subflow/shared';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { InvoiceController } from '../../modules/invoice/invoice.controller';
import { PaymentController } from '../../modules/payment/payment.controller';
import { QuotationController } from '../../modules/quotation/quotation.controller';
import { SubscriptionController } from '../../modules/subscription/subscription.controller';

const customer: AuthenticatedUser = {
  uid: 'customer-1',
  role: UserRole.CUSTOMER,
};

describe('authorization regressions', () => {
  it('forces public registration to create a customer even if an admin role is submitted', async () => {
    let received: Record<string, unknown> | undefined;
    const controller = new AuthController({
      createUser: async (dto: Record<string, unknown>) => {
        received = dto;
        return dto;
      },
    } as unknown as AuthService);

    await controller.register({
      email: 'person@example.test',
      password: 'a-long-test-password',
      displayName: 'Test User',
      role: UserRole.ADMIN,
    } as never);

    assert.equal(received?.role, UserRole.CUSTOMER);
  });

  it('rejects unknown authenticated roles even on routes without role metadata', () => {
    const guard = new RolesGuard({
      getAllAndOverride: () => undefined,
    } as never);
    const context = {
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { uid: 'user-1', role: 'owner' } }),
      }),
    };

    assert.throws(() => guard.canActivate(context as never));
  });

  it('prevents customers from reading or cancelling another customer subscription', async () => {
    const updates: unknown[] = [];
    const controller = new SubscriptionController({
      findOne: async () => ({ id: 'sub-1', customerId: 'customer-2' }),
      getActivities: async () => [],
      setStatus: async (...args: unknown[]) => updates.push(args),
    } as never);

    await assert.rejects(() => controller.findOne('sub-1', customer), NotFoundException);
    await assert.rejects(
      () => controller.getActivities('sub-1', customer),
      NotFoundException,
    );
    await assert.rejects(
      () => controller.cancel('sub-1', 'reason', customer, customer.uid, ''),
      NotFoundException,
    );
    assert.equal(updates.length, 0);
  });

  it('prevents customers from reading another customer invoice or downloading its PDF', async () => {
    let generated = false;
    const controller = new InvoiceController(
      {
        findOne: async () => ({ id: 'invoice-1', customerId: 'customer-2' }),
      } as never,
      {
        generateInvoicePdf: async () => {
          generated = true;
          return Buffer.from('pdf');
        },
      } as never,
    );

    await assert.rejects(
      () => controller.findOne('invoice-1', customer),
      NotFoundException,
    );
    await assert.rejects(
      () => controller.downloadPdf('invoice-1', {} as never, customer),
      NotFoundException,
    );
    assert.equal(generated, false);
  });

  it('prevents customers from reading another customer payment', async () => {
    const controller = new PaymentController({
      findOne: async () => ({ id: 'payment-1', customerId: 'customer-2' }),
    } as never);

    await assert.rejects(
      () => controller.findOne('payment-1', customer),
      NotFoundException,
    );
  });

  it('prevents customers from accepting another customer quotation', async () => {
    let accepted = false;
    const controller = new QuotationController({
      findOne: async () => ({ id: 'quotation-1', customerId: 'customer-2' }),
      accept: async () => {
        accepted = true;
      },
    } as never);

    await assert.rejects(
      () => controller.findOne('quotation-1', customer),
      NotFoundException,
    );
    await assert.rejects(
      () => controller.accept('quotation-1', customer),
      NotFoundException,
    );
    assert.equal(accepted, false);
  });

  it('restricts manual payment recording to staff and admins', () => {
    assert.deepEqual(
      Reflect.getMetadata(ROLES_KEY, PaymentController.prototype.recordPayment),
      [UserRole.ADMIN, UserRole.STAFF],
    );
  });
});
