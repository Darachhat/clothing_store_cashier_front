<template>
  <div class="flex-1 min-w-0 min-h-0 h-full w-full overflow-hidden bg-slate-950 text-white font-sans select-none flex flex-col">
    <!-- ── Compact Top Header (56px) ──────────────────────────────── -->
    <header class="h-14 px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between flex-shrink-0">
      <!-- Left: Store Logo, Store Name, Branch Name -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-white flex-shrink-0">
          <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5 text-slate-100" />
        </div>
        <div class="flex items-center gap-2.5 min-w-0">
          <h1 class="text-sm font-bold tracking-tight text-white truncate">
            {{ displayStoreName }}
          </h1>
          <span class="text-slate-700 font-light">|</span>
          <div class="flex items-center gap-1.5 text-xs font-medium text-slate-300 truncate">
            <UIcon name="i-heroicons-building-storefront" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span class="truncate">{{ displayBranchName }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Connection Status & Local Clock -->
      <div class="flex items-center gap-4 flex-shrink-0">
        <div
          class="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800"
          data-testid="connection-status-pill"
        >
          <span
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="connectionDotClass"
          />
          <span class="text-[11px] font-semibold tracking-wide text-slate-300">
            {{ connectionStatusLabel }}
          </span>
        </div>

        <div class="hidden sm:flex items-center gap-2 text-right pl-2 border-l border-slate-800">
          <span class="text-xs font-semibold text-slate-200 tabular-nums">{{ currentTimeStr }}</span>
          <span class="text-[11px] text-slate-400">{{ currentDateStr }}</span>
        </div>
      </div>
    </header>

    <!-- ── Main Content Area ──────────────────────────────────────── -->
    <main class="flex-1 min-h-0 overflow-hidden p-4 lg:p-5 flex flex-col">
      <!-- 1. IDLE / WELCOMING EMPTY STATE -->
      <div
        v-if="displayState === 'IDLE'"
        class="flex-1 min-h-0 rounded-xl bg-slate-900/60 border border-slate-800/90 px-6 py-8 flex flex-col items-center justify-between text-center overflow-hidden"
        data-testid="display-idle-state"
      >
        <!-- Top Subtle Branch Tag -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
          <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-slate-400" />
          <span>{{ displayStoreName }} &bull; {{ displayBranchName }}</span>
        </div>

        <!-- Center Welcome Messaging -->
        <div class="max-w-xl mx-auto flex flex-col items-center gap-4 my-auto py-4">
          <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-sm">
            <UIcon name="i-heroicons-shopping-bag" class="w-8 h-8 text-slate-200" />
          </div>

          <div class="space-y-2">
            <h2 class="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Welcome! Your order will appear here.
            </h2>
            <p class="text-sm lg:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
              As each item is scanned at the register, your selections, discounts, and total in USD and KHR will update automatically.
            </p>
          </div>

          <!-- Exchange Rate & Store Policy Pill Row -->
          <div class="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-slate-400" />
              <span>Exchange Rate: <strong class="text-white font-semibold tabular-nums">1 USD = {{ exchangeRate.toLocaleString() }} ៛</strong></span>
            </div>
            <div
              v-if="displayFooterNote"
              class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-md truncate"
            >
              <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span class="truncate">{{ displayFooterNote }}</span>
            </div>
          </div>
        </div>

        <!-- Bottom Payment Methods Strip -->
        <div class="w-full max-w-xl pt-3 border-t border-slate-800/80">
          <WeAcceptPaymentStrip theme="dark" />
        </div>
      </div>

      <!-- 2. ACTIVE ORDER OR ABA KHQR CHECKOUT (Two-Column Layout ~70% / ~30%) -->
      <div
        v-else-if="displayState === 'CART_ACTIVE' || displayState === 'PAYMENT_QR'"
        class="flex-1 min-h-0 grid grid-cols-12 gap-4 overflow-hidden"
        data-testid="display-active-layout"
      >
        <!-- LEFT COLUMN (~70%: 8 of 12 cols on desktop): Order List OR ABA KHQR Panel -->
        <section class="col-span-12 lg:col-span-8 min-h-0 flex flex-col bg-slate-900/75 border border-slate-800 rounded-xl overflow-hidden">
          <!-- 2A. Left Column when in CART_ACTIVE mode: Structured Order Table -->
          <template v-if="displayState === 'CART_ACTIVE'">
            <!-- Order Panel Header -->
            <div class="h-12 px-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between flex-shrink-0">
              <div class="flex items-center gap-2.5">
                <UIcon name="i-heroicons-shopping-cart" class="w-4 h-4 text-slate-300" />
                <h2 class="text-sm font-bold tracking-tight text-white">Your Order</h2>
                <span class="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 tabular-nums">
                  {{ totalUnitsCount }} {{ totalUnitsCount === 1 ? 'item' : 'items' }}
                </span>
              </div>

              <div class="flex items-center gap-3">
                <div
                  v-if="customerName"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200"
                >
                  <UIcon name="i-heroicons-user" class="w-3.5 h-3.5 text-slate-400" />
                  <span class="truncate max-w-[180px]">{{ customerName }}</span>
                </div>
                <span
                  v-if="cartItems.length > 1"
                  class="text-xs text-slate-400 tabular-nums hidden sm:inline"
                >
                  {{ cartItems.length }} lines
                </span>
              </div>
            </div>

            <!-- Aligned Column Headings -->
            <div class="h-9 px-5 border-b border-slate-800/90 bg-slate-900/60 grid grid-cols-12 items-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex-shrink-0">
              <div class="col-span-6 pr-3">Item Description</div>
              <div class="col-span-2 text-center">Qty</div>
              <div class="col-span-2 text-right">Unit Price</div>
              <div class="col-span-2 text-right">Line Total</div>
            </div>

            <!-- Scrollable Order Items List (Fixed Row Heights, Never Stretched) -->
            <div
              ref="orderListContainerRef"
              class="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-800/80"
              data-testid="order-items-list"
            >
              <div
                v-for="item in cartItems"
                :key="item.variant_id"
                :ref="(el) => setItemRowRef(item.variant_id, el)"
                class="px-5 py-3 grid grid-cols-12 items-center transition-colors duration-300 flex-shrink-0"
                :class="
                  highlightedVariantId === item.variant_id
                    ? 'bg-slate-800/95'
                    : 'bg-transparent hover:bg-slate-900/40'
                "
                :data-variant-id="item.variant_id"
              >
                <!-- Item Description + Thumbnail + Variant Badges -->
                <div class="col-span-6 pr-3 flex items-center gap-3 min-w-0">
                  <div class="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700/70 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      v-if="item.imageUrl && !failedImageUrls.has(item.imageUrl)"
                      :src="item.imageUrl"
                      :alt="item.name"
                      loading="lazy"
                      class="w-full h-full object-cover"
                      @error="markImageFailed(item.imageUrl)"
                    />
                    <UIcon
                      v-else
                      name="i-heroicons-shopping-bag"
                      class="w-5 h-5 text-slate-500"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 min-w-0">
                      <p class="text-sm font-bold text-white truncate">
                        {{ item.name }}
                      </p>
                      <span
                        v-if="highlightedVariantId === item.variant_id"
                        class="px-1.5 py-0.5 rounded bg-slate-700 text-[10px] font-semibold text-emerald-300 flex-shrink-0"
                      >
                        Updated
                      </span>
                    </div>

                    <!-- Variant Attributes (Color & Size) + Line Discount -->
                    <div class="flex flex-wrap items-center gap-1.5 mt-1">
                      <span
                        v-if="item.colorName"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/70 text-[11px] font-medium text-slate-300"
                      >
                        <span
                          v-if="item.colorHex"
                          class="w-2 h-2 rounded-full border border-slate-600 flex-shrink-0"
                          :style="{ backgroundColor: item.colorHex }"
                        />
                        <span>{{ item.colorName }}</span>
                      </span>

                      <span
                        v-if="item.sizeName"
                        class="inline-flex items-center px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/70 text-[11px] font-semibold text-slate-200"
                      >
                        Size {{ item.sizeName }}
                      </span>

                      <span
                        v-if="!item.colorName && !item.sizeName && item.variantInfo"
                        class="inline-flex items-center px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/70 text-[11px] font-medium text-slate-300"
                      >
                        {{ item.variantInfo }}
                      </span>

                      <span
                        v-if="item.discountAmount > 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-emerald-400 tabular-nums"
                      >
                        <UIcon name="i-heroicons-tag" class="w-3 h-3" />
                        <span>-${{ formatUsd(item.discountAmount) }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Quantity -->
                <div class="col-span-2 flex justify-center">
                  <span class="inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-sm font-bold text-white tabular-nums">
                    {{ item.quantity }}
                  </span>
                </div>

                <!-- Unit Price -->
                <div class="col-span-2 text-right">
                  <span class="text-sm font-medium text-slate-300 tabular-nums">
                    ${{ formatUsd(item.unitPrice) }}
                  </span>
                </div>

                <!-- Line Total -->
                <div class="col-span-2 text-right">
                  <div class="text-sm font-bold text-white tabular-nums">
                    ${{ formatUsd(item.lineTotal) }}
                  </div>
                  <div
                    v-if="item.discountAmount > 0"
                    class="text-[11px] text-slate-500 line-through tabular-nums"
                  >
                    ${{ formatUsd(item.lineSubtotal) }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 2B. Left Column when in PAYMENT_QR mode: ABA KHQR Scan Terminal -->
          <template v-else-if="displayState === 'PAYMENT_QR' && khqrData">
            <div class="h-12 px-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between flex-shrink-0">
              <div class="flex items-center gap-2.5">
                <UIcon name="i-heroicons-qr-code" class="w-4 h-4 text-slate-200" />
                <h2 class="text-sm font-bold tracking-tight text-white">ABA PAY &amp; KHQR Checkout</h2>
              </div>

              <div
                v-if="khqrData.status === 'PENDING' && khqrData.secondsLeft > 0"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/80 text-xs font-semibold tabular-nums"
                :class="khqrData.secondsLeft <= 30 ? 'text-amber-300' : 'text-slate-200'"
              >
                <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                <span>Expires in {{ formatCountdownMmSs(khqrData.secondsLeft) }}</span>
              </div>
            </div>

            <div class="flex-1 min-h-0 p-5 flex flex-col items-center justify-center overflow-y-auto">
              <!-- KHQR Loading State -->
              <div
                v-if="khqrData.status === 'LOADING'"
                class="max-w-md w-full flex flex-col items-center text-center gap-4 py-8"
                data-testid="khqr-loading-state"
              >
                <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-arrow-path" class="w-7 h-7 text-slate-200 animate-spin" />
                </div>
                <div class="space-y-1">
                  <h3 class="text-lg font-bold text-white">Generating Official ABA KHQR…</h3>
                  <p class="text-xs text-slate-400">Please wait a moment while we prepare your secure payment code.</p>
                </div>
              </div>

              <!-- KHQR Expired State (QR Image Hidden so Stale Code Cannot Be Scanned) -->
              <div
                v-else-if="khqrData.status === 'EXPIRED'"
                class="max-w-md w-full flex flex-col items-center text-center gap-4 py-8"
                data-testid="khqr-expired-state"
              >
                <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-clock" class="w-7 h-7 text-amber-400" />
                </div>
                <div class="space-y-1.5">
                  <h3 class="text-xl font-bold text-white">QR Code Expired</h3>
                  <p class="text-sm text-slate-400">
                    This payment code has timed out for your security. Please ask the cashier to generate a fresh QR code.
                  </p>
                </div>
              </div>

              <!-- KHQR Declined / Failed State -->
              <div
                v-else-if="khqrData.status === 'DECLINED' || khqrData.status === 'FAILED'"
                class="max-w-md w-full flex flex-col items-center text-center gap-4 py-8"
                data-testid="khqr-failed-state"
              >
                <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-7 h-7 text-rose-400" />
                </div>
                <div class="space-y-1.5">
                  <h3 class="text-xl font-bold text-white">Payment Could Not Be Completed</h3>
                  <p class="text-sm text-slate-400">
                    {{ khqrData.error || 'Please check with the cashier to retry or select another payment method.' }}
                  </p>
                </div>
              </div>

              <!-- Active Scannable KHQR Card (PENDING / VERIFYING) -->
              <div
                v-else
                class="w-full max-w-lg flex flex-col sm:flex-row items-center gap-6 bg-slate-900 border border-slate-800 rounded-xl p-5"
                data-testid="khqr-active-card"
              >
                <!-- High-Contrast White QR Container -->
                <div class="bg-white rounded-xl p-3.5 border border-gray-200 flex flex-col items-center flex-shrink-0 shadow-sm">
                  <div class="w-full flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                    <span class="text-[11px] font-extrabold tracking-wider text-slate-900 uppercase">ABA KHQR</span>
                    <span class="text-[10px] font-semibold text-slate-500">Bakong Supported</span>
                  </div>

                  <div class="relative w-48 h-48 flex items-center justify-center">
                    <img
                      v-if="khqrData.qrImage"
                      :src="khqrData.qrImage"
                      alt="ABA KHQR Code"
                      class="w-48 h-48 object-contain"
                    />
                    <div
                      v-else
                      class="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 text-gray-400 rounded-lg"
                    >
                      <UIcon name="i-heroicons-qr-code" class="w-12 h-12" />
                    </div>
                  </div>
                </div>

                <!-- Scan Instructions & Live Status -->
                <div class="flex-1 flex flex-col justify-between gap-4 text-center sm:text-left">
                  <div class="space-y-1.5">
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/80 text-xs font-semibold text-emerald-400">
                      <UIcon
                        :name="khqrData.status === 'VERIFYING' || khqrData.verifying ? 'i-heroicons-arrow-path' : 'i-heroicons-device-phone-mobile'"
                        class="w-3.5 h-3.5"
                        :class="khqrData.status === 'VERIFYING' || khqrData.verifying ? 'animate-spin' : ''"
                      />
                      <span>
                        {{ khqrData.status === 'VERIFYING' || khqrData.verifying ? 'Verifying payment with bank…' : 'Scan with ABA Mobile or Bakong App' }}
                      </span>
                    </div>

                    <h3 class="text-lg font-bold text-white pt-1">
                      Scan QR to Pay ${{ formatUsd(khqrData.amount || grandTotal) }}
                    </h3>
                    <p class="text-xs text-slate-400 leading-relaxed">
                      Open ABA Mobile or any KHQR-supported banking app, scan the code, and confirm the amount.
                    </p>
                  </div>

                  <div class="space-y-2 pt-2 border-t border-slate-800">
                    <div
                      v-if="khqrData.tranId"
                      class="flex items-center justify-between text-xs text-slate-400"
                    >
                      <span>Reference</span>
                      <span class="font-mono text-slate-300">{{ khqrData.tranId }}</span>
                    </div>
                    <WeAcceptPaymentStrip theme="dark" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>

        <!-- RIGHT COLUMN (~30%: 4 of 12 cols on desktop): Order Summary -->
        <aside
          class="col-span-12 lg:col-span-4 min-h-0 flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-5 overflow-hidden"
          data-testid="order-summary-panel"
        >
          <!-- Top: Summary Breakdown -->
          <div class="space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 class="text-sm font-bold tracking-tight text-white">Order Summary</h2>
              <span class="text-xs font-medium text-slate-400 tabular-nums">
                {{ totalUnitsCount }} {{ totalUnitsCount === 1 ? 'unit' : 'units' }}
              </span>
            </div>

            <!-- Charge & Discount Lines -->
            <div class="space-y-2.5 text-sm">
              <!-- Subtotal -->
              <div class="flex items-center justify-between text-slate-300">
                <span>Subtotal</span>
                <span class="font-semibold text-white tabular-nums">${{ formatUsd(subtotal) }}</span>
              </div>

              <!-- Item-level Discounts (shown only when > 0) -->
              <div
                v-if="itemDiscountsTotal > 0"
                class="flex items-center justify-between text-emerald-400"
              >
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
                  <span>Item Discounts</span>
                </span>
                <span class="font-semibold tabular-nums">-${{ formatUsd(itemDiscountsTotal) }}</span>
              </div>

              <!-- Promo / Coupon Discount (shown only when > 0) -->
              <div
                v-if="orderDiscount > 0"
                class="flex items-center justify-between text-emerald-400"
              >
                <span class="flex items-center gap-1.5 min-w-0">
                  <UIcon name="i-heroicons-ticket" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="truncate">Promo Discount</span>
                  <span
                    v-if="appliedCouponCode"
                    class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold uppercase text-emerald-300"
                  >
                    {{ appliedCouponCode }}
                  </span>
                </span>
                <span class="font-semibold tabular-nums flex-shrink-0">-${{ formatUsd(orderDiscount) }}</span>
              </div>

              <!-- Fallback combined discount row if totalDiscount > 0 but neither sub-bucket is populated -->
              <div
                v-if="totalDiscount > 0 && itemDiscountsTotal === 0 && orderDiscount === 0"
                class="flex items-center justify-between text-emerald-400"
              >
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
                  <span>Total Discount</span>
                </span>
                <span class="font-semibold tabular-nums">-${{ formatUsd(totalDiscount) }}</span>
              </div>

              <!-- Tax / VAT (shown only when > 0) -->
              <div
                v-if="taxAmount > 0"
                class="flex items-center justify-between text-slate-300"
              >
                <span>Tax (VAT{{ taxPercentLabel }})</span>
                <span class="font-semibold text-white tabular-nums">${{ formatUsd(taxAmount) }}</span>
              </div>
            </div>

            <!-- Total Savings Banner (shown when totalDiscount > 0) -->
            <div
              v-if="totalDiscount > 0"
              class="px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-between text-xs"
            >
              <span class="font-medium text-slate-300 flex items-center gap-1.5">
                <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Savings</span>
              </span>
              <span class="font-bold text-emerald-400 tabular-nums">
                ${{ formatUsd(totalDiscount) }} ({{ toKhrAmount(totalDiscount, exchangeRate).toLocaleString() }} ៛)
              </span>
            </div>

            <!-- Checkout Status Indicator (when cashier is in payment modal) -->
            <div
              v-if="checkoutPhase !== 'SHOPPING' || displayState === 'PAYMENT_QR'"
              class="px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center gap-2.5 text-xs text-slate-200"
              data-testid="checkout-phase-banner"
            >
              <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-slate-300 flex-shrink-0" />
              <span class="font-medium">
                {{
                  displayState === 'PAYMENT_QR'
                    ? 'Awaiting QR payment confirmation…'
                    : checkoutPhase === 'CARD_PROCESSING'
                      ? 'Card payment in progress…'
                      : 'Cashier is finalizing payment method…'
                }}
              </span>
            </div>
          </div>

          <!-- Bottom: Prominent Total Due (USD + KHR) -->
          <div class="pt-4 border-t border-slate-800 space-y-3">
            <div class="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div class="flex items-baseline justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Due
                </span>
                <span class="text-[11px] font-medium text-slate-400 tabular-nums">
                  1 USD = {{ exchangeRate.toLocaleString() }} ៛
                </span>
              </div>

              <!-- Primary USD Total -->
              <div
                class="text-4xl xl:text-5xl font-black tracking-tight text-white text-right tabular-nums leading-none py-1"
                data-testid="summary-grand-total-usd"
              >
                ${{ formatUsd(grandTotal) }}
              </div>

              <!-- Secondary KHR Equivalent -->
              <div class="pt-2 border-t border-slate-800/90 flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400">KHR Equivalent</span>
                <span
                  class="text-xl xl:text-2xl font-extrabold text-emerald-400 tabular-nums"
                  data-testid="summary-grand-total-khr"
                >
                  {{ khrGrandTotalFormatted }} ៛
                </span>
              </div>
            </div>

            <WeAcceptPaymentStrip theme="dark" />
          </div>
        </aside>
      </div>

      <!-- 3. PAYMENT SUCCESS / ORDER COMPLETION VIEW -->
      <div
        v-else-if="displayState === 'PAYMENT_SUCCESS' && successData"
        class="flex-1 min-h-0 rounded-xl bg-slate-900/75 border border-slate-800 p-6 flex flex-col items-center justify-center text-center overflow-hidden"
        data-testid="display-payment-success"
      >
        <div class="max-w-xl w-full flex flex-col items-center gap-5">
          <!-- Checkmark Badge -->
          <div class="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-emerald-400" />
          </div>

          <div class="space-y-1.5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400">
              <span>Payment Confirmed</span>
              <span v-if="successData.paymentMethod">&bull; {{ successData.paymentMethod }}</span>
            </div>
            <h2 class="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Thank You for Shopping With Us!
            </h2>
            <p class="text-sm text-slate-400">
              Please collect your printed receipt from the cashier.
            </p>
          </div>

          <!-- Payment & Change Summary Card -->
          <div class="w-full rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-3 text-left">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Amount Paid</span>
              <div class="text-right">
                <span class="text-2xl font-black text-white tabular-nums">${{ formatUsd(successData.amount || grandTotal) }}</span>
                <span class="block text-xs font-bold text-emerald-400 tabular-nums">
                  {{ (successData.khrAmount || toKhrAmount(successData.amount || grandTotal, exchangeRate)).toLocaleString() }} ៛
                </span>
              </div>
            </div>

            <!-- Cash Tendered & Change Due (Shown for Cash or Split Tender when applicable) -->
            <template v-if="successData.tenderedAmount !== null && successData.tenderedAmount > 0">
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
                <span class="text-slate-400">Amount Tendered</span>
                <span class="font-bold text-slate-200 tabular-nums">${{ formatUsd(successData.tenderedAmount) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-slate-200">Change Due</span>
                <div class="text-right">
                  <span
                    class="text-xl font-black text-emerald-400 tabular-nums"
                    data-testid="payment-change-due-usd"
                  >
                    ${{ formatUsd(successData.changeDue) }}
                  </span>
                  <span
                    v-if="successData.changeDue > 0"
                    class="block text-xs font-semibold text-slate-300 tabular-nums"
                  >
                    {{ toKhrAmount(successData.changeDue, exchangeRate).toLocaleString() }} ៛
                  </span>
                </div>
              </div>
            </template>

            <div
              v-if="successData.invoiceNumber"
              class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400"
            >
              <span>Invoice Number</span>
              <span class="font-mono font-semibold text-slate-200">{{ successData.invoiceNumber }}</span>
            </div>
          </div>

          <p
            v-if="displayFooterNote"
            class="text-xs text-slate-400 max-w-md"
          >
            {{ displayFooterNote }}
          </p>
        </div>
      </div>
    </main>

    <!-- ── Compact Footer (36px) ──────────────────────────────────── -->
    <footer class="h-9 px-6 border-t border-slate-900 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
      <div class="flex items-center gap-2 truncate">
        <UIcon name="i-heroicons-shield-check" class="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span class="truncate">{{ displayFooterNote }}</span>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0 tabular-nums">
        <span>1 USD = {{ exchangeRate.toLocaleString() }} ៛</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usePosSettings } from '~/composables/usePosSettings'
import { usePosAudio } from '~/composables/usePosAudio'
import WeAcceptPaymentStrip from '~/components/pos/WeAcceptPaymentStrip.vue'
import {
  CUSTOMER_DISPLAY_CHANNEL,
  CUSTOMER_DISPLAY_SNAPSHOT_KEY,
  CUSTOMER_DISPLAY_HEARTBEAT_KEY,
  POS_SESSION_STORAGE_KEY,
  KHR_EXCHANGE_RATE,
  HEARTBEAT_STALE_THRESHOLD_MS,
  PAYMENT_SUCCESS_DURATION_MS,
  formatUsd,
  formatCountdownMmSs,
  getHeartbeatStorageKey,
  getDisplayPresenceStorageKey,
  HEARTBEAT_INTERVAL_MS,
  getSnapshotStorageKey,
  normalizeTerminalId,
  toKhrAmount,
  createEmptyDisplaySnapshot,
  createDisplayReceiverContext,
  applyIncomingSnapshot,
  normalizeMessageToSnapshot,
  loadInitialDisplaySnapshotFromStorage,
  type CustomerDisplaySnapshot,
  type CustomerDisplayConnectionStatus,
} from '~/composables/useCustomerDisplaySync'

const route = useRoute()
const { settings: posSettings, loadSettings } = usePosSettings()
const { playAbaChime } = usePosAudio()

const activeTerminalId = computed(() => {
  const queryTerm = Array.isArray(route.query.terminal)
    ? route.query.terminal[0]
    : route.query.terminal
  return normalizeTerminalId(queryTerm || posSettings.value.terminalId || 'POS-01')
})

// ── Authoritative Display Snapshot & Receiver State Machine ─────────
const receiverCtx = createDisplayReceiverContext(undefined, activeTerminalId.value)
const currentSnapshot = ref<CustomerDisplaySnapshot>(
  createEmptyDisplaySnapshot({ terminalId: activeTerminalId.value }),
)

// ── Connection & Clock State ────────────────────────────────────────
const isBrowserOnline = ref(true)
const hasReceivedLiveBroadcast = ref(false)
const lastRegisterSeenAt = ref<number>(0)
const posExplicitlyDisconnected = ref(false)
const currentTimeStr = ref('')
const currentDateStr = ref('')

// ── Item Highlight & Scroll Tracking ────────────────────────────────
const highlightedVariantId = ref<string | null>(null)
const failedImageUrls = ref<Set<string>>(new Set())
const orderListContainerRef = ref<HTMLElement | null>(null)
const itemRowRefs = new Map<string, HTMLElement>()

let highlightTimeout: ReturnType<typeof setTimeout> | null = null
let paymentSuccessResetTimer: ReturnType<typeof setTimeout> | null = null
let clockAndLifecycleTimer: ReturnType<typeof setInterval> | null = null
let broadcastChannel: BroadcastChannel | null = null

// ── Computed View Bindings ──────────────────────────────────────────
const displayState = computed(() => currentSnapshot.value.state)
const checkoutPhase = computed(() => currentSnapshot.value.checkoutPhase)
const cartItems = computed(() => currentSnapshot.value.items)
const subtotal = computed(() => currentSnapshot.value.subtotal)
const itemDiscountsTotal = computed(() => currentSnapshot.value.itemDiscountsTotal)
const orderDiscount = computed(() => currentSnapshot.value.orderDiscount)
const totalDiscount = computed(() => currentSnapshot.value.totalDiscount)
const appliedCouponCode = computed(() => currentSnapshot.value.appliedCouponCode)
const taxAmount = computed(() => currentSnapshot.value.taxAmount)
const taxRate = computed(() => currentSnapshot.value.taxRate)
const grandTotal = computed(() => currentSnapshot.value.grandTotal)
const exchangeRate = computed(() => currentSnapshot.value.exchangeRate || KHR_EXCHANGE_RATE)
const customerName = computed(() => currentSnapshot.value.customerName)
const khqrData = computed(() => currentSnapshot.value.khqr)
const successData = computed(() => currentSnapshot.value.success)

const taxPercentLabel = computed(() => {
  const r = Number(taxRate.value) || 0
  if (r <= 0) return ''
  const pct = r <= 1 ? Math.round(r * 100) : Math.round(r)
  return ` ${pct}%`
})

const displayStoreName = computed(() => {
  return (
    currentSnapshot.value.storeName ||
    posSettings.value.receiptStoreName ||
    'Clothing Store Phnom Penh'
  )
})

const displayBranchName = computed(() => {
  return currentSnapshot.value.branchName || 'Main Flagship Store'
})

const displayFooterNote = computed(() => {
  return (
    currentSnapshot.value.receiptFooterNote ||
    posSettings.value.receiptFooterNote ||
    'Thank you for shopping with us! Items can be exchanged within 7 days.'
  )
})

const totalUnitsCount = computed(() => {
  if (currentSnapshot.value.totalItemsCount > 0) {
    return currentSnapshot.value.totalItemsCount
  }
  return cartItems.value.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
})

const khrGrandTotalFormatted = computed(() => {
  const khr = currentSnapshot.value.khrGrandTotal || toKhrAmount(grandTotal.value, exchangeRate.value)
  return khr.toLocaleString()
})

const connectionStatus = computed<CustomerDisplayConnectionStatus>(() => {
  if (!isBrowserOnline.value) return 'OFFLINE'
  if (posExplicitlyDisconnected.value) return 'RECONNECTING'
  if (hasReceivedLiveBroadcast.value) {
    const elapsed = Date.now() - lastRegisterSeenAt.value
    if (elapsed <= HEARTBEAT_STALE_THRESHOLD_MS) return 'CONNECTED'
    return 'STANDBY'
  }
  return 'STANDBY'
})

const connectionStatusLabel = computed(() => {
  switch (connectionStatus.value) {
    case 'CONNECTED':
      return 'Connected'
    case 'STANDBY':
      return 'Ready'
    case 'RECONNECTING':
      return 'Reconnecting…'
    case 'OFFLINE':
      return 'Offline'
  }
})

const connectionDotClass = computed(() => {
  switch (connectionStatus.value) {
    case 'CONNECTED':
      return 'bg-emerald-400'
    case 'STANDBY':
      return 'bg-emerald-400/80'
    case 'RECONNECTING':
      return 'bg-amber-400 animate-pulse'
    case 'OFFLINE':
      return 'bg-rose-400'
  }
})

// ── Image & Row Ref Helpers ─────────────────────────────────────────
function markImageFailed(url: string | null) {
  if (!url) return
  const next = new Set(failedImageUrls.value)
  next.add(url)
  failedImageUrls.value = next
}

function setItemRowRef(variantId: string, el: any) {
  if (el && el instanceof HTMLElement) {
    itemRowRefs.set(variantId, el)
  } else {
    itemRowRefs.delete(variantId)
  }
}

// ── Highlight & Auto-Scroll on Item Addition/Update ─────────────────
function triggerRowHighlightAndScroll(variantId: string | null) {
  if (!variantId) return
  highlightedVariantId.value = variantId
  if (highlightTimeout) clearTimeout(highlightTimeout)
  highlightTimeout = setTimeout(() => {
    if (highlightedVariantId.value === variantId) {
      highlightedVariantId.value = null
    }
  }, 1500)

  nextTick(() => {
    const rowEl = itemRowRefs.get(variantId)
    if (rowEl && typeof rowEl.scrollIntoView === 'function') {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else if (orderListContainerRef.value) {
      orderListContainerRef.value.scrollTop = orderListContainerRef.value.scrollHeight
    }
  })
}

// ── Guarded Payment Success Auto-Reset Timer ────────────────────────
function clearPaymentSuccessTimer() {
  if (paymentSuccessResetTimer) {
    clearTimeout(paymentSuccessResetTimer)
    paymentSuccessResetTimer = null
  }
}

function schedulePaymentSuccessReset(snapshot: CustomerDisplaySnapshot) {
  clearPaymentSuccessTimer()
  const completedPaymentId = snapshot.success?.paymentId
  const completedOrderSessionId = snapshot.orderSessionId
  const completedAt = snapshot.success?.completedAt || Date.now()
  const elapsed = Math.max(0, Date.now() - completedAt)
  const remainingMs = Math.max(500, PAYMENT_SUCCESS_DURATION_MS - elapsed)

  paymentSuccessResetTimer = setTimeout(() => {
    // Only reset if still showing the exact same PAYMENT_SUCCESS transaction
    // and no new order has been started by the cashier (Risk 4 protection).
    if (
      currentSnapshot.value.state === 'PAYMENT_SUCCESS' &&
      currentSnapshot.value.success?.paymentId === completedPaymentId &&
      currentSnapshot.value.orderSessionId === completedOrderSessionId
    ) {
      const idleSnap = createEmptyDisplaySnapshot({
        seq: currentSnapshot.value.seq + 1,
        timestamp: Date.now(),
        terminalId: currentSnapshot.value.terminalId,
        orderSessionId: currentSnapshot.value.orderSessionId,
        reason: 'START_NEW_SALE',
        storeName: currentSnapshot.value.storeName,
        branchName: currentSnapshot.value.branchName,
        receiptFooterNote: currentSnapshot.value.receiptFooterNote,
        exchangeRate: currentSnapshot.value.exchangeRate,
        closedOrderSessions: currentSnapshot.value.closedOrderSessions,
      })
      applyValidatedSnapshot(idleSnap, false)
    }
  }, remainingMs)
}

// ── Apply Snapshot via Deterministic Receiver State Machine ─────────
function applyValidatedSnapshot(incoming: CustomerDisplaySnapshot, isLiveEvent: boolean) {
  const result = applyIncomingSnapshot(receiverCtx, incoming, Date.now())
  if (!result.accepted) {
    // Even if preserved (e.g. POST_PAYMENT_CLEAR_PRESERVED), sync receiver snapshot metadata
    currentSnapshot.value = result.snapshot
    return
  }

  currentSnapshot.value = result.snapshot
  if (isLiveEvent) {
    hasReceivedLiveBroadcast.value = true
    posExplicitlyDisconnected.value = false
    lastRegisterSeenAt.value = Date.now()
  } else if (incoming.timestamp > 0) {
    lastRegisterSeenAt.value = Math.max(lastRegisterSeenAt.value, incoming.timestamp)
  }

  if (result.playSuccessChime && isLiveEvent) {
    playAbaChime(posSettings.value.soundSuccess)
  }

  // Handle guarded payment success reset timer (Risk 4 protection)
  if (result.snapshot.state === 'PAYMENT_SUCCESS') {
    schedulePaymentSuccessReset(result.snapshot)
  } else {
    clearPaymentSuccessTimer()
  }

  // Highlight added or quantity-updated row when in CART_ACTIVE
  if (result.snapshot.state === 'CART_ACTIVE' && result.highlightedVariantId) {
    triggerRowHighlightAndScroll(result.highlightedVariantId)
  } else if (result.snapshot.state !== 'CART_ACTIVE') {
    highlightedVariantId.value = null
  }
}

// ── Communication Channel & Storage Synchronization ─────────────────
function requestSyncFromPos() {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'REQUEST_INITIAL_STATE',
        terminalId: activeTerminalId.value,
        timestamp: Date.now(),
      })
    } catch {
      // Ignore closed channel error
    }
  }
}

function hydrateFromLocalStorageFallback() {
  if (!import.meta.client) return
  try {
    receiverCtx.boundTerminalId = activeTerminalId.value
    const hydrated = loadInitialDisplaySnapshotFromStorage(activeTerminalId.value)
    applyValidatedSnapshot(hydrated, false)
  } catch {
    // Ignore storage access errors
  }
}

function handleIncomingChannelMessage(data: any) {
  if (!data || typeof data !== 'object') return

  const msgTerminalId = data.terminalId || data.payload?.terminalId || data.snapshot?.terminalId
  if (msgTerminalId && normalizeTerminalId(msgTerminalId) !== activeTerminalId.value) {
    return
  }

  if (data.type === 'HEARTBEAT' || data.type === 'POS_HEARTBEAT') {
    hasReceivedLiveBroadcast.value = true
    posExplicitlyDisconnected.value = false
    lastRegisterSeenAt.value = Number(data.timestamp) || Date.now()
    return
  }

  if (data.type === 'POS_DISCONNECTED') {
    posExplicitlyDisconnected.value = true
    return
  }

  if (data.type === 'SETTINGS_UPDATED' && data.payload) {
    loadSettings()
    receiverCtx.boundTerminalId = activeTerminalId.value
    if (data.payload.storeName) {
      currentSnapshot.value.storeName = String(data.payload.storeName)
    }
    if (data.payload.receiptFooterNote) {
      currentSnapshot.value.receiptFooterNote = String(data.payload.receiptFooterNote)
    }
    return
  }

  const normalized = normalizeMessageToSnapshot(data, currentSnapshot.value, Date.now())
  if (normalized) {
    applyValidatedSnapshot(normalized, true)
  }
}

function handleStorageEvent(event: StorageEvent) {
  const scopedSnapKey = getSnapshotStorageKey(activeTerminalId.value)
  const scopedHbKey = getHeartbeatStorageKey(activeTerminalId.value)

  if (
    (event.key === scopedSnapKey || event.key === CUSTOMER_DISPLAY_SNAPSHOT_KEY) &&
    event.newValue
  ) {
    try {
      const parsed = JSON.parse(event.newValue)
      if (parsed && parsed.version === 1) {
        applyValidatedSnapshot(parsed as CustomerDisplaySnapshot, true)
      }
    } catch {
      // Ignore malformed storage write
    }
  } else if (
    (event.key === scopedHbKey || event.key === CUSTOMER_DISPLAY_HEARTBEAT_KEY) &&
    event.newValue
  ) {
    try {
      const hb = JSON.parse(event.newValue)
      if (!hb.terminalId || normalizeTerminalId(hb.terminalId) === activeTerminalId.value) {
        hasReceivedLiveBroadcast.value = true
        posExplicitlyDisconnected.value = false
        lastRegisterSeenAt.value = Number(hb.timestamp) || Date.now()
      }
    } catch {
      // Ignore
    }
  } else if (event.key === POS_SESSION_STORAGE_KEY) {
    hydrateFromLocalStorageFallback()
  }
}

function handleVisibilityOrFocus() {
  if (document.visibilityState === 'visible') {
    hydrateFromLocalStorageFallback()
    requestSyncFromPos()
  }
}

function handleOnline() {
  isBrowserOnline.value = true
  hydrateFromLocalStorageFallback()
  requestSyncFromPos()
}

function handleOffline() {
  isBrowserOnline.value = false
}

function updateClockAndTimers() {
  const now = new Date()
  currentTimeStr.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  currentDateStr.value = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Keep KHQR expiration countdown accurate even if a tick is missed
  if (
    currentSnapshot.value.state === 'PAYMENT_QR' &&
    currentSnapshot.value.khqr &&
    currentSnapshot.value.khqr.status === 'PENDING' &&
    currentSnapshot.value.khqr.expiresAt
  ) {
    const expMs = new Date(currentSnapshot.value.khqr.expiresAt).getTime()
    if (Number.isFinite(expMs)) {
      const secs = Math.max(0, Math.round((expMs - Date.now()) / 1000))
      currentSnapshot.value.khqr.secondsLeft = secs
      if (secs <= 0) {
        currentSnapshot.value.khqr.status = 'EXPIRED'
        currentSnapshot.value.khqr.qrImage = ''
      }
    }
  }
}

onMounted(() => {
  loadSettings()
  if (import.meta.client) {
    isBrowserOnline.value = navigator.onLine !== false
  }

  // 1. Immediately hydrate from persisted snapshot / POS storage so refresh or mid-order open works even before BroadcastChannel responds
  hydrateFromLocalStorageFallback()

  // 2. Establish BroadcastChannel and request authoritative live state from active POS tab
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL)
    broadcastChannel.onmessage = (event) => {
      handleIncomingChannelMessage(event.data)
    }
    requestSyncFromPos()
  }

  // 3. Listen to cross-tab localStorage events, visibility/focus resync, and network status
  window.addEventListener('storage', handleStorageEvent)
  window.addEventListener('focus', handleVisibilityOrFocus)
  document.addEventListener('visibilitychange', handleVisibilityOrFocus)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  updateClockAndTimers()
  clockAndLifecycleTimer = setInterval(updateClockAndTimers, 1000)

  // 4. Presence beacon so the POS can show "Customer Display online"
  writeDisplayPresence()
  presenceTimer = setInterval(writeDisplayPresence, HEARTBEAT_INTERVAL_MS)
  window.addEventListener('beforeunload', clearDisplayPresence)
})

let presenceTimer: ReturnType<typeof setInterval> | null = null

function writeDisplayPresence() {
  try {
    localStorage.setItem(
      getDisplayPresenceStorageKey(activeTerminalId.value),
      JSON.stringify({ terminalId: activeTerminalId.value, timestamp: Date.now() }),
    )
  } catch { /* storage unavailable */ }
}

function clearDisplayPresence() {
  try {
    localStorage.removeItem(getDisplayPresenceStorageKey(activeTerminalId.value))
  } catch { /* ignore */ }
}

onBeforeUnmount(() => {
  if (presenceTimer) clearInterval(presenceTimer)
  presenceTimer = null
  clearDisplayPresence()
  window.removeEventListener('beforeunload', clearDisplayPresence)
  if (clockAndLifecycleTimer) clearInterval(clockAndLifecycleTimer)
  if (highlightTimeout) clearTimeout(highlightTimeout)
  clearPaymentSuccessTimer()
  window.removeEventListener('storage', handleStorageEvent)
  window.removeEventListener('focus', handleVisibilityOrFocus)
  document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  if (broadcastChannel) {
    broadcastChannel.close()
    broadcastChannel = null
  }
})
</script>
