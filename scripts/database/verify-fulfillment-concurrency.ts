import { randomUUID } from "node:crypto";

import postgres from "postgres";

import { assertSameLoopbackDatabaseTargets } from "./database-target";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function cleanupRuntimeFixtures(sql: ReturnType<typeof postgres>) {
  await sql.begin(async (tx) => {
    await tx`
      delete from app_private.fulfillment_replay_audit audit
      where audit.operator_user_id like 'runtime-operator-%'
        or audit.target_id like 'cs_runtime_%'
        or audit.target_id like 'cs_smtp_%'
        or audit.target_id like 'cs_signed_%'
    `;
    await tx`
      delete from app_private.fulfillment_effects effect
      using app_private.fulfillment_work work
      where effect.work_id = work.id
        and (
          work.checkout_session_id like 'cs_runtime_%'
          or work.checkout_session_id like 'cs_smtp_%'
          or work.checkout_session_id like 'cs_signed_%'
        )
    `;
    await tx`
      delete from app_private.fulfillment_work
      where checkout_session_id like 'cs_runtime_%'
         or checkout_session_id like 'cs_smtp_%'
         or checkout_session_id like 'cs_signed_%'
    `;
    await tx`
      delete from app_private.stripe_event_receipts
      where event_id like 'evt_runtime_%'
    `;
    await tx`
      delete from app_private.cart_items
      where user_id like 'runtime-user-%'
    `;
    await tx`
      delete from app_private.order_products product_line
      using app_private.order_items orders
      where product_line.order_id = orders.id
        and orders.user_id like 'runtime-user-%'
    `;
    await tx`
      delete from app_private.customer_info customer
      using app_private.order_items orders
      where customer.order_id = orders.id
        and orders.user_id like 'runtime-user-%'
    `;
    await tx`
      delete from app_private.order_items
      where user_id like 'runtime-user-%'
    `;
    await tx`
      delete from app_private.checkout_intents
      where id like 'runtime-intent-%'
         or user_id like 'runtime-user-%'
    `;
    await tx`
      delete from app_private.products_variants variant
      using app_private.products_items product
      where variant.product_id = product.id
        and product.name like 'Runtime Probe Product%'
    `;
    await tx`
      delete from app_private.products_items
      where name like 'Runtime Probe Product%'
    `;
    await tx`
      delete from app_private."user"
      where id like 'runtime-user-%'
    `;
  });
}

