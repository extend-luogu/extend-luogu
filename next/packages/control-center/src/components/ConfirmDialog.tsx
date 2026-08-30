import type { JSX } from 'preact'
import { Icon } from '../icons'

export function ConfirmDialog(props: {
  readonly title: string
  readonly description: string
  readonly confirmLabel: string
  readonly pending?: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}): JSX.Element {
  return <div class="confirm-layer" role="presentation">
    <section aria-labelledby="confirm-title" aria-modal="true" class="confirm-dialog" role="alertdialog">
      <Icon name="warning" size={22}/>
      <div>
        <h3 id="confirm-title">{props.title}</h3>
        <p>{props.description}</p>
      </div>
      <div class="dialog-actions">
        <button class="button secondary" disabled={props.pending} onClick={props.onCancel} type="button">取消</button>
        <button class="button danger" disabled={props.pending} onClick={props.onConfirm} type="button">
          {props.pending ? '处理中…' : props.confirmLabel}
        </button>
      </div>
    </section>
  </div>
}
