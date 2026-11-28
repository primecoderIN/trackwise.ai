// A2UI's input components (TextField, ChoicePicker, DateTimeInput), drawn with @primecoderin/fast-ui-react inputs.
// Part of the assistant feature's A2UI renderer; catalogs.ts lists them under BASIC_CATALOG.
//
// Two-way data binding: each input shows the value at its bound path in the surface's data model, and
// writes what the user does back to that path. That happens in the browser only; nothing is sent to the
// agent until a button's action fires. An input given a plain value instead of a binding has nowhere to
// write, so it's read-only. Paths are checked by protocol.ts, which refuses "__proto__" and friends.

import { SelectField, TextAreaField, TextField, type SelectOption } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"

import { DatePicker } from "@/shared/components/date-picker"
import { LabeledField } from "@/shared/components/labeled-field"
import { isObject } from "@/shared/lib/guards"

import { Unsupported } from "./a2ui-unsupported"
import { CHOICE_VARIANT, TEXT_FIELD_VARIANT } from "./basic-catalog"
import { boundPath, resolve, textOf, type A2uiComponent, type A2uiRenderContext } from "../protocol"

interface InputProps {
  node: A2uiComponent
  ctx: A2uiRenderContext
}

function inputId(ctx: A2uiRenderContext, node: A2uiComponent): string {
  return `a2ui-${ctx.surface.id}-${node.id}`
}

function canEdit(ctx: A2uiRenderContext, path: string | null): path is string {
  return !ctx.locked && path !== null && ctx.onChange !== undefined
}

/**
 * A2UI's TextField: a one-line text box, or a text area for the "longText" variant. "number" stays a text
 * box with a decimal keypad, because an amount like "450.50" must keep its exact digits.
 */
export function A2uiTextField({ node, ctx }: InputProps) {
  const id = inputId(ctx, node)
  const path = boundPath(node.value)
  const editable = canEdit(ctx, path)
  const label = textOf(node.label, ctx.surface.data)
  const value = textOf(node.value, ctx.surface.data)
  const placeholder = textOf(node.placeholder, ctx.surface.data) || undefined
  const onValueChange = (next: string) => {
    if (editable) ctx.onChange?.(ctx.surface.id, path, next)
  }

  if (node.variant === TEXT_FIELD_VARIANT.longText) {
    return (
      <TextAreaField
        label={label}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        disabled={!editable}
        rows={2}
        size="small"
      />
    )
  }

  return (
    <TextField
      id={id}
      label={label}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={!editable}
      type={node.variant === TEXT_FIELD_VARIANT.obscured ? "password" : "text"}
      inputMode={node.variant === TEXT_FIELD_VARIANT.number ? "decimal" : undefined}
      size="small"
    />
  )
}

interface ChoiceOption {
  label: unknown
  value: string
}

function isOption(option: unknown): option is ChoiceOption {
  return isObject(option) && typeof option.value === "string" && option.value !== ""
}

/**
 * A2UI's ChoicePicker (the basic catalog has no "Select"), drawn as SelectField for one choice.
 * Only one choice at a time is supported: a multiple-selection picker becomes a "Can't show …" note.
 */
export function A2uiChoicePicker({ node, ctx }: InputProps) {
  const t = useTranslations("assistant")
  if (node.variant === CHOICE_VARIANT.multipleSelection) return <Unsupported reason="multipleChoice" />
  const path = boundPath(node.value)
  const editable = canEdit(ctx, path)
  const rawOptions = Array.isArray(node.options) ? node.options.filter(isOption) : []
  const options: SelectOption[] = rawOptions.map((option) => ({
    value: option.value,
    label: textOf(option.label, ctx.surface.data) || option.value,
  }))
  const current = resolve(node.value, ctx.surface.data)
  const rawSelected = Array.isArray(current) && typeof current[0] === "string" ? current[0] : ""
  const selected = options.some((option) => option.value === rawSelected) ? rawSelected : ""

  return (
    <SelectField
      label={textOf(node.label, ctx.surface.data)}
      options={options}
      value={selected}
      disabled={!editable}
      placeholder={t("cards.choose")}
      size="small"
      onValueChange={(value) => {
        if (editable) ctx.onChange?.(ctx.surface.id, path, [value])
      }}
    />
  )
}

/**
 * A2UI's DateTimeInput, dates only. A time picker (or one with neither dates nor times enabled) becomes a
 * "Can't show …" note; the date picker itself is its own component, so its hooks always run.
 */
export function A2uiDateTimeInput({ node, ctx }: InputProps) {
  if (node.enableDate !== true || node.enableTime === true) return <Unsupported reason="timePicker" />
  return <A2uiDatePicker node={node} ctx={ctx} />
}

function A2uiDatePicker({ node, ctx }: InputProps) {
  const t = useTranslations("assistant")
  const id = inputId(ctx, node)
  const path = boundPath(node.value)
  const editable = canEdit(ctx, path)
  const raw = resolve(node.value, ctx.surface.data)
  const value = typeof raw === "string" ? raw : ""
  const label = textOf(node.label, ctx.surface.data)

  return (
    <LabeledField id={id} label={label}>
      <DatePicker
        id={id}
        value={value}
        disabled={!editable}
        placeholder={t("cards.pickDate")}
        ariaLabel={label}
        onChange={(picked) => {
          if (picked && editable) ctx.onChange?.(ctx.surface.id, path, picked)
        }}
      />
    </LabeledField>
  )
}
