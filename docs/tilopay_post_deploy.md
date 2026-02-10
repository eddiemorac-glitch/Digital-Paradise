# Tilopay — Configuración Post-Deploy

## Pre-requisitos
- Cuenta activa en [Tilopay Admin](https://admin.tilopay.com)
- Dominio definitivo (ej: `api.caribedigital.cr`, `app.caribedigital.cr`)

---

## 1. Variables de Entorno en Producción

Actualizar en el servidor de producción (`.env` o dashboard de hosting):

```env
# === TILOPAY (PRODUCCIÓN) ===
TILOPAY_API_KEY=<tu-api-key-producción>
TILOPAY_API_USER=<tu-api-user-producción>
TILOPAY_API_PASSWORD=<tu-api-password-producción>
TILOPAY_SANDBOX=false

# === URLs DEFINITIVAS ===
FRONTEND_URL=https://app.caribedigital.cr
BACKEND_URL=https://api.caribedigital.cr
```

> [!CAUTION]
> Cambiar `TILOPAY_SANDBOX=false` activa pagos REALES. Verifica todo en sandbox antes.

---

## 2. Configurar Webhook en Tilopay Admin

1. Ir a **Tilopay Admin → Configuración → Webhooks**
2. Agregar URL de webhook:
   ```
   https://api.caribedigital.cr/api/payments/tilopay-webhook
   ```
3. Seleccionar eventos: `payment.approved`, `payment.declined`, `payment.error`
4. Copiar el **Webhook Secret** que Tilopay genera
5. Agregar la variable de entorno (si Tilopay usa un secret diferente al API Key para firmar webhooks):
   ```env
   TILOPAY_WEBHOOK_SECRET=<el-secret-del-webhook>
   ```

> [!IMPORTANT]
> En producción, la verificación de firma es **estricta**. Si la firma no coincide, el webhook será rechazado con 400.

---

## 3. Configurar URL de Redirect en Tilopay Admin

1. En **Tilopay Admin → Configuración → URLs de retorno**
2. URL de éxito y error:
   ```
   https://app.caribedigital.cr/payment/callback
   ```
3. Esta URL ya se envía automáticamente en cada `processPayment`, pero Tilopay puede requerir que esté whitelisted.

---

## 4. Actualizar Billing Info (Opcional pero Recomendado)

En `tilopay.service.ts`, los datos de facturación están hardcodeados. Para producción, actualizar `createPaymentSession()` para pasar datos reales del usuario:

```typescript
// Reemplazar estos valores hardcodeados:
billToFirstName: user.firstName,
billToLastName: user.lastName,
billToEmail: user.email,
billToAddress: order.deliveryAddress,
billToTelephone: user.phone,
```

---

## 5. Verificación Final Post-Deploy

### Checklist
- [ ] `TILOPAY_SANDBOX=false` en producción
- [ ] URLs de webhook configuradas en Tilopay Admin
- [ ] Firma de webhook verificada con el secret correcto
- [ ] Redirect URL whitelisted en Tilopay Admin
- [ ] Probar un pago real de ₡1.00 (monto mínimo)
- [ ] Verificar que el webhook llega y actualiza la orden
- [ ] Verificar que el redirect muestra "¡Éxito!" al volver
- [ ] Verificar en Tilopay Admin que la transacción aparece
- [ ] Probar un reembolso desde el panel admin

### Test de Humo
```bash
# 1. Crear un pedido y pagar con tarjeta real
# 2. Verificar en la BD que paymentStatus = 'PAID'
# 3. Verificar en Tilopay Admin que la transacción aparece como "Aprobada"
# 4. Hacer refund desde el panel admin
# 5. Verificar que el refund se refleja en Tilopay
```

---

## 6. Arquitectura del Flujo de Pago

```
Usuario → Frontend (PaymentModal) → Backend (createPaymentSession)
  → Tilopay API (processPayment) → Redirect URL
  → Usuario paga en Tilopay → Redirect a /payment/callback
  → Frontend (PaymentCallbackPage) → Backend (verify-payment)
  → Orden actualizada a PAID ✅

Tilopay (async) → Webhook → Backend (tilopay-webhook)
  → Orden actualizada a PAID (idempotente) ✅
```

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `backend/src/modules/payments/tilopay.service.ts` | Lógica core: auth, crear sesión, verificar firma, refund |
| `backend/src/modules/payments/payments.controller.ts` | Endpoints: tilopay-token, verify-payment, refund |
| `backend/src/modules/payments/tilopay-webhook.controller.ts` | Recibe webhooks de Tilopay |
| `frontend/src/components/PaymentModal.tsx` | Modal de checkout → redirect a Tilopay |
| `frontend/src/pages/PaymentCallbackPage.tsx` | Página de retorno después del pago |
