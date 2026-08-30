import type { JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { SettingDefinition } from '@exlg/runtime'
import type { SettingValue } from '../types'

export function SettingControl(props: {
  readonly name: string
  readonly definition: SettingDefinition
  readonly value: SettingValue
  readonly pending: boolean
  readonly error: string | undefined
  readonly onSave: (value: SettingValue) => Promise<void>
}): JSX.Element {
  const { definition } = props
  const [draft, setDraft] = useState(typeof props.value === 'string' ? props.value : '')
  const draftRef = useRef(draft)
  const committedRef = useRef(draft)
  useEffect(() => {
    if (typeof props.value === 'string') {
      draftRef.current = props.value
      committedRef.current = props.value
      setDraft(props.value)
    }
  }, [props.value])

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

  const commit = (): void => {
    if (draftRef.current !== committedRef.current) {
      committedRef.current = draftRef.current
      void props.onSave(draftRef.current)
    }
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
      type="text"
      value={draft}
    />
    {props.pending && <span class="pending-note">正在保存…</span>}
    {props.error && <span aria-live="polite" class="inline-error">{props.error}</span>}
  </label>
}
