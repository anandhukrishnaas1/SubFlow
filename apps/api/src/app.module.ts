import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { PlanModule } from './modules/plan/plan.module';
import { TaxModule } from './modules/tax/tax.module';
import { DiscountModule } from './modules/discount/discount.module';
import { QuotationModule } from './modules/quotation/quotation.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ActivityModule } from './modules/activity/activity.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    FirebaseModule,
    AuthModule,
    CustomerModule,
    ProductModule,
    PlanModule,
    TaxModule,
    DiscountModule,
    QuotationModule,
    SubscriptionModule,
    InvoiceModule,
    BillingModule,
    PaymentModule,
    AnalyticsModule,
    NotificationModule,
    ActivityModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
