// A component of the expenses feature: the payment-method dropdown (the design system's SelectField), listing every
// method by its label. Used by the Add dialog and the Edit expense drawer.

import { SelectField, type SelectOption } from "@primecoderin/fast-ui-react"
import { useMemo } from "react"

import { useLanguage } from "@/shared/i18n"

import type { PaymentMethod } from "../../api"
import { isPaymentMethod, PAYMENT_METHODS, paymentMethodLabel } from "../../payment-methods"

interface PaymentMethodSelectProps {
  /** The chosen method (there's always one). */
  value: PaymentMethod
  /** Called with the newly chosen method. */
  onChange: (value: PaymentMethod) => void
  /** Kept for callers that tie the control to a label; the field names itself from `label` or `ariaLabel`. */
  id?: string
  className?: string
  /** The visible label above the dropdown. Without it the label is only for assistive technology. */
  label?: string
  /** For a dropdown with no visible label. */
  ariaLabel?: string
}

/**
 * The payment-method dropdown, used by both the Add dialog and the edit drawer. It always shows one of
 * the methods; `onChange` gets only a valid one (the select reports plain strings, so each is checked first).
 */
export function PaymentMethodSelect({ value, onChange, className, label, ariaLabel }: PaymentMethodSelectProps) {
  const { language } = useLanguage()
  const options = useMemo<SelectOption[]>(
    () => PAYMENT_METHODS.map((method) => ({ value: method, label: paymentMethodLabel(method, language) })),
    [language],
  )
  return (
    <div className={className}>
      <SelectField
        label={label ?? ariaLabel ?? paymentMethodLabel(value, language)}
        hideLabel={label === undefined}
        options={options}
        value={value}
        onValueChange={(next) => isPaymentMethod(next) && onChange(next)}
        size="small"
      />
    </div>
  )
}