async function verifyCrossPrincipalOwnership(sql: ReturnType<typeof postgres>) {
  const suffix = randomUUID();
  const userAId = `runtime-user-owner-a-${suffix}`;
  const userBId = `runtime-user-owner-b-${suffix}`;
  for (const [id, name] of [[userAId, "Runtime Owner A"], [userBId, "Runtime Owner B"]]) {
    await sql`
      insert into app_private."user"
        (id, name, email, email_verified, role, banned, created_at, updated_at)
      values (
        ${id}, ${name}, ${`${id}@example.test`}, true, 'user', false, now(), now()
      )
    `;
  }
  const [product] = await sql`
    insert into app_private.products_items
      (name, description, price, category, img, created_at, updated_at)
    values (
      ${`Runtime Probe Product Ownership ${suffix}`},
      'Cross-principal ownership fixture',
      10.00,
      't-shirts',
      'https://example.test/ownership.jpg',
      now(),
      now()
    )
    returning id
  `;
  const [variant] = await sql`
    insert into app_private.products_variants
      (product_id, stripe_id, color, sizes, images, created_at, updated_at)
    values (
      ${product.id},
      ${`price_ownership_${suffix}`},
      'Ownership Blue',
      ${["M"]},
      ${["https://example.test/ownership-variant.jpg"]},
      now(),
      now()
    )
    returning id
  `;
  const [cartItem] = await sql`
    insert into app_private.cart_items
      (user_id, variant_id, quantity, size, stripe_id, created_at, updated_at)
    values (
      ${userBId}, ${variant.id}, 2, 'M', ${`price_ownership_${suffix}`}, now(), now()
    )
    returning id
  `;
  const cartItemId = Number(cartItem.id);
  const [order] = await sql`
    insert into app_private.order_items
      (user_id, delivery_date, order_number, created_at, updated_at)
    values (
      ${userBId}, now() + interval '3 days',
      ${Date.now() * 1000 + Math.floor(Math.random() * 1000)}, now(), now()
    )
    returning id
  `;
  const orderId = Number(order.id);
  await sql`
    insert into app_private.customer_info
      (order_id, name, email, address, stripe_order_id, total_price, currency, created_at, updated_at)
    values (
      ${orderId}, 'Runtime Owner B', ${`${userBId}@example.test`},
      ${JSON.stringify({ line1: "1 Test Street", city: "Madrid", postal_code: "28001", country: "ES" })}::jsonb,
      ${`cs_ownership_${suffix}`}, 1000, 'eur', now(), now()
    )
  `;
  await sql`
    insert into app_private.order_products
      (order_id, variant_id, quantity, size, unit_amount, currency,
       product_name, variant_color, image_url, created_at, updated_at)
    values (
      ${orderId}, ${variant.id}, 1, 'M', 1000, 'eur',
      'Runtime Probe Product Ownership', 'Ownership Blue',
      'https://example.test/ownership-variant.jpg', now(), now()
    )
  `;

  const { dataAccess, DataAccessError } = await import("../../src/lib/data-access");
  const { createUserPrincipalForIdentityModule } = await import(
    "../../src/lib/identity/principal-authority"
  );
  const userA = dataAccess.forUser(
    createUserPrincipalForIdentityModule({ userId: userAId, role: "user" }),
  );
  const userB = dataAccess.forUser(
    createUserPrincipalForIdentityModule({ userId: userBId, role: "user" }),
  );

  assert((await userA.cart.list()).length === 0, "User A saw User B cart rows");
  assert(
    (await userB.cart.list()).some((item) => item.id === cartItemId),
    "User B could not read its own cart row",
  );
  let updateDenied = false;
  try {
    await userA.cart.update(cartItemId, 99);
  } catch (error) {
    updateDenied = error instanceof DataAccessError && error.code === "not_found";
  }
  assert(updateDenied, "User A updated User B cart row");
  assert(await userA.cart.remove(cartItemId) === false, "User A deleted User B cart row");
  assert(await userA.orders.find(orderId) === null, "User A read User B order");
  assert((await userB.orders.find(orderId))?.id === orderId, "User B could not read its own order");
  const [preservedCart] = await sql`
    select quantity from app_private.cart_items where id = ${cartItemId}
  `;
  assert(preservedCart?.quantity === 2, "Cross-principal mutation changed User B cart");
}

