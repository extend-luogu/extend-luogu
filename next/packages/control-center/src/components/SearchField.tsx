import type { JSX } from 'preact'
import { Icon } from '../icons'

export function SearchField(props: {
  readonly value: string
  readonly onInput: (value: string) => void
  readonly inputRef?: (node: HTMLInputElement | null) => void
}): JSX.Element {
  return <label class="search-field">
    <span class="sr-only">搜索功能</span>
    <Icon name="search"/>
    <input
      onInput={event => props.onInput(event.currentTarget.value)}
      placeholder="搜索名称、ID、分类、能力或设置…"
      {...(props.inputRef === undefined ? {} : { ref: props.inputRef })}
      type="search"
      value={props.value}
    />
  </label>
}
