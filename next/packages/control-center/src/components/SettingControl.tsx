import type { JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { normalizeSettingValue } from '@exlg/runtime'
import type { NumberSetting, SettingDefinition } from '@exlg/runtime'
import type { SettingValue } from '../types'

function draftValue(definition: SettingDefinition, value: SettingValue): string {
  if (definition.kind === 'number') {
    return String(typeof value === 'number' ? value : definition.default)
  }
  return definition.kind === 'string' && typeof value === 'string' ? value : ''
}

function numberConstraints(definition: NumberSetting): string {
  const parts: string[] = []
  if (definition.min !== undefined || definition.max !== undefined) {
    parts.push(`范围 ${definition.min ?? '不限'} – ${definition.max ?? '不限'}`)
  }
  if (definition.step !== undefined) parts.push(`步长 ${definition.step}`)
  if (definition.integer === true) parts.push('仅整数')
  return parts.join(' · ')
}

export function SettingControl(props: {
  readonly name: string
  readonly definition: SettingDefinition
  readonly value: SettingValue
  readonly pending: boolean
  readonly error: string | undefined
  readonly onSave: (value: SettingValue) => Promise<void>
}): JSX.Element {
  const { definition } = props
  const [draft, setDraft] = useState(draftValue(definition, props.value))
  const draftRef = useRef(draft)
  const committedRef = useRef(draft)
  useEffect(() => {
    if (definition.kind === 'string' || definition.kind === 'number') {
      const next = draftValue(definition, props.value)
      draftRef.current = next
      committedRef.current = next
      setDraft(next)
    }
  }, [definition, props.value])

  const description = definition.description === undefined
    ? null
    : <span class="setting-description">{definition.description}</span>

  if (definition.kind === 'boolean') {
    return <div class="setting-row">
      <div class="setting-copy">
        <span class="setting-title">{definition.title}</span>
        {description}
      </div>
      <label class="switch-control">
        <span class="sr-only">{definition.title}</span>
        <input
          checked={props.value === true}
          disabled={props.pending}
          onChange={event => void props.onSave(event.currentTarget.checked)}
          role="switch"
          type="checkbox"
        />
        <span aria-hidden="true" class="switch-track"/>
      </label>
      {props.error && <span aria-live="polite" class="inline-error">{props.error}</span>}
    </div>
  }

  if (definition.kind === 'select') {
    return <label class="setting-row setting-column">
      <span class="setting-title">{definition.title}</span>
      {description}
      <select
        disabled={props.pending}
        onChange={event => void props.onSave(event.currentTarget.value)}
        value={typeof props.value === 'string' ? props.value : definition.default}
      >
        {definition.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {props.error && <span aria-live="polite" class="inline-error">{props.error}</span>}
    </label>
  }

  if (definition.kind === 'multiSelect') {
    const selected = new Set(Array.isArray(props.value) ? props.value : definition.default)
    return <fieldset class="setting-row setting-column multi-select-setting">
      <legend class="setting-title">{definition.title}</legend>
      {description}
      <div class="multi-select-options">
        {definition.options.map(option => <label class="multi-select-option" key={option.value}>
          <input
            checked={selected.has(option.value)}
            disabled={props.pending}
            onChange={event => {
              const next = new Set(selected)
              if (event.currentTarget.checked) next.add(option.value)
              else next.delete(option.value)
              void props.onSave(definition.options
                .filter(candidate => next.has(candidate.value))
                .map(candidate => candidate.value))
            }}
            type="checkbox"
          />
          <span>{option.label}</span>
        </label>)}
      </div>
      {props.pending && <span class="pending-note">正在保存…</span>}
      {props.error && <span aria-live="polite" class="inline-error">{props.error}</span>}
    </fieldset>
  }

  const commit = (): void => {
    if (draftRef.current === committedRef.current) return
    if (definition.kind === 'number') {
      const parsed = Number(draftRef.current)
      if (draftRef.current.trim() === '' || normalizeSettingValue(definition, parsed) === undefined) return
      committedRef.current = draftRef.current
      void props.onSave(parsed)
      return
    }
    committedRef.current = draftRef.current
    void props.onSave(draftRef.current)
  }
  return <label class="setting-row setting-column">
    <span class="setting-title">{definition.title}</span>
    {description}
    <input
      disabled={props.pending}
      onBlur={commit}
      onInput={event => {
        draftRef.current = event.currentTarget.value
        setDraft(event.currentTarget.value)
      }}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
          event.currentTarget.blur()
        }
      }}
      {...(definition.kind === 'number' ? {
        inputMode: 'decimal',
        max: definition.max,
        min: definition.min,
        step: definition.step ?? (definition.integer === true ? 1 : 'any'),
        type: 'number',
      } : { type: 'text' })}
      value={draft}
    />
    {definition.kind === 'number' && numberConstraints(definition) !== ''
      && <span class="setting-constraints">{numberConstraints(definition)}</span>}
    {props.pending && <span class="pending-note">正在保存…</span>}
    {props.error && <span aria-live="polite" class="inline-error">{props.error}</span>}
  </label>
}