async function main() {
  const url = process.env.RUNTIME_TEST_DATABASE_URL;
  if (!url) throw new Error("RUNTIME_TEST_DATABASE_URL is required");
  const adminUrl = process.env.RUNTIME_TEST_ADMIN_DATABASE_URL;
  if (!adminUrl) throw new Error("RUNTIME_TEST_ADMIN_DATABASE_URL is required");
  assertSameLoopbackDatabaseTargets(url, adminUrl);

  process.env.DATABASE_URL = url;
  const sql = postgres(url, { max: 2, prepare: false });
  const adminSql = postgres(adminUrl, { max: 1, prepare: false });
  await cleanupRuntimeFixtures(adminSql);
  try {
    const [identity] = await sql`select current_user as current_user`;
    assert(identity.current_user === "app_runtime", "Test URL must authenticate as app_runtime");
    const [{ count }] = await sql`
      select count(*)::int as count
      from app_private.fulfillment_work
      where state in ('pending', 'processing')
        and (state = 'pending' or lease_expires_at <= now())
        and next_attempt_at <= now()
    `;
    assert(count === 0, "Disposable database already contains claimable fulfillment work");
    await verifyCrossPrincipalOwnership(sql);

    const checkoutSessionId = `cs_runtime_${randomUUID()}`;
    const [fixture] = await sql`
      insert into app_private.fulfillment_work
        (checkout_session_id, state, next_attempt_at)
      values (${checkoutSessionId}, 'pending', now())
      returning id
    `;

    const { fulfillmentRepository } = await import(
      "../../src/lib/db/drizzle/repositories/fulfillment.repository"
    );
    const { checkoutRepository } = await import(
      "../../src/lib/db/drizzle/repositories/checkout.repository"
    );
    const bindingUserId = `runtime-user-bind-${randomUUID()}`;
    await sql`
      insert into app_private."user"
        (id, name, email, email_verified, role, banned, created_at, updated_at)
      values (
        ${bindingUserId},
        'Runtime Binding Probe',
        ${`${bindingUserId}@example.test`},
        true,
        'user',
        false,
        now(),
        now()
      )
    `;
    const bindingIntentId = `runtime-intent-bind-${randomUUID()}`;
    await sql`
      insert into app_private.checkout_intents
        (id, user_id, items, expires_at)
      values (${bindingIntentId}, ${bindingUserId}, '[]'::jsonb, now() + interval '30 minutes')
    `;
    const recoveredBinding = await checkoutRepository.findBySession(
      bindingIntentId,
      "cs_runtime_bind_a",
    );
    assert(
      recoveredBinding?.checkoutSessionId === "cs_runtime_bind_a",
      "Fulfillment could not recover an unbound Checkout Intent",
    );
    const sameBinding = await checkoutRepository.findBySession(
      bindingIntentId,
      "cs_runtime_bind_a",
    );
    assert(sameBinding, "Idempotent Checkout Intent binding was rejected");
    const conflictingBinding = await checkoutRepository.findBySession(
      bindingIntentId,
      "cs_runtime_bind_b",
    );
    assert(!conflictingBinding, "Checkout Intent binding was overwritten");
    const claims = await Promise.all([
      fulfillmentRepository.claimWork("runtime-worker-a", 60),
      fulfillmentRepository.claimWork("runtime-worker-b", 60),
    ]);
    const winners = claims.filter((claim) => claim?.id === fixture.id);
    assert(winners.length === 1, "Exactly one concurrent worker must claim the Work row");
    const staleWorkerId = winners[0]?.leaseOwner;
    assert(staleWorkerId, "Initial claim has no lease owner");

    await sql`
      update app_private.fulfillment_work
      set lease_expires_at = now() - interval '1 second'
      where id = ${fixture.id}
    `;
    const reclaimed = await fulfillmentRepository.claimWork("runtime-worker-c", 60);
    assert(reclaimed, "Expired Work lease was not reclaimed");
    assert(reclaimed.id === fixture.id, "A different Work row was reclaimed");
    assert(reclaimed.attemptCount === 2, "Reclaim did not advance the attempt fence");

    let staleWorkerRejected = false;
    try {
      await fulfillmentRepository.failWork({
        workId: fixture.id,
        workerId: staleWorkerId,
        code: "stale_worker",
        detail: "A stale worker must not mutate reclaimed work",
        retryAt: null,
      });
    } catch (error) {
      staleWorkerRejected =
        error instanceof Error && /lease was lost/.test(error.message);
    }
    assert(staleWorkerRejected, "The stale worker was not fenced after reclaim");
    const [fenced] = await sql`
      select state, lease_owner, attempt_count
      from app_private.fulfillment_work
      where id = ${fixture.id}
    `;
    assert(
      fenced.state === "processing" &&
        fenced.lease_owner === "runtime-worker-c" &&
        fenced.attempt_count === 2,
      "Stale worker changed the reclaimed Work row",
    );

    await fulfillmentRepository.failWork({
      workId: fixture.id,
      workerId: "runtime-worker-c",
      code: "runtime_probe_complete",
      detail: "Runtime lease probe completed",
      retryAt: null,
    });
    const [terminal] = await sql`
      select state, lease_owner, lease_expires_at
      from app_private.fulfillment_work
      where id = ${fixture.id}
    `;
    assert(
      terminal.state === "needs_attention" &&
        terminal.lease_owner === null &&
        terminal.lease_expires_at === null,
      "Probe did not release its final lease",
    );
    const operatorUserId = `runtime-operator-${randomUUID()}`;
    const replayed = await fulfillmentRepository.replayWork({
      checkoutSessionId,
      operatorUserId,
      reason: "Runtime authorized replay probe",
    });
    assert(replayed, "Terminal Work was not replayed");
    const [replayEvidence] = await adminSql`
      select work.state,
             count(audit.id)::int as audit_count
      from app_private.fulfillment_work work
      left join app_private.fulfillment_replay_audit audit
        on audit.target_kind = 'work'
       and audit.target_id = work.checkout_session_id
       and audit.operator_user_id = ${operatorUserId}
      where work.id = ${fixture.id}
      group by work.state
    `;
    assert(
      replayEvidence.state === "pending" && replayEvidence.audit_count === 1,
      "Replay did not atomically transition Work and append audit evidence",
    );
    await sql`
      update app_private.fulfillment_work
      set state = 'needs_attention',
          next_attempt_at = now(),
          lease_owner = null,
          lease_expires_at = null
      where id = ${fixture.id}
    `;

    const userId = `runtime-user-${randomUUID()}`;
    const userEmail = `${userId}@example.test`;
    await sql`
      insert into app_private."user"
        (id, name, email, email_verified, role, banned, created_at, updated_at)
      values (${userId}, 'Runtime SMTP Probe', ${userEmail}, true, 'user', false, now(), now())
    `;
    const [product] = await sql`
      insert into app_private.products_items
        (name, description, price, category, img, created_at, updated_at)
      values ('Runtime Probe Product', 'Disposable runtime probe', 10, 't-shirts', '/main-image.webp', now(), now())
      returning id
    `;
    const runtimePriceId = `price_runtime_${randomUUID()}`;
    const [variant] = await sql`
      insert into app_private.products_variants
        (product_id, stripe_id, color, sizes, images, created_at, updated_at)
      values (${product.id}, ${runtimePriceId}, 'Probe', ARRAY['M']::app_private.sizes[], ARRAY['/main-image.webp']::text[], now(), now())
      returning id
    `;
    const smtpSessionId = `cs_smtp_${randomUUID()}`;
    const intentId = randomUUID();
    await sql`
      insert into app_private.checkout_intents
        (id, user_id, checkout_session_id, items, expires_at)
      values (
        ${intentId},
        ${userId},
        ${smtpSessionId},
        ${sql.json([{
          cartItemId: 1,
          variantId: variant.id,
          size: "M",
          quantity: 1,
          priceId: runtimePriceId,
          unitAmount: 1000,
          currency: "eur",
          productName: "Runtime Probe Product SMTP",
          variantColor: "Runtime Blue",
          imageUrl: "https://example.test/runtime.jpg",
        }])},
        now() + interval '30 minutes'
      )
    `;
    const [smtpWorkRow] = await sql`
      insert into app_private.fulfillment_work
        (checkout_session_id, state, next_attempt_at)
      values (${smtpSessionId}, 'pending', now())
      returning id
    `;
    const smtpWork = await fulfillmentRepository.claimWork("runtime-smtp-work", 60);
    assert(smtpWork, "SMTP fixture Work was not claimed");
    assert(smtpWork.id === smtpWorkRow.id, "A different Work row was claimed for SMTP");
    const smtpOrderId = await fulfillmentRepository.completeWork(
      smtpWork,
      "runtime-smtp-work",
      {
        order: {
          userId,
          deliveryDate: new Date(Date.now() + 7 * 86_400_000),
        },
        customer: {
          name: "Runtime SMTP Probe",
          email: userEmail,
          address: {
            line1: "Test Street 1",
            line2: undefined,
            city: "Madrid",
            state: undefined,
            postal_code: "28001",
            country: "ES",
          },
          stripeOrderId: smtpSessionId,
          totalPrice: 1000,
          currency: "eur",
        },
        products: [{
          variantId: variant.id,
          quantity: 1,
          size: "M",
          unitAmount: 1000,
          currency: "eur",
          productName: "Runtime Probe Product SMTP",
          variantColor: "Runtime Blue",
          imageUrl: "https://example.test/runtime.jpg",
        }],
      },
    );
    process.env.STRIPE_SECRET_KEY ??= "sk_test_runtime_probe";
    const { runFulfillmentSweep } = await import(
      "../../src/lib/order-fulfillment/index"
    );
    const { getOrderFulfillmentSystemPrincipal } = await import(
      "../../src/lib/order-fulfillment/system-principal"
    );
    await runFulfillmentSweep(
      getOrderFulfillmentSystemPrincipal(),
      { limit: 5 },
      {
        sendEmail: async () => {
          throw new Error("Injected SMTP failure");
        },
      },
    );
    const [smtpEvidence] = await sql`
      select work.state as work_state,
             work.order_id::int as order_id,
             count(distinct orders.id)::int as order_count,
             count(*) filter (
               where effect.kind = 'order_email'
                 and effect.state = 'pending'
                 and effect.last_error_detail like '%Injected SMTP failure%'
             )::int as failed_emails,
             count(*) filter (
               where effect.kind = 'cart_cleanup' and effect.state = 'succeeded'
             )::int as completed_cleanups
      from app_private.fulfillment_work work
      join app_private.order_items orders on orders.id = work.order_id
      join app_private.fulfillment_effects effect on effect.work_id = work.id
      where work.id = ${smtpWorkRow.id}
      group by work.state, work.order_id
    `;
    assert(
      smtpEvidence.work_state === "succeeded" &&
        smtpEvidence.order_id === smtpOrderId &&
        smtpEvidence.order_count === 1 &&
        smtpEvidence.failed_emails === 2 &&
        smtpEvidence.completed_cleanups === 1,
      "SMTP failure did not preserve the committed order and independent effects",
    );
    const { dataAccess } = await import("../../src/lib/data-access");
    const { createUserPrincipalForIdentityModule } = await import(
      "../../src/lib/identity/principal-authority"
    );
    const { checkoutOutcomeFromRecord } = await import(
      "../../src/lib/order-fulfillment/checkout-outcome"
    );
    const outcomeRecord = await dataAccess
      .forUser(
        createUserPrincipalForIdentityModule({ userId, role: "user" }),
      )
      .checkout.outcome(smtpSessionId);
    assert(outcomeRecord, "Fulfilled checkout outcome was not visible to its owner");
    const outcome = checkoutOutcomeFromRecord(outcomeRecord);
    assert(
      outcome.status === "fulfilled" &&
        outcome.orderId === smtpOrderId &&
        outcome.customerEmail === "delayed" &&
        outcome.cartCleanup === "succeeded",
      "Checkout outcome did not preserve fulfilled order and delayed email truth",
    );
    const Stripe = (await import("stripe")).default;
    const stripeVerifier = new Stripe("sk_test_runtime_probe");
    const webhookSecret = "whsec_runtime_probe";
    const signedSessionId = `cs_signed_${randomUUID()}`;
    const eventId = `evt_runtime_${randomUUID()}`;
    const eventPayload = JSON.stringify({
      id: eventId,
      object: "event",
      api_version: "2026-07-29.dahlia",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: signedSessionId,
          object: "checkout.session",
          status: "complete",
          payment_status: "paid",
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      type: "checkout.session.completed",
    });
    const signature = stripeVerifier.webhooks.generateTestHeaderString({
      payload: eventPayload,
      secret: webhookSecret,
    });
    const { createStripeWebhookHandler } = await import(
      "../../src/lib/stripe/webhook-handler"
    );
    const signedHandler = createStripeWebhookHandler({
      getWebhookSecret: () => webhookSecret,
      constructEvent: (payload, header, secret) =>
        stripeVerifier.webhooks.constructEvent(payload, header, secret),
      registerEvent: async (event) => {
        await fulfillmentRepository.registerEvent(event);
        return { handled: true };
      },
      logger: {
        warn: () => undefined,
        error: (message, error) => console.error(message, error),
      },
    });
    const deliverSignedEvent = () => signedHandler(
      new Request("http://runtime.test/api/stripe/webhooks", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: eventPayload,
      }),
    );
    const [firstDelivery, duplicateDelivery] = await Promise.all([
      deliverSignedEvent(),
      deliverSignedEvent(),
    ]);
    const deliveryEvidence = await Promise.all([
      firstDelivery.clone().text(),
      duplicateDelivery.clone().text(),
    ]);
    assert(
      firstDelivery.status === 200 && duplicateDelivery.status === 200,
      `Signed duplicate webhook delivery was rejected: ${firstDelivery.status}/${duplicateDelivery.status} ${deliveryEvidence.join(" | ")}`,
    );
    const [receiptEvidence] = await adminSql`
      select count(*)::int as receipt_count
      from app_private.stripe_event_receipts
      where event_id = ${eventId}
    `;
    const [workEvidence] = await sql`
      select count(*)::int as work_count
      from app_private.fulfillment_work
      where checkout_session_id = ${signedSessionId}
    `;
    assert(
      receiptEvidence.receipt_count === 1 && workEvidence.work_count === 1,
      "Signed duplicate delivery created duplicate durable rows",
    );
    console.log("Fulfillment concurrency and expired-lease evidence: PASS");
    console.log("Post-commit SMTP failure evidence: PASS");
    console.log("Truthful checkout outcome evidence: PASS");
    console.log("Write-once checkout binding evidence: PASS");
    console.log("Authorized replay and audit evidence: PASS");
    console.log("Signed duplicate webhook evidence: PASS");
    console.log("Cross-principal ownership evidence: PASS");
  } finally {
    await cleanupRuntimeFixtures(adminSql);
    await adminSql.end();
    await sql.end();
  }
}

void main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  },
);
